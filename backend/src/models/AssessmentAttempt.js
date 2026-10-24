const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    questionType: { type: String, required: true },
    selectedOptionId: { type: String, default: '' },
    textAnswer: { type: String, default: '' },
    isCorrect: { type: Boolean, default: null },
    pointsAwarded: { type: Number, default: 0 },
    teacherComment: { type: String, default: '' },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
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
    attemptNumber: {
      type: Number,
      default: 1,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    answers: [attemptAnswerSchema],
    score: {
      type: Number,
      default: 0,
    },
    totalPossibleScore: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['in_progress', 'submitted', 'graded'],
      default: 'in_progress',
      index: true,
    },
    isAutoGraded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

assessmentAttemptSchema.index({ assessmentId: 1, studentId: 1 });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);
module.exports = AssessmentAttempt;
