const mongoose = require('mongoose');

const documentChunkSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    text: {
      type: String,
      required: true,
    },
    chunkIndex: {
      type: Number,
      required: true,
    },
    pageNumber: {
      type: Number,
      default: 1,
    },
    heading: {
      type: String,
      default: '',
    },
    embedding: {
      type: [Number],
      default: [],
    },
    metadata: {
      fileName: String,
      fileType: String,
      tokenCount: Number,
    },
  },
  {
    timestamps: true,
  }
);

documentChunkSchema.index({ courseId: 1, resourceId: 1 });
documentChunkSchema.index({ courseId: 1, chunkIndex: 1 });

const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);
module.exports = DocumentChunk;
