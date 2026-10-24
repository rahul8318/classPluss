const mongoose = require('mongoose');

const rubricItemSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: true,
      trim: true,
    },
    maxPoints: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  { _id: true }
);

const assignmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    instructions: {
      type: String,
      default: '',
    },
    attachments: [
      {
        name: String,
        url: String,
        fileType: String,
      },
    ],
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
      index: true,
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 100,
      min: 1,
    },
    allowedSubmissionTypes: {
      type: [String],
      enum: ['file', 'text', 'link'],
      default: ['file', 'text'],
    },
    lateSubmissionPolicy: {
      type: String,
      enum: ['allow', 'disallow', 'penalty'],
      default: 'allow',
    },
    latePenaltyPercent: {
      type: Number,
      default: 10,
      min: 0,
      max: 100,
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    rubric: [rubricItemSchema],
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

assignmentSchema.index({ courseId: 1, dueDate: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
