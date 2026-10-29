const mongoose = require('mongoose');

const studentAttendanceEntrySchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['present', 'absent', 'late', 'excused'],
      default: 'present',
    },
    checkInTime: {
      type: Date,
      default: Date.now,
    },
    source: {
      type: String,
      enum: ['manual', 'code', 'spring_boot_session'],
      default: 'manual',
    },
    checkInIp: {
      type: String,
      default: '',
    },
    deviceInfo: {
      type: String,
      default: '',
    },
    isProxyWarning: {
      type: Boolean,
      default: false,
    },
    proxyReason: {
      type: String,
      default: '',
    },
    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { _id: true, timestamps: true }
);

const attendanceRecordSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    classDate: {
      type: String, // Format: YYYY-MM-DD
      required: [true, 'Class date is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'Class Session Attendance',
    },
    records: [studentAttendanceEntrySchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isConfirmed: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// One official attendance register per course per date
attendanceRecordSchema.index({ courseId: 1, classDate: 1 }, { unique: true });

const AttendanceRecord = mongoose.model('AttendanceRecord', attendanceRecordSchema);
module.exports = AttendanceRecord;
