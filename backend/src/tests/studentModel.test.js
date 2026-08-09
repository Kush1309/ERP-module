const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');

require('dotenv').config();

const Student = require('../models/Student');
const User = require('../models/User');
const authService = require('../services/authService');
const { authenticateUser, authorizeRoles } = require('../middlewares/auth');
const { generateStudentId, STUDENT_ID_PREFIX } = require('../services/studentIdService');
const { ROLES } = require('../constants/roles');
const { hashPassword } = require('../utils/password');
const app = require('../app');

const buildStudentPayload = (userId, overrides = {}) => ({
  user: userId,
  firstName: 'Rahul',
  lastName: 'Sharma',
  dateOfBirth: new Date('2010-05-15'),
  gender: 'MALE',
  class: '10',
  section: 'A',
  rollNumber: '12',
  admissionNumber: `ADM-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  admissionDate: new Date('2024-04-01'),
  phone: '9876543210',
  email: 'rahul@example.com',
  address: '123 School Lane',
  city: 'Delhi',
  state: 'Delhi',
  postalCode: '110001',
  ...overrides,
});

const createStudentUser = async (suffix) => {
  const loginId = `STU${new Date().getFullYear()}TEST${suffix}`;
  return User.create({
    loginId,
    password: await hashPassword('Student123'),
    role: ROLES.STUDENT,
    isActive: true,
    mustChangePassword: false,
  });
};

describe('Student model foundation', () => {
  let mongoAvailable = false;

  before(async () => {
    if (!process.env.MONGODB_URI) {
      return;
    }

    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI);
    }

    mongoAvailable = true;
  });

  after(async () => {
    if (mongoAvailable) {
      await Student.deleteMany({});
      await User.deleteMany({ loginId: /TEST/ });
      await mongoose.connection.close();
    }
  });

  it('imports correctly and schema compiles', () => {
    assert.ok(Student);
    assert.equal(Student.modelName, 'Student');
    assert.ok(Student.schema.path('studentId'));
  });

  it('defines User reference on student.user', () => {
    const userPath = Student.schema.path('user');
    assert.equal(userPath.options.ref, 'User');
    assert.equal(userPath.options.unique, true);
  });

  it('does not define password-related fields', () => {
    assert.equal(Student.schema.path('password'), undefined);
    assert.equal(Student.schema.path('passwordHash'), undefined);
    assert.equal(Student.schema.path('refreshToken'), undefined);
  });

  it('marks studentId as unique and immutable', () => {
    const studentIdPath = Student.schema.path('studentId');
    assert.equal(studentIdPath.options.unique, true);
    assert.equal(studentIdPath.options.immutable, true);
  });

  it('existing authentication exports remain unchanged', () => {
    assert.equal(typeof authService.login, 'function');
    assert.equal(typeof authService.getCurrentUser, 'function');
    assert.equal(typeof authService.changePassword, 'function');
    assert.equal(typeof authService.createUserAccount, 'function');
    assert.equal(typeof authenticateUser, 'function');
    assert.equal(typeof authorizeRoles, 'function');
  });

  it('GET /api/health returns 200', async () => {
    const server = app.listen(0);

    try {
      const { port } = server.address();
      const response = await new Promise((resolve, reject) => {
        http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
          let body = '';
          res.on('data', (chunk) => {
            body += chunk;
          });
          res.on('end', () => {
            resolve({ statusCode: res.statusCode, body: JSON.parse(body) });
          });
        }).on('error', reject);
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.body.success, true);
    } finally {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  it('generates studentId server-side in STU + YEAR + 6 digit format', async (t) => {
    if (!mongoAvailable) {
      t.skip('MONGODB_URI not configured');
      return;
    }

    const studentId = await generateStudentId();
    const year = new Date().getFullYear();

    assert.match(studentId, new RegExp(`^${STUDENT_ID_PREFIX}${year}\\d{6}$`));
  });

  it('rejects client-supplied studentId on create', async (t) => {
    if (!mongoAvailable) {
      t.skip('MONGODB_URI not configured');
      return;
    }

    const user = await createStudentUser('01');
    const student = new Student(
      buildStudentPayload(user._id, { studentId: 'STU2026000099' })
    );

    await assert.rejects(
      () => student.validate(),
      (error) => {
        assert.match(error.message, /cannot be supplied/i);
        return true;
      }
    );
  });

  it('assigns unique studentId per profile and enforces unique user link', async (t) => {
    if (!mongoAvailable) {
      t.skip('MONGODB_URI not configured');
      return;
    }

    const userOne = await createStudentUser('02');
    const userTwo = await createStudentUser('03');

    const studentOne = await Student.create(buildStudentPayload(userOne._id));
    const studentTwo = await Student.create(buildStudentPayload(userTwo._id));

    assert.notEqual(studentOne.studentId, studentTwo.studentId);
    assert.match(studentOne.studentId, /^STU\d{10}$/);

    await assert.rejects(
      () => Student.create(buildStudentPayload(userOne._id)),
      (error) => error.code === 11000
    );
  });
});
