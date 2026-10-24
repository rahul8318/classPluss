const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    level: {
      type: String,
      enum: ['standard', 'simple', 'breakdown', 'example', 'recap'],
      default: 'standard',
    },
    sources: [
      {
        resourceId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Resource',
        },
        fileName: String,
        pageNumber: Number,
        heading: String,
        snippet: String,
      },
    ],
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const studyChatSessionSchema = new mongoose.Schema(
  {
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
    title: {
      type: String,
      default: 'Study Chat Session',
    },
    messages: [chatMessageSchema],
  },
  {
    timestamps: true,
  }
);

studyChatSessionSchema.index({ courseId: 1, studentId: 1 });

const StudyChatSession = mongoose.model('StudyChatSession', studyChatSessionSchema);
module.exports = StudyChatSession;
