const mongoose = require('mongoose');

const rubricScoreSchema = new mongoose.Schema(
  {
    criterion: {
      type: String,
      required: true,
    },
    pointsAwarded: {
      type: Number,
      required: true,
      min: 0,
    },
    maxPoints: {
      type: Number,
      required: true,
    },
    comment: {
      type: String,
      default: '',
    },
  },
  { _id: false }
);

const gradeFeedbackSchema = new mongoose.Schema(
  {
    submissionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Submission',
      required: true,
      unique: true,
      index: true,
    },
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
    marksObtained: {
      type: Number,
      required: true,
      min: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    rubricScores: [rubricScoreSchema],
    feedbackText: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'published',
      index: true,
    },
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    gradedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

gradeFeedbackSchema.pre('save', function (next) {
  if (this.totalMarks > 0) {
    this.percentage = Math.round((this.marksObtained / this.totalMarks) * 100 * 100) / 100;
  }
  next();
});

const GradeFeedback = mongoose.model('GradeFeedback', gradeFeedbackSchema);
module.exports = GradeFeedback;
