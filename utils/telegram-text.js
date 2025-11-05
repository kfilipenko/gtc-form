/**
 * Telegram Text Processing Utilities
 * 
 * This module provides utilities for processing text to be sent via Telegram,
 * including MarkdownV2 character escaping and message chunking.
 */

/**
 * Escapes special characters for Telegram MarkdownV2 format
 * 
 * In Telegram's MarkdownV2, the following characters must be escaped with a backslash:
 * \ _ * [ ] ( ) ~ ` > # + - = | { } . !
 * 
 * Note: Backslash must be escaped first to avoid double-escaping
 * 
 * @param {string} text - The text to escape
 * @returns {string} - The escaped text safe for Telegram MarkdownV2
 */
function escapeMarkdownV2(text) {
  if (typeof text !== 'string') {
    return String(text || '');
  }
  
  // First escape backslashes to avoid double-escaping
  // Then escape all other special MarkdownV2 characters
  return text
    .replace(/\\/g, '\\\\')
    .replace(/([_*\[\]()~`>#+\-=|{}.!])/g, '\\$1');
}

/**
 * Chunks text into segments suitable for Telegram messages
 * 
 * Telegram has a limit of 4096 characters per message. This function splits
 * longer text into appropriately sized chunks.
 * 
 * @param {string} text - The text to chunk
 * @param {number} maxLength - Maximum length per chunk (default: 4000 to leave room for formatting)
 * @returns {string[]} - Array of text chunks
 */
function chunkText(text, maxLength = 4000) {
  if (typeof text !== 'string') {
    text = String(text || '');
  }
  
  if (text.length <= maxLength) {
    return [text];
  }
  
  const chunks = [];
  let currentChunk = '';
  
  // Split by newlines to try to keep logical breaks
  const lines = text.split('\n');
  
  for (const line of lines) {
    // If adding this line would exceed the limit
    if (currentChunk.length + line.length + 1 > maxLength) {
      // If current chunk is not empty, save it
      if (currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = '';
      }
      
      // If the line itself is too long, split it by words
      if (line.length > maxLength) {
        const words = line.split(' ');
        for (const word of words) {
          if (currentChunk.length + word.length + 1 > maxLength) {
            if (currentChunk.length > 0) {
              chunks.push(currentChunk);
              currentChunk = '';
            }
            // If even a single word is too long, split it
            if (word.length > maxLength) {
              for (let i = 0; i < word.length; i += maxLength) {
                chunks.push(word.slice(i, i + maxLength));
              }
            } else {
              currentChunk = word;
            }
          } else {
            currentChunk += (currentChunk.length > 0 ? ' ' : '') + word;
          }
        }
      } else {
        currentChunk = line;
      }
    } else {
      currentChunk += (currentChunk.length > 0 ? '\n' : '') + line;
    }
  }
  
  // Add the last chunk if it's not empty
  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }
  
  return chunks.length > 0 ? chunks : [''];
}

/**
 * Sanitizes and validates a stage number to ensure it's a valid integer
 * 
 * @param {*} stage - The stage value to sanitize
 * @returns {number|null} - The validated integer stage number, or null if invalid
 */
function sanitizeStageNumber(stage) {
  // If it's already a number
  if (typeof stage === 'number') {
    return Number.isInteger(stage) ? stage : Math.floor(stage);
  }
  
  // If it's a string, try to parse it
  if (typeof stage === 'string') {
    // Remove any whitespace
    const trimmed = stage.trim();
    
    // Parse as integer
    const parsed = parseInt(trimmed, 10);
    
    // Check if it's a valid number
    if (!isNaN(parsed) && isFinite(parsed)) {
      return parsed;
    }
  }
  
  // Return null for invalid input
  return null;
}

/**
 * Prepares text for Telegram by escaping and optionally chunking
 * 
 * @param {string} text - The text to prepare
 * @param {boolean} escape - Whether to escape MarkdownV2 characters (default: true)
 * @param {boolean} chunk - Whether to chunk the text (default: false)
 * @param {number} maxLength - Maximum chunk length if chunking is enabled (default: 4000)
 * @returns {string|string[]} - Escaped text or array of chunks if chunking is enabled
 */
function prepareTelegramText(text, escape = true, chunk = false, maxLength = 4000) {
  let processedText = text;
  
  // First escape if needed
  if (escape) {
    processedText = escapeMarkdownV2(text);
  }
  
  // Then chunk if needed
  if (chunk) {
    return chunkText(processedText, maxLength);
  }
  
  return processedText;
}

/**
 * Creates a formatted output object for Telegram messages
 * 
 * @param {string} text - The original text
 * @param {string|number} chatId - The Telegram chat ID
 * @param {number} stage - The conversation stage number
 * @returns {Object} - Formatted object with tg_text, chat_id, stage, and full_output
 */
function createTelegramOutput(text, chatId, stage) {
  const sanitizedStage = sanitizeStageNumber(stage);
  
  if (sanitizedStage === null) {
    throw new Error(`Invalid stage number: ${stage}`);
  }
  
  return {
    tg_text: escapeMarkdownV2(text),
    chat_id: String(chatId),
    stage: sanitizedStage,
    full_output: text
  };
}

// Export functions for use in other modules or n8n workflows
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    escapeMarkdownV2,
    chunkText,
    sanitizeStageNumber,
    prepareTelegramText,
    createTelegramOutput
  };
}

// Also make available in browser/global context
if (typeof window !== 'undefined') {
  window.TelegramTextUtils = {
    escapeMarkdownV2,
    chunkText,
    sanitizeStageNumber,
    prepareTelegramText,
    createTelegramOutput
  };
}
