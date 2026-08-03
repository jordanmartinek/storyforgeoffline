/**
 * AI prompt builders + JSON schemas for proofread and imagery.
 */

/** Strip HTML tags to plain text */
export function htmlToPlainText(html) {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Build the proofread prompt for LLM */
export function buildProofreadPrompt(text) {
  return [
    'You are a professional editor. Analyze the following text for grammar,',
    'spelling, punctuation, and style issues. For each issue provide the',
    'exact original text and a corrected version.',
    '',
    'TEXT:',
    '"""',
    text,
    '"""',
    '',
    'Return corrections as JSON matching the schema.',
  ].join('\n');
}

/** JSON schema for proofread response */
export const PROOF_SCHEMA = {
  type: 'object',
  properties: {
    corrections: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          original: { type: 'string' },
          corrected: { type: 'string' },
          reason: { type: 'string' },
          severity: {
            type: 'string',
            enum: ['error', 'warning', 'suggestion'],
          },
        },
        required: ['original', 'corrected', 'reason'],
      },
    },
  },
  required: ['corrections'],
};

/** Build the imagery/metaphor prompt for LLM */
export function buildImageryPrompt(text) {
  return [
    'You are a creative writing assistant specializing in vivid imagery.',
    'Read the following passage and suggest metaphors, similes, and sensory',
    'comparisons that could enhance the writing. Provide 3-5 suggestions.',
    '',
    'PASSAGE:',
    '"""',
    text,
    '"""',
    '',
    'Return suggestions as JSON matching the schema.',
  ].join('\n');
}

/** JSON schema for imagery response */
export const IMAGERY_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['metaphor', 'simile', 'comparison', 'sensory'],
          },
          original_context: { type: 'string' },
          suggestion: { type: 'string' },
          effect: { type: 'string' },
        },
        required: ['type', 'suggestion'],
      },
    },
  },
  required: ['suggestions'],
};
