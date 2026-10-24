const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    submissionType: {
      type: String,
      enum: ['file', 'text', 'link'],
      default: 'file',
    },
    fileUrls: [
      {
        url: String,
        name: String,
        size: Number,
      },
    ],
    content: {
      type: String,
      default: '',
    },
    linkUrl: {
      type: String,
      default: '',
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['submitted', 'graded', 'resubmission_requested'],
      default: 'submitted',
      index: true,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    receiptCode: {
      type: String,
      unique: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ assignmentId: 1, studentId: 1 });

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
