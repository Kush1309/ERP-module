const { req, check, login, summary } = require('./lib');
// End-to-end API suite. Run against an EMPTY test database only:
//   E2E_CONFIRM_EMPTY_TEST_DB=yes ADMIN_PASSWORD=... npm run test:e2e
if (process.env.E2E_CONFIRM_EMPTY_TEST_DB !== 'yes') {
  console.error('Refusing to run: this suite creates students, fees, notices, etc.\n'
    + 'Point the API at an empty test database and set E2E_CONFIRM_EMPTY_TEST_DB=yes.');
  process.exit(1);
}
if (!process.env.ADMIN_PASSWORD) {
  console.error('ADMIN_PASSWORD (the seeded admin password) is required.');
  process.exit(1);
}
const { S, core, academics, today, uniq } = require('./coreFlows');

async function parents() {
  console.log('== PARENTS (admin mgmt + portal)');
  let r = await req('POST', '/parents', { token: S.admin, body: { firstName: 'Par', lastName: 'Ent', phone: '9000000001', email: `p${uniq}@x.com`, studentIds: [S.stu1._id] } });
  check('admin creates parent', r.status === 201, r);
  S.parent = r.body?.data?.parent; S.parCred = r.body?.data?.credentials;
  r = await req('POST', '/parents', { token: S.admin, body: { firstName: 'X' } });
  check('parent missing fields 400', r.status === 400, r);
  r = await req('POST', '/parents', { token: S.admin, body: { firstName: 'X', lastName: 'Y', phone: '1', studentIds: ['000000000000000000000000'] } });
  check('parent with unknown student 400', r.status === 400, r);
  r = await req('GET', '/parents?search=Par', { token: S.admin });
  check('list parents', r.status === 200 && r.body.data.parents.length >= 1, r);
  r = await req('GET', '/parents', { token: S.t1Tok });
  check('teacher cannot manage parents', r.status === 403, r);
  S.parTok = await login(S.parCred.loginId, S.parCred.temporaryPassword);
  r = await req('GET', '/parent/students', { token: S.parTok });
  check('parent sees linked student', r.status === 200 && r.body.data.length === 1 && r.body.data[0]._id === S.stu1._id, r);
  r = await req('GET', `/parent/students/${S.stu2._id}`, { token: S.parTok });
  check('parent cannot view unlinked student 403', r.status === 403, r);
  r = await req('GET', `/parent/students/${S.stu1._id}/results`, { token: S.parTok });
  check('parent sees child results', r.status === 200, r);
  r = await req('GET', `/parent/students/${S.stu2._id}/results`, { token: S.parTok });
  check('parent cannot see unlinked results', r.status === 403, r);
  r = await req('GET', `/parent/students/${S.stu1._id}/timetable`, { token: S.parTok });
  check('parent sees child timetable', r.status === 200 && JSON.stringify(r.body).includes('R1'), r);
  r = await req('GET', '/parent/notices', { token: S.parTok });
  check('parent notices', r.status === 200 && JSON.stringify(r.body).includes('All notice'), r);
  r = await req('PUT', `/parents/${S.parent._id}`, { token: S.admin, body: { studentIds: [S.stu1._id, S.stu2._id] } });
  check('admin links 2nd child', r.status === 200 && r.body.data.parent.students.length === 2, r);
  r = await req('GET', `/parent/students/${S.stu2._id}`, { token: S.parTok });
  check('parent sees newly linked child', r.status === 200, r);
}

