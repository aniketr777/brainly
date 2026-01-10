/**
 * Validation utilities for request data
 */

/**
 * Validates if a string is a valid URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid URL
 */
export const isValidUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * Validates if a string is a valid YouTube URL
 * @param {string} url - URL to validate
 * @returns {boolean} - True if valid YouTube URL
 */
export const isValidYoutubeUrl = (url) => {
  if (!isValidUrl(url)) return false;
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
  return youtubeRegex.test(url);
};

/**
 * Validates file size
 * @param {number} size - File size in bytes
 * @param {number} maxSize - Maximum allowed size in bytes
 * @returns {boolean} - True if size is within limit
 */
export const isValidFileSize = (size, maxSize) => {
  return size > 0 && size <= maxSize;
};

/**
 * Validates if text is not empty
 * @param {string} text - Text to validate
 * @returns {boolean} - True if text is valid
 */
export const isValidText = (text) => {
  return typeof text === 'string' && text.trim().length > 0;
};

/**
 * Validates MongoDB ObjectId format
 * @param {string} id - ID to validate
 * @returns {boolean} - True if valid ObjectId
 */
export const isValidMongoId = (id) => {
  return /^[a-f\d]{24}$/i.test(id);
};

/**
 * Validates document type
 * @param {string} type - Document type
 * @returns {boolean} - True if valid type
 */
export const isValidDocumentType = (type) => {
  const validTypes = ['youtube', 'pdf', 'text', 'web'];
  return validTypes.includes(type);
};

/**
 * Sanitizes text input
 * @param {string} text - Text to sanitize
 * @returns {string} - Sanitized text
 */
export const sanitizeText = (text) => {
  if (typeof text !== 'string') return '';
  return text.trim();
};
