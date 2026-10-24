const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');
const DocumentChunk = require('../models/DocumentChunk');
const DocumentParser = require('../services/documentParser');
const EmbeddingService = require('../services/embeddingService');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const logger = require('../utils/logger');
const AuditService = require('../services/auditService');

exports.createResource = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const { title, description, moduleId, resourceType, externalUrl, allowDownload, isPublished } = req.body;

    if (!title || !resourceType) {
      return next(ApiError.badRequest('Resource title and resourceType are required'));
    }

    let fileUrl = '';
    let fileName = '';
    let fileSize = 0;
    let mimeType = '';
    let filePath = '';

    if (req.file) {
      filePath = req.file.path;
      fileUrl = `/uploads/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = req.file.size;
      mimeType = req.file.mimetype;
    } else if (resourceType === 'link') {
      if (!externalUrl) {
        return next(ApiError.badRequest('externalUrl is required for link resources'));
      }
    }

    const resource = await Resource.create({
      courseId,
      moduleId: moduleId || undefined,
      title,
      description: description || '',
      resourceType,
      fileUrl,
      fileName,
      fileSize,
      mimeType,
      externalUrl: externalUrl || '',
      allowDownload: allowDownload !== 'false' && allowDownload !== false,
      isPublished: isPublished !== 'false' && isPublished !== false,
      uploadedBy: req.user.id,
      processingStatus: req.file ? 'pending' : 'completed',
    });

    // If a document was uploaded, process it for RAG
    if (filePath && ['pdf', 'docx', 'notes'].includes(resourceType)) {
      // Run extraction and chunking
      processDocumentAsync(resource._id, filePath, mimeType, courseId).catch(err => {
        logger.error(`Async RAG processing error for resource ${resource._id}:`, err);
      });
    }

    await AuditService.log({
      userId: req.user.id,
      action: 'RESOURCE_CREATED',
      entityType: 'Resource',
      entityId: resource._id,
      details: { title: resource.title, type: resource.resourceType, courseId },
      ipAddress: req.ip,
    });

    return ApiResponse.created(res, { resource }, 'Resource created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Helper to process document extraction and chunking with embeddings
 */
async function processDocumentAsync(resourceId, filePath, mimeType, courseId) {
  try {
    await Resource.findByIdAndUpdate(resourceId, { processingStatus: 'processing' });

    const { text, pageCount } = await DocumentParser.extractText(filePath, mimeType);
    const chunks = DocumentParser.chunkText(text);

    // Remove existing chunks for this resource if any
    await DocumentChunk.deleteMany({ resourceId });

    const chunkDocs = [];
    for (const chunk of chunks) {
      const embedding = await EmbeddingService.generateEmbedding(chunk.text);
      chunkDocs.push({
        courseId,
        resourceId,
        text: chunk.text,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        heading: chunk.heading,
        embedding,
        metadata: {
          tokenCount: chunk.text.split(/\s+/).length,
        },
      });
    }

    if (chunkDocs.length > 0) {
      await DocumentChunk.insertMany(chunkDocs);
    }

    await Resource.findByIdAndUpdate(resourceId, {
      textContent: text,
      pageCount,
      chunkCount: chunkDocs.length,
      processingStatus: 'completed',
    });

    logger.info(`Successfully processed document ${resourceId}: ${chunkDocs.length} chunks generated.`);
  } catch (error) {
    logger.error(`Failed to process document ${resourceId}:`, error);
    await Resource.findByIdAndUpdate(resourceId, {
      processingStatus: 'failed',
      processingError: error.message,
    });
  }
}

exports.processResourceNow = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return next(ApiError.notFound('Resource not found'));
    }

    if (!resource.fileUrl) {
      return next(ApiError.badRequest('Resource has no uploaded file to process'));
    }

    const filename = path.basename(resource.fileUrl);
    const filePath = path.resolve(__dirname, '../../uploads', filename);

    if (!fs.existsSync(filePath)) {
      return next(ApiError.notFound('File on disk could not be located'));
    }

    await processDocumentAsync(resource._id, filePath, resource.mimeType, resource.courseId);

    const updated = await Resource.findById(resourceId);
    return ApiResponse.success(res, { resource: updated }, 'Resource processing completed');
  } catch (error) {
    next(error);
  }
};

exports.getResources = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.params.id;
    const query = { courseId };

    if (!req.isTeacher) {
      query.isPublished = true;
    }

    const resources = await Resource.find(query)
      .select('-textContent')
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

    return ApiResponse.success(res, { resources });
  } catch (error) {
    next(error);
  }
};

exports.getResourceById = async (req, res, next) => {
  try {
    const { id, resourceId } = req.params;
    const targetId = resourceId || id;

    const resource = await Resource.findById(targetId).populate('uploadedBy', 'name email');
    if (!resource) {
      return next(ApiError.notFound('Resource not found'));
    }

    if (!req.isTeacher && !resource.isPublished) {
      return next(ApiError.forbidden('This resource is not currently published'));
    }

    return ApiResponse.success(res, { resource });
  } catch (error) {
    next(error);
  }
};

exports.updateResource = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const { title, description, moduleId, isPublished, allowDownload } = req.body;

    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return next(ApiError.notFound('Resource not found'));
    }

    if (title) resource.title = title;
    if (description !== undefined) resource.description = description;
    if (moduleId !== undefined) resource.moduleId = moduleId || undefined;
    if (isPublished !== undefined) resource.isPublished = isPublished;
    if (allowDownload !== undefined) resource.allowDownload = allowDownload;

    await resource.save();
    return ApiResponse.success(res, { resource }, 'Resource updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteResource = async (req, res, next) => {
  try {
    const { resourceId } = req.params;
    const resource = await Resource.findById(resourceId);
    if (!resource) {
      return next(ApiError.notFound('Resource not found'));
    }

    // Delete chunks
    await DocumentChunk.deleteMany({ resourceId: resource._id });

    // Remove local file if present
    if (resource.fileUrl) {
      const filename = path.basename(resource.fileUrl);
      const filePath = path.resolve(__dirname, '../../uploads', filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          logger.warn(`Could not delete file ${filePath}:`, e.message);
        }
      }
    }

    await Resource.deleteOne({ _id: resource._id });
    return ApiResponse.success(res, null, 'Resource deleted successfully');
  } catch (error) {
    next(error);
  }
};
