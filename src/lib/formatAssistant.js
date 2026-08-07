/**
 * Local manuscript analysis.
 * Works with both plain text (textarea) and HTML (rich editor).
 * Analyzes novel and screenplay formatting without using any API.
 */

/** Convert content to blocks — handles both plain text and HTML */
export function htmlToBlocks(content) {
  if (!content) return [];

  // Check if it's HTML (has tags) or plain text
  const isHtml = /<[^>]+>/.test(content);

  if (isHtml && typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = content;
    const blocks = [];
    for (const child of div.children) {
      const tag = child.tagName.toLowerCase();
      const text = child.textContent.trim();
      if (!text) continue;
      blocks.push({ tag, text, html: child.innerHTML });
    }
    return blocks;
  }

  // Plain text: split by double newlines (paragraphs) or single newlines
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
  return paragraphs.map(p => ({
    tag: 'p',
    text: p.trim(),
    html: p.trim(),
  }));
}

/** Split text into sentences */
function splitSentences(text) {
  // Split on sentence-ending punctuation followed by space or end
  return text
    .split(/(?<=[.!?])\s+/)
    .filter(s => s.trim().length > 0)
    .map(s => s.trim());
}

/** Detect passive voice */
function hasPassiveVoice(sentence) {
  const passivePattern = /\b(is|are|was|were|been|being|be|get|gets|got|gotten)\s+(\w+ed|written|spoken|taken|given|made|done|seen|known|found|told|shown|brought|thought|kept|heard|built|sent|left|held|read|run|cut|put|set|hit|let|paid|said)\b/i;
  return passivePattern.test(sentence);
}

/** Count adverbs */
function findAdverbs(text) {
  const exceptions = new Set(['only', 'early', 'daily', 'family', 'holy', 'lily', 'july', 'fly', 'ally', 'apply', 'reply', 'supply', 'rely', 'ugly', 'belly', 'jelly', 'bully', 'holly', 'lonely', 'likely', 'friendly', 'lovely', 'elderly', 'lively', 'costly']);
  const words = text.toLowerCase().match(/\b\w+ly\b/g) || [];
  return words.filter(w => w.length > 4 && !exceptions.has(w));
}

/** Find repeated words in proximity */
function findRepeatedWords(text, windowSize = 40) {
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4);
  const repeated = [];
  const seen = new Map();
  const commonWords = new Set(['their', 'there', 'would', 'could', 'should', 'about', 'which', 'other', 'being', 'after', 'before', 'those', 'these', 'where', 'still', 'never', 'every']);

  words.forEach((word, i) => {
    if (commonWords.has(word)) return;
    if (seen.has(word) && i - seen.get(word) < windowSize) {
      repeated.push(word);
    }
    seen.set(word, i);
  });

  return [...new Set(repeated)];
}

/** Detect dialogue-heavy passages */
function analyzeDialogueBalance(text) {
  const lines = text.split('\n');
  const dialogueLines = lines.filter(l => l.includes('"') || l.includes('\u201C') || l.includes('\u201D'));
  const ratio = lines.length > 0 ? dialogueLines.length / lines.length : 0;
  return ratio;
}

/** Find "telling" phrases that could be shown */
function findTellingPhrases(text) {
  const patterns = [
    { regex: /\b(he|she|they|it|I)\s+(felt|thought|knew|realized|noticed|wondered|decided|believed|understood|remembered)\b/gi, label: 'telling emotion' },
    { regex: /\b(was|were)\s+(happy|sad|angry|scared|afraid|excited|nervous|worried|anxious|tired|bored|confused|surprised|shocked)\b/gi, label: 'stated emotion' },
    { regex: /\b(it was|things were|everything was)\s+(clear|obvious|apparent|evident)\b/gi, label: 'telling clarity' },
  ];

  const found = [];
  for (const p of patterns) {
    const regex = new RegExp(p.regex.source, p.regex.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      found.push({ text: m[0], label: p.label });
    }
  }
  return found;
}

/**
 * Analyze a novel manuscript.
 */
