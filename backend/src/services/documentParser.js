const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const logger = require('../utils/logger');

class DocumentParser {
  /**
   * Parse text from file based on extension
   * @param {string} filePath - Absolute path to uploaded file
   * @param {string} mimeType - MIME type of file
   * @returns {Promise<{ text: string, pageCount: number }>}
   */
  static async extractText(filePath, mimeType) {
    const ext = path.extname(filePath).toLowerCase();

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found at path: ${filePath}`);
    }

    try {
      if (ext === '.pdf' || mimeType === 'application/pdf') {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return {
          text: data.text || '',
          pageCount: data.numpages || 1,
        };
      }

      if (ext === '.docx' || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const result = await mammoth.extractRawText({ path: filePath });
        return {
          text: result.value || '',
          pageCount: 1,
        };
      }

      if (ext === '.txt' || mimeType === 'text/plain') {
        const text = fs.readFileSync(filePath, 'utf8');
        return {
          text,
          pageCount: 1,
        };
      }

      // For pptx or other files, attempt raw text or return placeholder
      return {
        text: `Content for file: ${path.basename(filePath)}`,
        pageCount: 1,
      };
    } catch (error) {
      logger.error(`Error parsing document ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Split text into manageable passages with overlap and metadata
   * @param {string} text - Full text
   * @param {object} options - { chunkSize: 600, overlap: 100 }
   * @returns {Array<{ text: string, chunkIndex: number, heading: string, pageNumber: number }>}
   */
  static chunkText(text, options = {}) {
    const chunkSize = options.chunkSize || 600;
    const overlap = options.overlap || 100;
    const chunks = [];

    if (!text || text.trim().length === 0) {
      return chunks;
    }

    // Split text into paragraphs first
    const paragraphs = text.split(/\n\s*\n/);
    let currentChunk = '';
    let currentHeading = 'Overview';
    let chunkIndex = 0;
    let estimatedPage = 1;

    for (const para of paragraphs) {
      const cleanPara = para.trim().replace(/\s+/g, ' ');
      if (!cleanPara) continue;

      // Detect possible heading (short line ending without period)
      if (cleanPara.length < 80 && !cleanPara.endsWith('.')) {
        currentHeading = cleanPara;
      }

      if ((currentChunk + ' ' + cleanPara).length > chunkSize && currentChunk.length > 0) {
        chunks.push({
          text: currentChunk.trim(),
          chunkIndex: chunkIndex++,
          heading: currentHeading,
          pageNumber: Math.max(1, Math.floor(chunkIndex / 3) + 1),
        });

        // Retain overlap from end of previous chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 10)).join(' ');
        currentChunk = overlapWords + ' ' + cleanPara;
      } else {
        currentChunk = currentChunk ? `${currentChunk} ${cleanPara}` : cleanPara;
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push({
        text: currentChunk.trim(),
        chunkIndex: chunkIndex++,
        heading: currentHeading,
        pageNumber: Math.max(1, Math.floor(chunkIndex / 3) + 1),
      });
    }

    return chunks;
  }
}

module.exports = DocumentParser;
