const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [150, 'Course title cannot exceed 150 characters'],
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      required: [true, 'Course code is required'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    subject: {
      type: String,
      trim: true,
      default: 'General',
    },
    level: {
      type: String,
      trim: true,
      default: 'Intermediate',
    },
    term: {
      type: String,
      trim: true,
      default: 'Current Term',
    },
    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Course must have an assigned teacher'],
      index: true,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
    bannerImage: {
      type: String,
      default: '',
    },
    settings: {
      allowSelfEnrollment: {
        type: Boolean,
        default: true,
      },
      requireApproval: {
        type: Boolean,
        default: false,
      },
    },
  },
  {
    timestamps: true,
  }
);

courseSchema.index({ teacherId: 1, isArchived: 1 });

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;