export function analyzeNovel(content) {
  const issues = [];
  const blocks = htmlToBlocks(content);
  const fullText = blocks.map(b => b.text).join(' ');

  if (fullText.length < 20) return issues;

  const sentences = splitSentences(fullText);
  const wordCount = fullText.split(/\s+/).length;

  // 1. Long paragraphs
  blocks.forEach((block, i) => {
    const wc = block.text.split(/\s+/).length;
    if (wc > 150) {
      issues.push({
        type: 'long_paragraph',
        severity: 'warning',
        message: `Paragraph ${i + 1} is ${wc} words. Consider breaking it into shorter paragraphs for readability.`,
        excerpt: block.text.slice(0, 60) + '...',
      });
    }
  });

  // 2. Long sentences
  const longSentences = sentences.filter(s => s.split(/\s+/).length > 35);
  if (longSentences.length > 0) {
    issues.push({
      type: 'long_sentences',
      severity: 'info',
      message: `${longSentences.length} sentence${longSentences.length > 1 ? 's' : ''} over 35 words. Long sentences can tire the reader.`,
      excerpt: longSentences[0].slice(0, 70) + '...',
      details: longSentences.length > 1 ? `Longest: ${Math.max(...longSentences.map(s => s.split(/\s+/).length))} words` : undefined,
    });
  }

  // 3. Sentence length variety
  if (sentences.length > 5) {
    const lengths = sentences.map(s => s.split(/\s+/).length);
    const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
    const stdDev = Math.sqrt(variance);
    if (stdDev < 3 && sentences.length > 8) {
      issues.push({
        type: 'sentence_variety',
        severity: 'info',
        message: `Sentences have very similar length (avg ${Math.round(avg)} words, low variation). Vary short and long sentences to create rhythm.`,
      });
    }
  }

  // 4. Passive voice
  const passiveSentences = sentences.filter(hasPassiveVoice);
  const passiveRatio = sentences.length > 0 ? passiveSentences.length / sentences.length : 0;
  if (passiveRatio > 0.25 && passiveSentences.length > 3) {
    issues.push({
      type: 'passive_voice',
      severity: 'warning',
      message: `${passiveSentences.length} of ${sentences.length} sentences (${Math.round(passiveRatio * 100)}%) use passive voice. Active voice is usually stronger in fiction.`,
      excerpt: passiveSentences[0]?.slice(0, 60) + '...',
    });
  }

  // 5. Adverbs
  const adverbs = findAdverbs(fullText);
  const adverbDensity = wordCount > 0 ? adverbs.length / wordCount * 100 : 0;
  if (adverbs.length > 5 && adverbDensity > 1.5) {
    issues.push({
      type: 'adverbs',
      severity: 'info',
      message: `${adverbs.length} adverbs detected (${adverbDensity.toFixed(1)}% density). Strong verbs often work better than verb + adverb.`,
      details: 'Found: ' + [...new Set(adverbs)].slice(0, 8).join(', '),
    });
  }

  // 6. Repeated words in proximity
  const repeated = findRepeatedWords(fullText);
  if (repeated.length > 0) {
    issues.push({
      type: 'repeated_words',
      severity: 'info',
      message: `Words repeated in close proximity: ${repeated.slice(0, 6).join(', ')}. Consider synonyms or restructuring.`,
    });
  }

  // 7. Show don't tell
  const telling = findTellingPhrases(fullText);
  if (telling.length > 2) {
    issues.push({
      type: 'show_dont_tell',
      severity: 'info',
      message: `${telling.length} "telling" phrases found. Show emotions through action and body language instead.`,
      details: telling.slice(0, 3).map(t => `"${t.text}"`).join(', '),
    });
  }

  // 8. Dialogue balance
  const dialogueRatio = analyzeDialogueBalance(fullText);
  if (dialogueRatio > 0.8 && blocks.length > 3) {
    issues.push({
      type: 'dialogue_heavy',
      severity: 'info',
      message: 'This passage is very dialogue-heavy. Consider adding beats, action, and interiority between lines.',
    });
  } else if (dialogueRatio < 0.05 && wordCount > 300) {
    issues.push({
      type: 'no_dialogue',
      severity: 'info',
      message: 'No dialogue detected in a long passage. Dialogue can break up exposition and reveal character.',
    });
  }

  // 9. Opening with weak starts
  if (blocks.length > 0) {
    const firstLine = blocks[0].text.toLowerCase();
    if (firstLine.startsWith('it was') || firstLine.startsWith('there was') || firstLine.startsWith('there were')) {
      issues.push({
        type: 'weak_opening',
        severity: 'info',
        message: `Scene opens with "${blocks[0].text.slice(0, 20)}..." — "It was" / "There was" openings are weak. Start with action or a specific image.`,
      });
    }
  }

  // 10. Exclamation marks
  const exclamationCount = (fullText.match(/!/g) || []).length;
  if (exclamationCount > 3 && exclamationCount > sentences.length * 0.15) {
    issues.push({
      type: 'exclamation_marks',
      severity: 'info',
      message: `${exclamationCount} exclamation marks — use sparingly. Let the words convey intensity.`,
    });
  }

  return issues;
}