async function attendance() {
  console.log('== ATTENDANCE');
  let r = await req('GET', '/attendance/roster', { token: S.t1Tok });
  check('teacher roster', r.status === 200 && r.body.data.length >= 2, r);
  const roster = r.body.data || [];
  check('roster excludes 8B student', !roster.some(s => s._id === S.stu3._id), roster.map(s=>s.firstName));
  r = await req('POST', '/attendance/bulk', { token: S.t1Tok, body: { date: today, attendance: roster.map((s, i) => ({ student: s._id, status: i === 0 ? 'ABSENT' : 'PRESENT' })) } });
  check('teacher bulk attendance', r.status === 201 || r.status === 200, r);
  r = await req('POST', '/attendance/bulk', { token: S.t1Tok, body: { date: today, attendance: [{ student: roster[0]._id, status: 'PRESENT' }] } });
  check('duplicate attendance 409', r.status === 409, r);
  r = await req('POST', '/attendance/bulk', { token: S.t1Tok, body: { date: '2026-01-05', attendance: [{ student: S.stu3._id, status: 'PRESENT' }] } });
  check('teacher cannot mark other section 403', r.status === 403, r);
  r = await req('GET', '/attendance/teacher/history', { token: S.t1Tok });
  check('teacher history', r.status === 200, r);
  const histRecords = r.body?.data?.records || r.body?.data?.attendance || r.body?.data;
  r = await req('GET', '/attendance/teacher/report', { token: S.t1Tok });
  check('teacher report', r.status === 200, r);
  r = await req('GET', '/attendance/me', { token: S.stu1Tok });
  check('student own attendance', r.status === 200, r);
  r = await req('GET', '/attendance/me/history', { token: S.stu1Tok });
  check('student attendance history', r.status === 200, r);
  r = await req('GET', '/attendance/admin/records', { token: S.admin });
  check('admin records', r.status === 200, r);
  const recs = Array.isArray(r.body?.data) ? r.body.data : (r.body?.data?.records || []);
  S.att = Array.isArray(recs) ? recs[0] : null;
  r = await req('GET', '/attendance/admin/report', { token: S.admin });
  check('admin report', r.status === 200, r);
  r = await req('GET', '/attendance/admin/analytics', { token: S.admin });
  check('admin analytics', r.status === 200, r);
  r = await req('GET', '/attendance/admin/audit', { token: S.admin });
  check('admin audit', r.status === 200, r);
  r = await req('GET', '/attendance/admin/export', { token: S.admin });
  check('admin export', r.status === 200, r);
  if (S.att) {
    r = await req('PATCH', `/attendance/admin/records/${S.att._id}`, { token: S.admin, body: { status: S.att.status === 'PRESENT' ? 'ABSENT' : 'PRESENT' } });
    check('admin update attendance', r.status === 200, r);
  } else check('admin records shape has records', false, recs);
  r = await req('GET', `/parent/students/${S.stu1._id}/attendance`, { token: S.parTok });
  check('parent sees child attendance', r.status === 200 && JSON.stringify(r.body).includes('status'), r);
  r = await req('GET', '/attendance/admin/records', { token: S.stu1Tok });
  check('student cannot access admin attendance 403', r.status === 403, r);
}

async function homeworkLeave() {
  console.log('== HOMEWORK');
  let r = await req('POST', '/homework', { token: S.t1Tok, body: { title: 'HW1', description: 'Do it', class: '8', section: 'A', subject: 'Maths', dueDate: '2026-12-01', status: 'PUBLISHED' } });
  check('teacher create homework', r.status === 201, r);
  S.hw = r.body?.data || r.body;
  r = await req('POST', '/homework', { token: S.t1Tok, body: { title: 'HW-x', class: '9', section: 'B', subject: 'Maths' } });
  check('teacher cannot create for other class 403', r.status === 403, r);
  r = await req('GET', '/homework', { token: S.stu1Tok });
  check('student sees homework', r.status === 200 && JSON.stringify(r.body).includes('HW1'), r);
  r = await req('GET', '/homework', { token: S.stu3Tok });
  check('8B student does not see 8A homework', r.status === 200 && !JSON.stringify(r.body).includes('HW1'), r);
  r = await req('GET', '/homework', { token: S.parTok });
  check('parent sees child homework', r.status === 200 && JSON.stringify(r.body).includes('HW1'), r);
  r = await req('PUT', `/homework/${S.hw?._id}`, { token: S.t2Tok, body: { title: 'hack' } });
  check('other teacher cannot edit 403', r.status === 403, r);
  r = await req('PUT', `/homework/${S.hw?._id}`, { token: S.t1Tok, body: { title: 'HW1 edited' } });
  check('teacher edits homework', r.status === 200, r);
  r = await req('POST', '/homework', { token: S.stu1Tok, body: { title: 'x', class: '8', section: 'A', subject: 'm' } });
  check('student cannot create homework', r.status === 403, r);

  console.log('== LEAVES');
  r = await req('POST', '/leaves', { token: S.stu1Tok, body: { startDate: '2026-11-01', endDate: '2026-11-02', type: 'SICK', reason: 'Fever' } });
  check('student apply leave', r.status === 201, r);
  S.leave = r.body?.data || r.body;
  r = await req('POST', '/leaves', { token: S.stu1Tok, body: { startDate: '2026-11-05', endDate: '2026-11-02', type: 'SICK', reason: 'x' } });
  check('leave end<start 400', r.status === 400, r);
  r = await req('POST', '/leaves', { token: S.t1Tok, body: { startDate: '2026-11-01', endDate: '2026-11-01', type: 'CASUAL', reason: 'Personal' } });
  check('teacher apply leave', r.status === 201, r);
  r = await req('GET', '/leaves', { token: S.stu1Tok });
  check('student sees own leave', r.status === 200 && JSON.stringify(r.body).includes('Fever'), r);
  r = await req('GET', '/leaves', { token: S.stu3Tok });
  check('other student does not see leave', r.status === 200 && !JSON.stringify(r.body).includes('Fever'), r);
  r = await req('GET', '/leaves', { token: S.parTok });
  check('parent sees child leave', r.status === 200 && JSON.stringify(r.body).includes('Fever'), r);
  r = await req('PUT', `/leaves/${S.leave._id}`, { token: S.stu1Tok, body: { endDate: '2026-10-01' } });
  check('leave update end<start rejected', r.status === 400, r);
  r = await req('PATCH', `/leaves/${S.leave._id}/status`, { token: S.stu1Tok, body: { status: 'APPROVED' } });
  check('student cannot approve 403', r.status === 403, r);
  r = await req('PATCH', `/leaves/${S.leave._id}/status`, { token: S.admin, body: { status: 'APPROVED', adminComment: 'ok' } });
  check('admin approves leave', r.status === 200 && JSON.stringify(r.body).includes('APPROVED'), r);
  r = await req('PUT', `/leaves/${S.leave._id}`, { token: S.stu1Tok, body: { reason: 'changed' } });
  check('cannot edit approved leave', r.status === 400, r);
}

