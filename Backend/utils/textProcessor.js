import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

/**
 * Configuration for different content types
 */
const CHUNK_CONFIGS = {
  youtube: { chunkSize: 1000, chunkOverlap: 100 },
  pdf: { chunkSize: 500, chunkOverlap: 50 },
  text: { chunkSize: 1000, chunkOverlap: 100 },
  web: { chunkSize: 1000, chunkOverlap: 100 },
};

/**
 * Split text into chunks based on content type
 * @param {string} text - Text to split
 * @param {string} type - Content type (youtube, pdf, text, web)
 * @returns {Promise<Array<string>>} Array of text chunks
 */
export const splitText = async (text, type = 'text') => {
  const config = CHUNK_CONFIGS[type] || CHUNK_CONFIGS.text;
  
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
  });
  
  return await textSplitter.splitText(text);
};

/**
 * Create text splitter instance
 * @param {number} chunkSize - Size of each chunk
 * @param {number} chunkOverlap - Overlap between chunks
 * @returns {RecursiveCharacterTextSplitter}
 */
export const createTextSplitter = (chunkSize = 1000, chunkOverlap = 100) => {
  return new RecursiveCharacterTextSplitter({
    chunkSize,
    chunkOverlap,
  });
};
