const mongoose = require('mongoose');

const assessmentQuestionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    questionType: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer', 'open_ended'],
      required: true,
    },
    options: [
      {
        id: String,
        text: String,
        isCorrect: Boolean,
      },
    ],
    answerKey: { type: String, default: '' },
    explanation: { type: String, default: '' },
    points: { type: Number, default: 1, min: 0 },
  },
  { _id: true }
);

const assessmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    questionBankId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionBank',
    },
    questions: [assessmentQuestionSchema],
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: 1,
    },
    maxAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    availabilityWindow: {
      startTime: { type: Date, default: Date.now },
      endTime: { type: Date },
    },
    releaseSettings: {
      showScoreImmediately: { type: Boolean, default: true },
      showFeedbackImmediately: { type: Boolean, default: false },
      showCorrectAnswers: { type: Boolean, default: false },
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
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

assessmentSchema.index({ courseId: 1, isPublished: 1 });

const Assessment = mongoose.model('Assessment', assessmentSchema);
module.exports = Assessment;