async function library() {
  console.log('== LIBRARY');
  let r = await req('POST', '/library/books', { token: S.admin, body: { title: 'Book A', author: 'Auth', isbn: 'ISBN' + uniq, category: 'Fiction', totalCopies: 1 } });
  check('create book', r.status === 201, r);
  S.book = r.body?.data;
  r = await req('POST', '/library/books', { token: S.admin, body: { title: 'Book A', author: 'Auth', isbn: 'ISBN' + uniq, category: 'Fiction', totalCopies: 1 } });
  check('duplicate isbn 409', r.status === 409, r);
  r = await req('GET', '/library/books?search=Book', { token: S.stu1Tok });
  check('student browse books', r.status === 200 && r.body.data.length >= 1, r);
  const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
  r = await req('POST', '/library/issues', { token: S.admin, body: { bookId: S.book._id, requesterId: S.stu1._id, requesterModel: 'Student', dueDate: due } });
  check('issue book', r.status === 201, r);
  S.issue = r.body?.data;
  r = await req('POST', '/library/issues', { token: S.admin, body: { bookId: S.book._id, requesterId: S.stu2._id, requesterModel: 'Student', dueDate: due } });
  check('no copies left 409', r.status === 409, r);
  r = await req('GET', `/library/books/${S.book._id}`, { token: S.admin });
  check('available copies decremented', r.body?.data?.availableCopies === 0, r);
  r = await req('GET', '/library/issues', { token: S.stu1Tok });
  check('student sees own issue', r.status === 200 && r.body.data.length === 1, r);
  r = await req('GET', '/library/issues', { token: S.stu3Tok });
  check('other student sees no issues', r.status === 200 && r.body.data.length === 0, r);
  r = await req('GET', '/library/issues', { token: S.parTok });
  check('parent sees child issue', r.status === 200 && r.body.data.length === 1, r);
  r = await req('GET', '/library/issues', { token: S.t1Tok });
  check('teacher sees only own issues', r.status === 200 && r.body.data.length === 0, r);
  r = await req('PATCH', `/library/issues/${S.issue?._id}/return`, { token: S.admin });
  check('return book', r.status === 200, r);
  r = await req('PATCH', `/library/issues/${S.issue?._id}/return`, { token: S.admin });
  check('double return 409', r.status === 409, r);
  r = await req('GET', `/library/books/${S.book._id}`, { token: S.admin });
  check('available copies restored', r.body?.data?.availableCopies === 1, r);
  r = await req('DELETE', `/library/books/${S.book._id}`, { token: S.stu1Tok });
  check('student cannot delete book', r.status === 403, r);
}

