const mongoose = require('mongoose');

const courseModuleSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
      maxlength: [120, 'Module title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    orderIndex: {
      type: Number,
      default: 0,
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

courseModuleSchema.index({ courseId: 1, orderIndex: 1 });

const CourseModule = mongoose.model('CourseModule', courseModuleSchema);
module.exports = CourseModule;
