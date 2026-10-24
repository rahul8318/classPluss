const mongoose = require('mongoose');

const questionOptionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    isCorrect: { type: Boolean, default: false },
  },
  { _id: false }
);

const questionItemSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    questionType: {
      type: String,
      enum: ['mcq', 'true_false', 'short_answer', 'open_ended'],
      required: true,
      default: 'mcq',
    },
    options: [questionOptionSchema],
    answerKey: {
      type: String,
      default: '',
    },
    explanation: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    bloomLevel: {
      type: String,
      default: 'Understand',
    },
    points: {
      type: Number,
      default: 1,
      min: 0,
    },
    isAiGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const questionBankSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Question bank title is required'],
      trim: true,
    },
    topic: {
      type: String,
      trim: true,
      default: 'General',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    sourceResourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
    },
    sourceNotes: {
      type: String,
      default: '',
    },
    questions: [questionItemSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

questionBankSchema.index({ courseId: 1, topic: 1 });

const QuestionBank = mongoose.model('QuestionBank', questionBankSchema);
module.exports = QuestionBank;
