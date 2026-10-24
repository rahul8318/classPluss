const DocumentChunk = require('../models/DocumentChunk');
const EmbeddingService = require('./embeddingService');
const logger = require('../utils/logger');

class VectorSearchService {
  /**
   * Search relevant chunks within a specific course
   * Strict security requirement: Never retrieve chunks outside authorized courseId
   * @param {string} courseId - Course ID to isolate retrieval
   * @param {string} query - Student question
   * @param {object} options - { limit: 4, minSimilarity: 0.15 }
   * @returns {Promise<Array<{ chunk: object, similarity: number }>>}
   */
  static async searchCourseChunks(courseId, query, options = {}) {
    const limit = options.limit || 4;
    const minSimilarity = options.minSimilarity !== undefined ? options.minSimilarity : 0.12;

    const queryEmbedding = await EmbeddingService.generateEmbedding(query);

    // Retrieve chunks strictly belonging to this course
    const chunks = await DocumentChunk.find({ courseId })
      .populate('resourceId', 'title fileName allowDownload isPublished')
      .lean();

    if (!chunks || chunks.length === 0) {
      return [];
    }

    const scoredChunks = [];

    for (const chunk of chunks) {
      // Skip if resource is unpublished
      if (chunk.resourceId && chunk.resourceId.isPublished === false) {
        continue;
      }

      const similarity = EmbeddingService.cosineSimilarity(queryEmbedding, chunk.embedding);
      if (similarity >= minSimilarity) {
        scoredChunks.push({
          chunk,
          similarity,
        });
      }
    }

    // Sort descending by similarity score
    scoredChunks.sort((a, b) => b.similarity - a.similarity);

    return scoredChunks.slice(0, limit);
  }
}

module.exports = VectorSearchService;
