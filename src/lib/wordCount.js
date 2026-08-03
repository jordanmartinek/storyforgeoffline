/**
 * Count words in HTML content by stripping tags.
 * @param {string} html
 * @returns {number}
 */
export function countWords(html) {
  if (!html) return 0;
  const text = html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').trim();
  if (!text) return 0;
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Estimate reading time in minutes (~250 wpm).
 * @param {number} words
 * @returns {number}
 */
export function readingTime(words) {
  return Math.max(1, Math.ceil(words / 250));
}
