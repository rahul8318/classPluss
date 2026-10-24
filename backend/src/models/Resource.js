const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CourseModule',
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [150, 'Resource title cannot exceed 150 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    resourceType: {
      type: String,
      enum: ['pdf', 'docx', 'pptx', 'link', 'notes'],
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      default: '',
    },
    fileName: {
      type: String,
      default: '',
    },
    fileSize: {
      type: Number,
      default: 0,
    },
    mimeType: {
      type: String,
      default: '',
    },
    externalUrl: {
      type: String,
      default: '',
    },
    textContent: {
      type: String,
      default: '',
    },
    pageCount: {
      type: Number,
      default: 1,
    },
    chunkCount: {
      type: Number,
      default: 0,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true,
    },
    processingError: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    allowDownload: {
      type: Boolean,
      default: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ courseId: 1, isPublished: 1 });

const Resource = mongoose.model('Resource', resourceSchema);
module.exports = Resource;
