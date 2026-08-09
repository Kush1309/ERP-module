const mongoose = require('mongoose');
const AppError = require('../utils/AppError');
const {
  STUDENT_STATUS,
  STUDENT_STATUS_VALUES,
} = require('../constants/studentStatus');
const { generateStudentId } = require('../services/studentIdService');

const GENDER_VALUES = ['MALE', 'FEMALE', 'OTHER'];

const studentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    studentId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
      uppercase: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: GENDER_VALUES,
      required: true,
    },
    class: {
      type: String,
      required: true,
      trim: true,
    },
    section: {
      type: String,
      required: true,
      trim: true,
    },
    rollNumber: {
      type: String,
      required: true,
      trim: true,
    },
    admissionNumber: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    admissionDate: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    postalCode: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: STUDENT_STATUS_VALUES,
      default: STUDENT_STATUS.ACTIVE,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

studentSchema.pre('validate', async function assignStudentId() {
  if (!this.isNew) {
    return;
  }

  if (this.studentId) {
    throw new AppError('studentId is server-generated and cannot be supplied', 400);
  }

  this.studentId = await generateStudentId();
});

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
