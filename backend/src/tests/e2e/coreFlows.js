const { req, check, login, summary } = require('./lib');
const S = {}; // shared state
const today = new Date().toISOString().slice(0, 10);
const uniq = Date.now().toString().slice(-6);

async function core() {
  console.log('== AUTH');
  let r = await req('POST', '/auth/login', { body: { loginId: 'ADM2026000001', password: 'wrong' } });
  check('login wrong password 401', r.status === 401, r);
  r = await req('POST', '/auth/login', { body: { loginId: { $ne: null }, password: 'x' } });
  check('login nosql object rejected 400', r.status === 400, r);
  S.admin = await login(process.env.E2E_ADMIN_LOGIN_ID || 'ADM' + new Date().getFullYear() + '000001', process.env.ADMIN_PASSWORD);
  r = await req('GET', '/auth/me', { token: S.admin });
  check('auth/me', r.status === 200 && r.body.data.role === 'ADMIN', r);
  r = await req('GET', '/students');
  check('students unauth 401', r.status === 401, r);
  r = await req('GET', '/students', { token: 'garbage' });
  check('bad token 401', r.status === 401, r);

  console.log('== STUDENTS');
  const stu = (n, extra = {}) => ({ firstName: 'Stu' + n, lastName: 'Test', dateOfBirth: '2012-05-01', gender: 'MALE', class: '8', section: 'A', rollNumber: String(n), admissionNumber: `ADM${uniq}${n}`, admissionDate: '2024-04-01', phone: '9876543210', address: '1 Road', city: 'Ghaziabad', state: 'UP', postalCode: '201001', ...extra });
  r = await req('POST', '/students', { token: S.admin, body: stu(1) });
  check('create student 201', r.status === 201, r);
  S.stu1Cred = r.body?.data?.credentials;
  r = await req('POST', '/students', { token: S.admin, body: stu(2, { email: `s2${uniq}@x.com` }) });
  check('create student2', r.status === 201, r);
  S.stu2Cred = r.body?.data?.credentials;
  r = await req('POST', '/students', { token: S.admin, body: stu(3, { section: 'B' }) });
  check('create student3 (8B)', r.status === 201, r);
  S.stu3Cred = r.body?.data?.credentials;
  r = await req('POST', '/students', { token: S.admin, body: stu(1) });
  check('duplicate admission 409', r.status === 409, r);
  r = await req('POST', '/students', { token: S.admin, body: { firstName: 'x' } });
  check('missing fields 400', r.status === 400, r);
  r = await req('POST', '/students', { token: S.admin, body: stu(9, { gender: 'X' }) });
  check('invalid gender 400', r.status === 400, r);
  r = await req('GET', '/students?search=Stu&class=8&limit=50', { token: S.admin });
  check('list students', r.status === 200 && r.body.data.students.length >= 3, r);
  const list = r.body.data.students;
  S.stu1 = list.find(s => s.firstName === 'Stu1'); S.stu2 = list.find(s => s.firstName === 'Stu2'); S.stu3 = list.find(s => s.firstName === 'Stu3');
  r = await req('GET', `/students/${S.stu1._id}`, { token: S.admin });
  check('get student by id', r.status === 200 && r.body.data.firstName === 'Stu1', r);
  r = await req('GET', `/students/${S.stu1.studentId}`, { token: S.admin });
  check('get student by studentId', r.status === 200, r);
  r = await req('PUT', `/students/${S.stu1._id}`, { token: S.admin, body: { city: 'Noida' } });
  check('update student', r.status === 200 && r.body.data.student.city === 'Noida', r);
  r = await req('GET', `/students/${S.stu1._id}`, { token: S.admin });
  check('update persisted', r.body.data.city === 'Noida', r);
  r = await req('PUT', `/students/${S.stu1._id}`, { token: S.admin, body: { gender: 'BAD' } });
  check('update invalid enum 400', r.status === 400, r);
  r = await req('GET', '/students/000000000000000000000000', { token: S.admin });
  check('student 404', r.status === 404, r);
  r = await req('GET', '/students/admin/export', { token: S.admin });
  check('export csv', r.status === 200 && typeof r.body === 'string' && r.body.startsWith('Student ID'), r);
  // CSV import
  const csv = 'FirstName,LastName,DateOfBirth,Gender,Class,Section,RollNumber,AdmissionNumber,AdmissionDate,Phone,Address,City,State,PostalCode,Email\n' +
    `Imp,One,2012-01-01,FEMALE,8,A,50,IMP${uniq}1,2024-04-01,9999999999,Addr,City,ST,111111,imp1${uniq}@x.com\n` +
    `Imp,Two,2012-01-01,MALE,8,A,51,IMP${uniq}2,2024-04-01,9999999999,"Addr, 2",City,ST,111111,\n`;
  const boundary = '----b' + uniq;
  const mp = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="s.csv"\r\nContent-Type: text/csv\r\n\r\n${csv}\r\n--${boundary}--\r\n`;
  r = await req('POST', '/students/admin/import', { token: S.admin, raw: mp, headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` } });
  check('csv import 200', r.status === 200 && r.body.data.imported === 2, r);
  r = await req('GET', `/students?search=IMP${uniq}`, { token: S.admin });
  check('imported students listed', r.body?.data?.students?.length === 2, r.body);
  r = await req('PATCH', '/students/bulk/deactivate', { token: S.admin, body: { studentIds: (r.body?.data?.students || []).map(s => s._id) } });
  check('bulk deactivate', r.status === 200 && r.body.data.updatedCount === 2, r);

  // student login
  S.stu1Tok = await login(S.stu1Cred.loginId, S.stu1Cred.temporaryPassword);
  r = await req('POST', '/auth/change-password', { token: S.stu1Tok, body: { currentPassword: S.stu1Cred.temporaryPassword, newPassword: 'NewPass123' } });
  check('student change password', r.status === 200 && r.body.data.mustChangePassword === false, r);
  S.stu1Tok = await login(S.stu1Cred.loginId, 'NewPass123');
  S.stu2Tok = await login(S.stu2Cred.loginId, S.stu2Cred.temporaryPassword);
  S.stu3Tok = await login(S.stu3Cred.loginId, S.stu3Cred.temporaryPassword);
  r = await req('GET', '/students/me', { token: S.stu1Tok });
  check('students/me', r.status === 200 && r.body.data.firstName === 'Stu1', r);
  r = await req('GET', '/students', { token: S.stu1Tok });
  check('student cannot list students 403', r.status === 403, r);
  r = await req('PATCH', `/students/${S.stu2._id}/deactivate`, { token: S.admin });
  check('deactivate student', r.status === 200, r);
  r = await req('POST', '/auth/login', { body: { loginId: S.stu2Cred.loginId, password: S.stu2Cred.temporaryPassword } });
  check('inactive student cannot login 403', r.status === 403, r);
  r = await req('GET', '/auth/me', { token: S.stu2Tok });
  check('inactive student token rejected', r.status === 401 || r.status === 403, r);
  r = await req('PATCH', `/students/${S.stu2._id}/activate`, { token: S.admin });
  check('activate student', r.status === 200, r);

  console.log('== TEACHERS');
  const tch = (n, cls, sec) => ({ firstName: 'Tch' + n, lastName: 'T', email: `t${n}${uniq}@x.com`, phone: `98${uniq}${n}0`, assignedClass: cls, assignedSection: sec });
  r = await req('POST', '/teachers', { token: S.admin, body: tch(1, '8', 'A') });
  check('create teacher', r.status === 201, r);
  S.t1 = r.body?.data?.teacher; S.t1Cred = r.body?.data?.credentials;
  r = await req('POST', '/teachers', { token: S.admin, body: tch(2, '9', 'B') });
  check('create teacher2', r.status === 201, r);
  S.t2 = r.body?.data?.teacher; S.t2Cred = r.body?.data?.credentials;
  r = await req('POST', '/teachers', { token: S.admin, body: tch(1, '8', 'A') });
  check('duplicate teacher 409', r.status === 409, r);
  r = await req('GET', '/teachers?search=Tch', { token: S.admin });
  check('list teachers', r.status === 200 && r.body.data.teachers.length >= 2, r);
  r = await req('PUT', `/teachers/${S.t1.id}`, { token: S.admin, body: { lastName: 'Updated' } });
  check('update teacher', r.status === 200 && r.body.data.teacher.lastName === 'Updated', r);
  r = await req('GET', `/teachers/${S.t1.id}`, { token: S.admin });
  check('get teacher', r.status === 200 && r.body.data.teacher.lastName === 'Updated', r);
  S.t1Tok = await login(S.t1Cred.loginId, S.t1Cred.temporaryPassword);
  S.t2Tok = await login(S.t2Cred.loginId, S.t2Cred.temporaryPassword);
  r = await req('GET', '/teachers', { token: S.t1Tok });
  check('teacher cannot list teachers 403', r.status === 403, r);
  r = await req('PATCH', `/teachers/${S.t2.id}/deactivate`, { token: S.admin });
  check('deactivate teacher', r.status === 200, r);
  r = await req('PATCH', `/teachers/${S.t2.id}/activate`, { token: S.admin });
  check('activate teacher', r.status === 200, r);
}