async function fees() {
  console.log('== FEES');
  let r = await req('POST', '/fees/structures', { token: S.admin, body: { title: 'Tuition Q1', amount: 1000, dueDate: '2026-12-31', applicableClasses: ['8'], academicYear: '2026-2027' } });
  check('create fee structure', r.status === 201, r);
  S.fs = r.body?.data;
  r = await req('POST', '/fees/records', { token: S.admin, body: { studentId: S.stu1._id, feeStructureId: S.fs?._id } });
  check('assign fee', r.status === 201, r);
  S.fr = r.body?.data;
  r = await req('POST', '/fees/records', { token: S.admin, body: { studentId: S.stu1._id, feeStructureId: S.fs?._id } });
  check('duplicate fee assignment 409', r.status === 409, r);
  r = await req('POST', '/fees/records', { token: S.admin, body: { studentId: S.stu2._id, feeStructureId: S.fs?._id } });
  S.fr2 = r.body?.data;
  r = await req('PATCH', `/fees/records/${S.fr?._id}/pay`, { token: S.admin, body: { paymentAmount: '400' } });
  check('partial payment (PATCH, string amount)', r.status === 200 && r.body.data.amountPaid === 400 && r.body.data.status === 'PARTIAL', r);
  r = await req('PATCH', `/fees/records/${S.fr?._id}/pay`, { token: S.admin, body: { paymentAmount: 700 } });
  check('overpayment rejected', r.status === 400, r);
  r = await req('PATCH', `/fees/records/${S.fr?._id}/pay`, { token: S.admin, body: { paymentAmount: 600 } });
  check('final payment -> PAID', r.status === 200 && r.body.data.status === 'PAID', r);
  r = await req('PATCH', `/fees/records/${S.fr?._id}/pay`, { token: S.stu1Tok, body: { paymentAmount: 1 } });
  check('student cannot pay 403', r.status === 403, r);
  r = await req('GET', '/fees/records', { token: S.stu1Tok });
  check('student sees only own fees', r.status === 200 && r.body.data.length === 1, r);
  r = await req('GET', '/fees/records', { token: S.stu3Tok });
  check('8B student sees no fees', r.status === 200 && r.body.data.length === 0, r);
  r = await req('GET', '/fees/records', { token: S.parTok });
  check('parent sees children fees', r.status === 200 && r.body.data.length === 2, r);
  r = await req('GET', '/fees/records', { token: S.t2Tok });
  check('teacher (9B) sees no 8A fees', r.status === 200 && r.body.data.length === 0, r);
  r = await req('GET', `/fees/records/${S.fr2?._id}`, { token: S.stu1Tok });
  check('student cannot open other student fee 403', r.status === 403, r);
  r = await req('DELETE', `/fees/structures/${S.fs?._id}`, { token: S.admin });
  check('cannot delete structure in use', r.status === 400 || r.status === 409, r);
}

async function transport() {
  console.log('== TRANSPORT');
  let r = await req('POST', '/transport/routes', { token: S.admin, body: { name: 'Route ' + uniq, vehicleNumber: 'UP14' + uniq, driverName: 'Driver', capacity: 1, stops: ['Stop A', 'Stop B'] } });
  check('create route', r.status === 201, r);
  S.route = r.body?.data?.route || r.body?.data;
  r = await req('POST', '/transport/allocations', { token: S.admin, body: { studentId: S.stu1._id, routeId: S.route?._id, pickupStop: 'Stop A', dropStop: 'Stop B' } });
  check('allocate student', r.status === 201, r);
  r = await req('POST', '/transport/allocations', { token: S.admin, body: { studentId: S.stu2._id, routeId: S.route?._id, pickupStop: 'Stop A', dropStop: 'Stop B' } });
  check('capacity exceeded rejected', r.status === 400 || r.status === 409, r);
  r = await req('POST', '/transport/allocations', { token: S.admin, body: { studentId: S.stu1._id, routeId: S.route?._id, pickupStop: 'Nope', dropStop: 'Stop B' } });
  check('invalid stop 400', r.status === 400 || r.status === 409, r);
  r = await req('GET', '/transport/allocations', { token: S.stu1Tok });
  check('student sees own allocation', r.status === 200 && JSON.stringify(r.body).includes('Stop A'), r);
  r = await req('GET', '/transport/allocations', { token: S.stu3Tok });
  check('other student sees none', r.status === 200 && !JSON.stringify(r.body).includes('Stop A'), r);
  r = await req('GET', '/transport/routes', { token: S.t1Tok });
  check('teacher can view routes', r.status === 200, r);
}