/**
 * Analyze a screenplay manuscript.
 */
export function analyzeScreenplay(content) {
  const issues = [];
  const blocks = htmlToBlocks(content);
  const fullText = blocks.map(b => b.text).join('\n');

  if (fullText.length < 20) return issues;

  // Scene headings
  const headingPattern = /^(INT\.|EXT\.|INT\/EXT\.)/i;
  const potentialHeadings = blocks.filter(b => headingPattern.test(b.text));
  const nonUpperHeadings = potentialHeadings.filter(b => b.text !== b.text.toUpperCase());
  if (nonUpperHeadings.length > 0) {
    issues.push({
      type: 'scene_heading',
      severity: 'warning',
      message: `${nonUpperHeadings.length} scene heading(s) not in ALL CAPS.`,
      excerpt: nonUpperHeadings[0]?.text.slice(0, 40),
    });
  }

  // Long action blocks
  blocks.forEach((block, i) => {
    const words = block.text.split(/\s+/).length;
    if (words > 50 && !block.text.includes('"')) {
      issues.push({
        type: 'long_action',
        severity: 'warning',
        message: `Action block ${i + 1} is ${words} words. Keep action lines to 3-4 lines max — be visual and concise.`,
        excerpt: block.text.slice(0, 50) + '...',
      });
    }
  });

  // Camera directions (should be avoided in spec scripts)
  const cameraPattern = /\b(CLOSE ON|WIDE SHOT|PAN TO|ZOOM IN|ANGLE ON|POV|TRACKING SHOT|CRANE SHOT|DOLLY)\b/gi;
  const cameraDirections = fullText.match(cameraPattern) || [];
  if (cameraDirections.length > 0) {
    issues.push({
      type: 'camera_directions',
      severity: 'info',
      message: `${cameraDirections.length} camera direction(s) found. Spec scripts should avoid directing — describe what we SEE instead.`,
      details: [...new Set(cameraDirections)].slice(0, 4).join(', '),
    });
  }

  // "We see" / "We hear" (filter words)
  const filterPattern = /\b(we see|we hear|we notice|we watch)\b/gi;
  const filterWords = fullText.match(filterPattern) || [];
  if (filterWords.length > 0) {
    issues.push({
      type: 'filter_words',
      severity: 'info',
      message: `"${filterWords[0]}" — avoid filter words. Just describe what happens directly.`,
    });
  }

  // Parentheticals overuse
  const parenPattern = /\([^)]+\)/g;
  const parentheticals = fullText.match(parenPattern) || [];
  if (parentheticals.length > 5) {
    issues.push({
      type: 'parentheticals',
      severity: 'info',
      message: `${parentheticals.length} parentheticals — use sparingly. Trust actors to interpret the line.`,
    });
  }

  return issues;
}

/**
 * Main entry point.
 * @param {string} content - Text or HTML content
 * @param {'novel'|'screenplay'} mode - Writing mode
 * @returns {Array} Array of issue objects
 */
export function analyzeManuscript(content, mode) {
  try {
    if (!content || content.trim().length < 20) return [];
    if (mode === 'screenplay') return analyzeScreenplay(content);
    return analyzeNovel(content);
  } catch (err) {
    console.error('[FormatAssistant] Analysis error:', err);
    return [];
  }
}
