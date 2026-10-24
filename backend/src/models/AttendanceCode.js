const mongoose = require('mongoose');

const attendanceCodeSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    classDate: {
      type: String, // YYYY-MM-DD
      required: true,
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    qrToken: {
      type: String,
      required: true,
      unique: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

attendanceCodeSchema.index({ courseId: 1, code: 1, isActive: 1 });

const AttendanceCode = mongoose.model('AttendanceCode', attendanceCodeSchema);
module.exports = AttendanceCode;
