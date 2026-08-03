/**
 * Local (non-AI) manuscript analysis.
 * Analyzes novel and screenplay formatting without using integration credits.
 */

/** Convert HTML to block array for analysis */
export function htmlToBlocks(html) {
  if (!html) return [];
  const blocks = [];
  const div = typeof document !== 'undefined' ? document.createElement('div') : null;
  if (!div) return [];
  div.innerHTML = html;

  for (const child of div.children) {
    const tag = child.tagName.toLowerCase();
    const text = child.textContent.trim();
    if (!text) continue;
    blocks.push({ tag, text, html: child.innerHTML });
  }
  return blocks;
}

/** Detect passive voice (simple heuristic) */
function hasPassiveVoice(sentence) {
  const passivePattern = /\b(is|are|was|were|been|being|be)\s+(\w+ed|written|spoken|taken|given|made|done|seen|known|found)\b/i;
  return passivePattern.test(sentence);
}

/** Count adverbs (words ending in -ly, excluding common non-adverbs) */
function countAdverbs(text) {
  const exceptions = new Set(['only', 'early', 'daily', 'family', 'holy', 'lily', 'july', 'fly', 'ally', 'apply', 'reply', 'supply', 'rely', 'ugly', 'belly', 'jelly', 'bully', 'holly']);
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(w => w.endsWith('ly') && w.length > 3 && !exceptions.has(w));
}

/** Find repeated words in proximity */
function findRepeatedWords(text, windowSize = 50) {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4);
  const repeated = [];
  const seen = new Map();

  words.forEach((word, i) => {
    if (seen.has(word) && i - seen.get(word) < windowSize) {
      repeated.push(word);
    }
    seen.set(word, i);
  });

  return [...new Set(repeated)];
}

/**
 * Analyze a novel manuscript.
 */
export function analyzeNovel(html) {
  const issues = [];
  const blocks = htmlToBlocks(html);
  const fullText = blocks.map(b => b.text).join(' ');
  const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);

  // Long paragraphs
  blocks.forEach((block, i) => {
    if (block.tag === 'p' && block.text.split(/\s+/).length > 200) {
      issues.push({
        type: 'long_paragraph',
        severity: 'warning',
        message: `Paragraph ${i + 1} is very long (${block.text.split(/\s+/).length} words). Consider breaking it up.`,
      });
    }
  });

  // Long sentences
  sentences.forEach((s, i) => {
    const wordCount = s.trim().split(/\s+/).length;
    if (wordCount > 40) {
      issues.push({
        type: 'long_sentence',
        severity: 'info',
        message: `Sentence ${i + 1} has ${wordCount} words. Long sentences can lose the reader.`,
        excerpt: s.trim().slice(0, 80) + '...',
      });
    }
  });

  // Passive voice
  const passiveCount = sentences.filter(hasPassiveVoice).length;
  if (passiveCount > sentences.length * 0.3) {
    issues.push({
      type: 'passive_voice',
      severity: 'warning',
      message: `${passiveCount} of ${sentences.length} sentences use passive voice (${Math.round(passiveCount / sentences.length * 100)}%). Consider active voice.`,
    });
  }

  // Adverbs
  const adverbs = countAdverbs(fullText);
  if (adverbs.length > 10) {
    issues.push({
      type: 'adverbs',
      severity: 'info',
      message: `Found ${adverbs.length} adverbs. "The road to hell is paved with adverbs." — Stephen King`,
      details: adverbs.slice(0, 10).join(', '),
    });
  }

  // Repeated words
  const repeated = findRepeatedWords(fullText);
  if (repeated.length > 0) {
    issues.push({
      type: 'repeated_words',
      severity: 'info',
      message: `Repeated words in close proximity: ${repeated.slice(0, 8).join(', ')}`,
    });
  }

  // Scene breaks (check for consistent use of separators)
  const separators = blocks.filter(b => b.text === '***' || b.text === '---' || b.text === '* * *');
  if (separators.length > 0) {
    const types = [...new Set(separators.map(b => b.text))];
    if (types.length > 1) {
      issues.push({
        type: 'scene_breaks',
        severity: 'warning',
        message: `Inconsistent scene break markers: using ${types.join(', ')}. Pick one style.`,
      });
    }
  }

  // Heading consistency
  const headings = blocks.filter(b => ['h1', 'h2', 'h3'].includes(b.tag));
  if (headings.length > 0) {
    const levels = [...new Set(headings.map(b => b.tag))];
    if (levels.includes('h1') && levels.includes('h3') && !levels.includes('h2')) {
      issues.push({
        type: 'heading_consistency',
        severity: 'info',
        message: 'Heading levels skip from H1 to H3. Consider using H2 for chapter sections.',
      });
    }
  }

  return issues;
}

/**
 * Analyze a screenplay manuscript.
 */
export function analyzeScreenplay(html) {
  const issues = [];
  const blocks = htmlToBlocks(html);

  // Scene headings (should be H2 and uppercase)
  const h2s = blocks.filter(b => b.tag === 'h2');
  h2s.forEach((block, i) => {
    if (block.text !== block.text.toUpperCase()) {
      issues.push({
        type: 'scene_heading',
        severity: 'warning',
        message: `Scene heading ${i + 1} should be ALL CAPS: "${block.text.slice(0, 40)}"`,
      });
    }
    if (!/^(INT\.|EXT\.|INT\/EXT\.)/.test(block.text.toUpperCase())) {
      issues.push({
        type: 'scene_heading_format',
        severity: 'info',
        message: `Scene heading should start with INT., EXT., or INT/EXT.: "${block.text.slice(0, 40)}"`,
      });
    }
  });

  // Transitions (should be bold and right-aligned, check for common ones)
  const transitions = ['CUT TO:', 'FADE TO:', 'DISSOLVE TO:', 'SMASH CUT:', 'MATCH CUT:', 'FADE OUT.', 'FADE IN:'];
  blocks.forEach(block => {
    const upper = block.text.toUpperCase().trim();
    if (transitions.some(t => upper === t) && block.tag !== 'p') {
      issues.push({
        type: 'transition',
        severity: 'info',
        message: `Transition "${block.text}" should be formatted as a right-aligned paragraph.`,
      });
    }
  });

  // Parentheticals (should be in italics/em)
  const parenBlocks = blocks.filter(b => b.text.startsWith('(') && b.text.endsWith(')'));
  parenBlocks.forEach(block => {
    if (!block.html.includes('<em>') && !block.html.includes('<i>')) {
      issues.push({
        type: 'parenthetical',
        severity: 'info',
        message: `Parenthetical "${block.text.slice(0, 30)}" should be formatted in italics.`,
      });
    }
  });

  // Pacing — check for very long action blocks
  blocks.filter(b => b.tag === 'p').forEach((block, i) => {
    const words = block.text.split(/\s+/).length;
    if (words > 60) {
      issues.push({
        type: 'pacing',
        severity: 'warning',
        message: `Action block ${i + 1} is ${words} words. Keep action lines tight and visual.`,
      });
    }
  });

  return issues;
}

/**
 * Route analysis based on writing mode.
 * @param {string} html - The manuscript content
 * @param {'novel'|'screenplay'} mode - The writing mode
 * @returns {Array} Array of issue objects
 */
export function analyzeManuscript(html, mode) {
  if (mode === 'screenplay') return analyzeScreenplay(html);
  return analyzeNovel(html);
}
