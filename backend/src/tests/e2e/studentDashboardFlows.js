// Student dashboard: every widget is checked against data created here for a
// fresh class (11-D), plus a classmate in 11-E to prove isolation.
const { req, check, login } = require('./lib');

module.exports = async function studentDashboardFlows(S, { uniq }) {
  console.log('== STUDENT DASHBOARD');
  const ymd = (offsetDays) => new Date(Date.now() + offsetDays * 864e5).toISOString().slice(0, 10);
  const today = ymd(0);
  const dayName = new Date().toLocaleString('en-US', { weekday: 'long' }).toUpperCase();
  const otherDay = dayName === 'MONDAY' ? 'TUESDAY' : 'MONDAY';

  // Current academic year = the one containing today (April–March)
  const now = new Date();
  const startYear = now.getUTCMonth() >= 3 ? now.getUTCFullYear() : now.getUTCFullYear() - 1;
  const yearName = `${startYear}-${startYear + 1}`;
  let r = await req('GET', '/academic-years', { token: S.admin });
  let year = (r.body.data || []).find((y) => y.name === yearName);
  if (!year) {
    r = await req('POST', '/academic-years', { token: S.admin, body: { name: yearName, startDate: `${startYear}-04-01`, endDate: `${startYear + 1}-03-31` } });
    year = r.body?.data;
  }
  r = await req('PATCH', `/academic-years/${year._id}/current`, { token: S.admin });
  check('dash setup: current academic year', r.status === 200, r);
  const beforeYear = new Date(new Date(`${startYear}-04-01`).getTime() - 10 * 864e5).toISOString().slice(0, 10);

  await req('POST', '/class-sections', { token: S.admin, body: { className: '11', section: 'D', capacity: 40 } });
  await req('POST', '/class-sections', { token: S.admin, body: { className: '11', section: 'E', capacity: 40 } });
  r = await req('POST', '/teachers', { token: S.admin, body: { firstName: 'Dash', lastName: 'Teacher', email: `dash${uniq}@x.com`, phone: `97${uniq}11`.slice(0, 10), assignedClass: '11', assignedSection: 'D' } });
  check('dash setup: teacher', r.status === 201, r);
  const tch = r.body?.data?.teacher;
  const tchTok = await login(r.body.data.credentials.loginId, r.body.data.credentials.temporaryPassword);

  const student = (n, section) => ({ firstName: 'Dash' + n, lastName: 'Student', dateOfBirth: '2010-05-01', gender: 'FEMALE', class: '11', section, rollNumber: String(n), admissionNumber: `DSH${uniq}${n}`, admissionDate: '2024-04-01', phone: '9876543210', address: '1 Road', city: 'Ghaziabad', state: 'UP', postalCode: '201001' });
  r = await req('POST', '/students', { token: S.admin, body: student(1, 'D') });
  check('dash setup: student 11-D', r.status === 201, r);
  const stuD = r.body.data.student || r.body.data;
  const dTok = await login(r.body.data.credentials.loginId, r.body.data.credentials.temporaryPassword);
  r = await req('POST', '/students', { token: S.admin, body: student(2, 'E') });
  check('dash setup: student 11-E', r.status === 201, r);
  const eTok = await login(r.body.data.credentials.loginId, r.body.data.credentials.temporaryPassword);
  const stuDId = stuD._id;

  // Empty dashboard first: nothing fabricated
  r = await req('GET', '/dashboard/student', { token: dTok });
  let d = r.body?.data || {};
  check('empty dash: loads', r.status === 200, r);
  check('empty dash: attendance is null, not 0%', d.attendance?.percentage === null, d.attendance);
  check('empty dash: no pending homework', d.homework?.pending === 0 && d.homework?.next === null, d.homework);
  check('empty dash: no exams', d.examinations?.upcomingCount === 0 && d.examinations?.next === null, d.examinations);
  check('empty dash: no dues', d.fees?.outstandingAmount === 0 && d.fees?.hasDues === false, d.fees);
  check('empty dash: no timetable', Array.isArray(d.timetable?.classes) && d.timetable.classes.length === 0, d.timetable);
  check('empty dash: header data', d.student?.class === '11' && d.student?.section === 'D' && d.student?.academicYear === yearName && d.student?.firstName === 'Dash1', d.student);
  check('empty dash: removed widgets no longer sent', d.transport === undefined && d.leave === undefined && d.messages === undefined && d.library === undefined, Object.keys(d));

  // Attendance: one day this year (present) + one day before the year (absent, excluded)
  r = await req('POST', '/attendance/bulk', { token: tchTok, body: { date: today, attendance: [{ student: stuDId, status: 'PRESENT' }] } });
  check('dash setup: attendance today', r.status === 201 || r.status === 200, r);
  r = await req('POST', '/attendance/bulk', { token: tchTok, body: { date: beforeYear, attendance: [{ student: stuDId, status: 'ABSENT' }] } });
  check('dash setup: attendance before academic year', r.status === 201 || r.status === 200, r);

  // Homework
  const hw = async (title, extra) => {
    const res = await req('POST', '/homework', { token: tchTok, body: { title: title + uniq, description: 'x', class: '11', section: 'D', subject: 'Physics', status: 'PUBLISHED', ...extra } });
    if (res.status !== 201) check(`dash setup: homework ${title}`, false, res);
    return res.body?.data || res.body;
  };
  const hwSoon = await hw('HW soon ', { dueDate: ymd(2) });
  await hw('HW later ', { dueDate: ymd(10) });
  const hwDone = await hw('HW done ', { dueDate: ymd(3) });
  const hwReturned = await hw('HW returned ', { dueDate: ymd(4) });
  await hw('HW past ', { dueDate: ymd(-3) });
  await hw('HW draft ', { dueDate: ymd(1), status: 'DRAFT' });
  r = await req('POST', '/homework', { token: S.admin, body: { title: 'HW other ' + uniq, class: '11', section: 'E', subject: 'Physics', status: 'PUBLISHED', dueDate: ymd(1), teacherId: tch.id || tch._id } });
  check('dash setup: homework for 11-E', r.status === 201, r);
  r = await req('POST', `/homework/${hwDone._id}/submissions`, { token: dTok, body: { content: 'done' } });
  check('dash setup: submit homework', r.status === 201 || r.status === 200, r);
  r = await req('POST', `/homework/${hwReturned._id}/submissions`, { token: dTok, body: { content: 'first try' } });
  const subId = (r.body?.data?.submission || r.body?.data)?._id;
  r = await req('PATCH', `/homework/submissions/${subId}/grade`, { token: tchTok, body: { status: 'RETURNED', feedback: 'Redo Q2' } });
  check('dash setup: return submission', r.status === 200, r);

  // Exams
  const exam = (name, extra) => req('POST', '/exams', { token: S.admin, body: { name: name + uniq, type: 'UNIT_TEST', academicSession: yearName, class: '11', ...extra } });
  await exam('Exam next ', { section: 'D', startDate: ymd(5), endDate: ymd(6) });
  await exam('Exam later ', { startDate: ymd(20), endDate: ymd(20) });
  await exam('Exam past ', { section: 'D', startDate: ymd(-10), endDate: ymd(-9) });
  await exam('Exam completed ', { section: 'D', startDate: ymd(7), endDate: ymd(7), status: 'COMPLETED' });
  await exam('Exam other ', { section: 'E', startDate: ymd(1), endDate: ymd(1) });

  // Timetable
  const tt = (extra) => req('POST', '/timetable', { token: S.admin, body: { academicSession: yearName, class: '11', section: 'D', dayOfWeek: dayName, subject: S.sub._id, teacher: tch.id || tch._id, room: 'L2', ...extra } });
  r = await tt({ startTime: '10:00', endTime: '10:45' });
  check('dash setup: timetable today', r.status === 201, r);
  await tt({ startTime: '08:00', endTime: '08:45', room: 'L1' });
  await tt({ dayOfWeek: otherDay, startTime: '12:00', endTime: '12:45' });
  await tt({ academicSession: '2099-2100', startTime: '13:00', endTime: '13:45' });
  await tt({ section: 'E', startTime: '11:00', endTime: '11:45' });

  // Fees: 2000 − 300 concession − 500 paid = 1200 outstanding; a fully paid record adds nothing
  r = await req('POST', '/fees/structures', { token: S.admin, body: { title: 'Dash tuition ' + uniq, amount: 2000, dueDate: ymd(15), applicableClasses: ['11'], academicYear: yearName } });
  const fsMain = r.body?.data;
  r = await req('POST', '/fees/records', { token: S.admin, body: { studentId: stuDId, feeStructureId: fsMain._id } });
  const recMain = r.body?.data;
  r = await req('PATCH', `/fees/records/${recMain._id}/discount`, { token: S.admin, body: { discount: 300, reason: 'Merit' } });
  check('dash setup: concession', r.status === 200, r);
  r = await req('PATCH', `/fees/records/${recMain._id}/pay`, { token: S.admin, body: { paymentAmount: 500, method: 'CASH' } });
  check('dash setup: part payment', r.status === 200, r);
  r = await req('POST', '/fees/structures', { token: S.admin, body: { title: 'Dash lab ' + uniq, amount: 100, dueDate: ymd(5), applicableClasses: ['11'], academicYear: yearName } });
  r = await req('POST', '/fees/records', { token: S.admin, body: { studentId: stuDId, feeStructureId: r.body.data._id } });
  r = await req('PATCH', `/fees/records/${r.body.data._id}/pay`, { token: S.admin, body: { paymentAmount: 100, method: 'CASH' } });
  check('dash setup: paid-in-full record', r.status === 200, r);

  // Events
  const ev = (title, extra) => req('POST', '/events', { token: S.admin, body: { title: title + uniq, eventType: 'ACADEMIC', status: 'PUBLISHED', ...extra } });
  r = await ev('Science fair ', { eventDate: ymd(8), targetAudience: 'STUDENTS' });
  check('dash setup: student event', r.status === 201, r);
  await ev('Staff meeting ', { eventDate: ymd(1), targetAudience: 'TEACHERS' });
  await ev('Draft event ', { eventDate: ymd(1), targetAudience: 'ALL', status: 'DRAFT' });
  await ev('Past event ', { eventDate: ymd(-2), targetAudience: 'ALL' });

  // Notices (created oldest → newest)
  const notice = async (title, { draft, ...extra }) => {
    const res = await req('POST', '/notices', { token: S.admin, body: { title: title + uniq, content: `${title} body text `.repeat(20), category: 'ACADEMIC', ...extra } });
    const id = res.body?.data?._id || res.body?.data?.notice?._id;
    return draft ? res : req('PATCH', `/notices/${id}/publish`, { token: S.admin });
  };
  await notice('N all ', { audience: 'ALL' });
  await notice('N class11 ', { audience: 'SPECIFIC_CLASS', targetClass: '11' });
  await notice('N teachers ', { audience: 'TEACHERS' });
  await notice('N 11E ', { audience: 'SPECIFIC_SECTION', targetClass: '11', targetSection: 'E' });
  await notice('N draft ', { audience: 'ALL', draft: true });
  r = await notice('N 11D ', { audience: 'SPECIFIC_SECTION', targetClass: '11', targetSection: 'D' });
  check('dash setup: section notice published', r.status === 200, r);

  r = await req('GET', '/dashboard/student', { token: dTok });
  d = r.body?.data || {};
  check('dash: loads with data', r.status === 200, r);

  check('dash attendance: only current academic year counted', d.attendance?.percentage === 100 && d.attendance.present === 1 && d.attendance.absent === 0, d.attendance);
  check('dash attendance: today status + period label', d.attendance?.today === 'PRESENT' && d.attendance.period.includes(yearName), d.attendance);

  check('dash homework: pending excludes submitted, past-due, draft, other section', d.homework?.pending === 3, d.homework);
  check('dash homework: overdue counted separately', d.homework?.overdue === 1, d.homework);
  check('dash homework: next is soonest due', d.homework?.next?.title === 'HW soon ' + uniq, d.homework?.next);

  check('dash exams: upcoming excludes past, completed, other section', d.examinations?.upcomingCount === 2, d.examinations);
  check('dash exams: next exam is soonest', d.examinations?.next?.name === 'Exam next ' + uniq && d.examinations.next.ongoing === false, d.examinations?.next);

  check('dash fees: outstanding = amount − concession − payments', d.fees?.outstandingAmount === 1200 && d.fees.hasDues === true, d.fees);
  check('dash fees: next due date of unpaid record', d.fees?.nextDueDate?.slice(0, 10) === ymd(15), d.fees);

  const classes = d.timetable?.classes || [];
  check('dash timetable: only today, this session, own section', classes.length === 2, classes);
  check('dash timetable: ordered with subject/teacher/room', classes[0]?.startTime === '08:00' && classes[0]?.subject === 'Mathematics' && classes[0]?.teacher === 'Dash Teacher' && classes[0]?.room === 'L1', classes[0]);

  const dl = d.deadlines || [];
  const titles = dl.map((x) => x.title);
  check('dash deadlines: at most five', dl.length > 0 && dl.length <= 5, dl);
  check('dash deadlines: sorted, none in the past', dl.every((x, i) => x.date.slice(0, 10) >= today && (i === 0 || x.date >= dl[i - 1].date)), dl.map((x) => x.date));
  check('dash deadlines: homework + exam + returned included', titles.includes('HW soon ' + uniq) && titles.includes('Exam next ' + uniq) && titles.includes('HW returned ' + uniq), titles);
  check('dash deadlines: returned homework flagged', dl.find((x) => x.title === 'HW returned ' + uniq)?.status === 'RETURNED', dl);
  check('dash deadlines: excluded items absent', !titles.some((t) => /HW done|HW past|HW draft|HW other|Exam past|Exam completed|Exam other|Staff meeting|Draft event|Past event/.test(t)), titles);

  const notes = d.notices?.recent || [];
  check('dash notices: latest three visible to 11-D', notes.length === 3 && notes[0].title === 'N 11D ' + uniq && notes[1].title === 'N class11 ' + uniq && notes[2].title === 'N all ' + uniq, notes.map((n) => n.title));
  check('dash notices: short preview with date', notes[0]?.preview?.length > 0 && notes[0].preview.length <= 160 && !!notes[0].date, notes[0]);

  // Classmate in 11-E sees only their own data
  r = await req('GET', '/dashboard/student', { token: eTok });
  const e = r.body?.data || {};
  check('11-E dash: own homework only', e.homework?.pending === 1, e.homework);
  check('11-E dash: own timetable only', (e.timetable?.classes || []).length === 1 && e.timetable.classes[0].startTime === '11:00', e.timetable);
  check('11-E dash: no attendance, no dues', e.attendance?.percentage === null && e.fees?.hasDues === false, { a: e.attendance, f: e.fees });
  check('11-E dash: section notices isolated', (e.notices?.recent || []).some((n) => n.title === 'N 11E ' + uniq) && !(e.notices?.recent || []).some((n) => n.title === 'N 11D ' + uniq), e.notices);
  check('11-E dash: own exam next', e.examinations?.next?.name === 'Exam other ' + uniq, e.examinations);

  // Only students can call it
  for (const [who, tok] of [['admin', S.admin], ['teacher', tchTok], ['parent', S.parTok]]) {
    r = await req('GET', '/dashboard/student', { token: tok });
    check(`${who} cannot open the student dashboard API`, r.status === 403, r.status);
  }
  r = await req('GET', '/dashboard/student');
  check('student dashboard API needs login', r.status === 401, r.status);
};