async function academics() {
  console.log('== SUBJECTS');
  let r = await req('POST', '/subjects', { token: S.admin, body: { name: 'Maths', code: 'MTH' + uniq, maximumMarks: 100, passingMarks: 33 } });
  check('create subject', r.status === 201, r);
  r = await req('GET', '/subjects', { token: S.admin });
  check('list subjects', r.status === 200, r);
  const subs = r.body?.data?.subjects || r.body?.data;
  S.sub = (Array.isArray(subs) ? subs : []).find(s => s.code === 'MTH' + uniq);
  check('subject found in list', !!S.sub, r.body);
  r = await req('POST', '/subjects', { token: S.admin, body: { name: 'Bad', code: 'BAD' + uniq, maximumMarks: 50, passingMarks: 60 } });
  check('subject passing>max 400', r.status === 400, r);
  r = await req('PUT', `/subjects/${S.sub._id}`, { token: S.admin, body: { name: 'Mathematics' } });
  check('update subject', r.status === 200, r);

  console.log('== EXAMS/RESULTS');
  r = await req('POST', '/exams', { token: S.admin, body: { name: 'Mid Term', type: 'MID_TERM', academicSession: '2026-27', class: '8', section: 'A', startDate: today, endDate: today } });
  check('create exam', r.status === 201, r);
  S.exam = r.body?.data?.exam;
  r = await req('POST', '/exams', { token: S.admin, body: { name: 'X', type: 'MID_TERM', academicSession: '2026-27', class: '8', startDate: '2026-12-02', endDate: '2026-12-01' } });
  check('exam end<start 400', r.status === 400, r);
  r = await req('GET', '/exams', { token: S.admin });
  check('list exams', r.status === 200, r);
  r = await req('POST', `/exams/${S.exam._id}/results`, { token: S.admin, body: { student: S.stu1._id, subject: S.sub._id, obtainedMarks: 35 } });
  check('admin create result', r.status === 201, r);
  S.result = r.body?.data?.result;
  check('35/100 with passing 33 is PASS', S.result?.status === 'PASS', S.result);
  r = await req('POST', `/exams/${S.exam._id}/results`, { token: S.admin, body: { student: S.stu1._id, subject: S.sub._id, obtainedMarks: 50 } });
  check('duplicate result 409', r.status === 409, r);
  r = await req('POST', `/exams/${S.exam._id}/results`, { token: S.admin, body: { student: S.stu2._id, subject: S.sub._id, obtainedMarks: 150 } });
  check('marks>max rejected 400', r.status === 400, r);
  r = await req('GET', `/exams/${S.exam._id}/results`, { token: S.admin });
  check('list results', r.status === 200 && r.body.data.results.length === 1, r);
  r = await req('PUT', `/results/${S.result._id}`, { token: S.admin, body: { obtainedMarks: 20 } });
  check('update result -> FAIL', r.status === 200 && r.body.data.result.status === 'FAIL', r);

  // teacher exam flow
  r = await req('GET', '/teacher/exams', { token: S.t1Tok });
  check('teacher exams list', r.status === 200 && r.body.data.exams.length >= 1, r);
  r = await req('GET', `/teacher/exams/${S.exam._id}`, { token: S.t2Tok });
  check('teacher2 cannot view 8A exam 403', r.status === 403, r);
  r = await req('POST', `/teacher/exams/${S.exam._id}/results`, { token: S.t1Tok, body: { student: S.stu2._id, subject: S.sub._id, obtainedMarks: 80 } });
  check('teacher create result', r.status === 201, r);
  r = await req('POST', `/teacher/exams/${S.exam._id}/results`, { token: S.t1Tok, body: { student: S.stu3._id, subject: S.sub._id, obtainedMarks: 80 } });
  check('teacher cannot add result for other section', r.status === 403, r);
  r = await req('GET', `/teacher/exams/${S.exam._id}/results`, { token: S.t1Tok });
  check('teacher can read scoped exam results', r.status === 200 && (r.body.data.results || []).length === 2, r);
  r = await req('GET', `/teacher/exams/${S.exam._id}/students`, { token: S.t1Tok });
  check('teacher can read exam student roster', r.status === 200 && (r.body.data.students || []).length >= 2, r);
  r = await req('GET', `/teacher/exams/subjects`, { token: S.t1Tok });
  check('teacher can read subjects', r.status === 200 && (r.body.data.subjects || []).length >= 1, r);

  r = await req('GET', '/student/results', { token: S.stu1Tok });
  check('student results (unpublished exam hidden?)', r.status === 200, r);
  r = await req('PUT', `/exams/${S.exam._id}`, { token: S.admin, body: { status: 'PUBLISHED' } });
  check('publish exam', r.status === 200, r);
  r = await req('GET', '/student/results', { token: S.stu1Tok });
  check('student sees published results', r.status === 200, r);
  r = await req('GET', `/student/results/${S.exam._id}`, { token: S.stu1Tok });
  check('student exam result detail', r.status === 200, r);

  console.log('== TIMETABLE');
  r = await req('POST', '/timetable', { token: S.admin, body: { academicSession: '2026-2027', class: '8', section: 'A', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '09:45', subject: S.sub._id, teacher: S.t1.id, room: 'R1' } });
  check('create timetable', r.status === 201, r);
  S.tt = r.body?.data?.timetable || r.body?.data;
  r = await req('POST', '/timetable', { token: S.admin, body: { academicSession: '2026-2027', class: '9', section: 'B', dayOfWeek: 'MONDAY', startTime: '09:30', endTime: '10:00', subject: S.sub._id, teacher: S.t1.id, room: 'R2' } });
  check('teacher double booking 409', r.status === 409, r);
  r = await req('GET', '/timetable?class=8', { token: S.admin });
  check('list timetable', r.status === 200, r);
  r = await req('GET', '/teacher/timetable', { token: S.t1Tok });
  check('teacher timetable', r.status === 200 && JSON.stringify(r.body).includes('R1'), r);
  r = await req('GET', '/student/timetable', { token: S.stu1Tok });
  check('student timetable', r.status === 200 && JSON.stringify(r.body).includes('R1'), r);
  r = await req('GET', '/student/timetable', { token: S.stu3Tok });
  check('student 8B does not see 8A timetable', r.status === 200 && !JSON.stringify(r.body).includes('R1'), r);

  console.log('== NOTICES');
  r = await req('POST', '/notices', { token: S.admin, body: { title: 'All notice', content: 'Hello all', category: 'GENERAL', audience: 'ALL' } });
  check('create notice', r.status === 201, r);
  S.noticeAll = r.body?.data?.notice || r.body?.data;
  r = await req('POST', '/notices', { token: S.admin, body: { title: 'Class 9 notice', content: 'Hello 9', category: 'GENERAL', audience: 'SPECIFIC_CLASS', targetClass: '9' } });
  S.notice9 = r.body?.data?.notice || r.body?.data;
  r = await req('POST', '/notices', { token: S.admin, body: { title: 'Bad', content: 'x', category: 'GENERAL', audience: 'SPECIFIC_CLASS' } });
  check('notice missing targetClass 400', r.status === 400, r);
  r = await req('GET', '/student/notices', { token: S.stu1Tok });
  check('draft notices hidden from students', r.status === 200 && !JSON.stringify(r.body).includes('All notice'), r);
  await req('PATCH', `/notices/${S.noticeAll._id}/publish`, { token: S.admin });
  await req('PATCH', `/notices/${S.notice9._id}/publish`, { token: S.admin });
  r = await req('GET', '/student/notices', { token: S.stu1Tok });
  check('student sees ALL notice', r.status === 200 && JSON.stringify(r.body).includes('All notice'), r);
  check('student 8 does not see class 9 notice', !JSON.stringify(r.body).includes('Class 9 notice'), r);
  r = await req('GET', '/teacher/notices', { token: S.t1Tok });
  check('teacher sees notices', r.status === 200 && JSON.stringify(r.body).includes('All notice'), r);
  r = await req('GET', `/student/notices/${S.notice9._id}`, { token: S.stu1Tok });
  check('student cannot open class-9 notice by id', r.status === 404 || r.status === 403, r);
  r = await req('POST', '/notices', { token: S.t1Tok, body: { title: 'x', content: 'x', category: 'GENERAL', audience: 'ALL' } });
  check('teacher cannot create admin notice 403', r.status === 403, r);
}

module.exports = { S, core, academics, today, uniq };
