/**
 * @file sanitization.js
 * A simple utility for sanitizing user input to prevent XSS.
 */

/**
 * Sanitizes a string by converting HTML special characters to their entities.
 * @param {string} str The string to sanitize.
 * @returns {string} The sanitized string.
 */
export function sanitizeHTML(str) {
  if (typeof str !== 'string') {
    return '';
  }
  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}