async function messaging() {
  console.log('== MESSAGING');
  let r = await req('GET', '/messages/contacts', { token: S.stu1Tok });
  check('student contacts', r.status === 200 && Array.isArray(r.body.data), r);
  const contacts = r.body?.data || [];
  const teacherContact = contacts.find(c => c.role === 'TEACHER');
  check('student contacts include class teacher', !!teacherContact && teacherContact.name.includes('Tch1'), contacts);
  check('student contacts exclude other teacher', !contacts.some(c => c.name.startsWith('Tch2')), contacts);
  r = await req('POST', '/messages/conversations', { token: S.stu1Tok, body: { participantIds: [teacherContact?._id] } });
  check('student starts conversation', r.status === 201, r);
  S.conv = r.body?.data;
  r = await req('POST', `/messages/conversations/${S.conv?._id}`, { token: S.stu1Tok, body: { content: 'Hello teacher' } });
  check('send message', r.status === 201, r);
  r = await req('GET', '/messages/conversations', { token: S.t1Tok });
  check('teacher sees conversation with names', r.status === 200 && JSON.stringify(r.body).includes('Stu1'), r);
  r = await req('GET', `/messages/conversations/${S.conv?._id}`, { token: S.t2Tok });
  check('outsider cannot read conversation', r.status === 404, r);
  r = await req('GET', '/messages/contacts', { token: S.stu3Tok });
  const c3 = r.body?.data || [];
  r = await req('POST', '/messages/conversations', { token: S.stu3Tok, body: { participantIds: [teacherContact?._id] } });
  check('8B student cannot message 8A teacher', r.status === 403, r);
}

async function dashboards() {
  console.log('== DASHBOARDS');
  let r = await req('GET', '/dashboard/admin', { token: S.admin });
  check('admin dashboard', r.status === 200, r);
  r = await req('GET', '/dashboard/student', { token: S.stu1Tok });
  check('student dashboard', r.status === 200, r);
  const d = r.body?.data || {};
  check('student dash: notices.recent populated', (d.notices?.recent || []).some(n => n.title === 'All notice'), d.notices);
  check('student dash: fees fully paid -> 0 pending', d.fees?.pendingAmount === 0, d.fees);
  check('student dash: attendance counted', (d.attendance?.present || 0) + (d.attendance?.absent || 0) === 1, d.attendance);
  check('student dash: homework pending counted', d.homework?.pending === 1 && d.homework?.next?.title?.startsWith('HW1'), d.homework);
  r = await req('GET', '/dashboard/student', { token: S.stu2Tok });
  check('student2 dash: pending fee 1000', r.body?.data?.fees?.pendingAmount === 1000, r.body?.data?.fees);
  r = await req('GET', '/dashboard/teacher', { token: S.t1Tok });
  check('teacher dashboard', r.status === 200, r);
  check('teacher dash: unread message from student', (r.body?.data?.messages?.recent || []).some(m => m.sender.startsWith('Stu1')), r.body?.data?.messages);
  check('teacher dash: attendance today', r.body?.data?.attendance?.present + r.body?.data?.attendance?.absent >= 2, r.body?.data?.attendance);
  r = await req('GET', '/dashboard/admin', { token: S.admin });
  check('admin dash: fees totals', r.body?.data?.fees?.totalDue === 2000 && r.body?.data?.fees?.totalPaid === 1000, r.body?.data?.fees);
  check('admin dash: active teachers', r.body?.data?.teachers?.active === 2, r.body?.data?.teachers);
  r = await req('GET', '/dashboard/admin', { token: S.t1Tok });
  check('teacher cannot see admin dashboard', r.status === 403, r);
  r = await req('GET', '/events', { token: S.stu1Tok });
  check('events list', r.status === 200, r);
}

(async () => {
  try { await core(); await academics(); await parents(); await attendance(); await homeworkLeave(); await library(); await fees(); await transport(); await messaging(); await dashboards(); await require('./extraFlows')(S); await require('./moduleFlows')(S, { today, uniq }); await require('./studentDashboardFlows')(S, { uniq }); }
  catch (e) { console.error('CRASH', e); }
  const failed = summary();
  process.exit(failed ? 1 : 0);
})();
