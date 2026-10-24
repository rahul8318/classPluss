const config = require('../config/env');
const logger = require('../utils/logger');

class EmbeddingService {
  /**
   * Vector dimension size for local embedding vectorizer
   */
  static VECTOR_DIM = 256;

  /**
   * Generate vector embedding for a given text string
   * @param {string} text
   * @returns {Promise<number[]>}
   */
  static async generateEmbedding(text) {
    if (!text || typeof text !== 'string') {
      return new Array(this.VECTOR_DIM).fill(0);
    }

    // If OpenAI API key is provided, use external embeddings
    if (config.ai.openaiApiKey && config.ai.provider === 'openai') {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.ai.openaiApiKey}`,
          },
          body: JSON.stringify({
            input: text,
            model: 'text-embedding-3-small',
          }),
        });
        if (response.ok) {
          const json = await response.json();
          return json.data[0].embedding;
        }
      } catch (err) {
        logger.warn('Failed to fetch OpenAI embedding, falling back to local semantic vectorizer:', err.message);
      }
    }

    // Production-ready deterministic semantic vectorizer
    return this.createLocalEmbedding(text);
  }

  /**
   * Create a normalized local semantic vector using word tokens and bi-grams
   * @param {string} text
   * @returns {number[]} Normalized float vector
   */
  static createLocalEmbedding(text) {
    const dim = this.VECTOR_DIM;
    const vector = new Array(dim).fill(0);
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    const tokens = clean.split(/\s+/).filter(t => t.length > 2);

    if (tokens.length === 0) {
      return vector;
    }

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      let hash = 5381;
      for (let j = 0; j < token.length; j++) {
        hash = (hash * 33) ^ token.charCodeAt(j);
        hash |= 0;
      }
      const index = Math.abs(hash) % dim;
      const weight = 1.0 + Math.log(1 + token.length);
      vector[index] += weight;

      // Add bi-gram context
      if (i < tokens.length - 1) {
        const bigram = token + '_' + tokens[i + 1];
        let biHash = 5381;
        for (let k = 0; k < bigram.length; k++) {
          biHash = (biHash * 33) ^ bigram.charCodeAt(k);
          biHash |= 0;
        }
        const biIndex = Math.abs(biHash) % dim;
        vector[biIndex] += 1.5;
      }
    }

    // L2 normalize vector
    let sumSq = 0;
    for (let i = 0; i < dim; i++) {
      sumSq += vector[i] * vector[i];
    }
    const norm = Math.sqrt(sumSq) || 1;
    for (let i = 0; i < dim; i++) {
      vector[i] = Math.round((vector[i] / norm) * 10000) / 10000;
    }

    return vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param {number[]} vecA
   * @param {number[]} vecB
   * @returns {number} Cosine similarity (-1 to 1)
   */
  static cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const length = Math.min(vecA.length, vecB.length);
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }
}

module.exports = EmbeddingService;
