/**
 * Writing assistant powered by LanguageTool's free public API.
 * Falls back to enhanced local checks if the API is unreachable.
 * 
 * LanguageTool provides professional-grade grammar, spelling, and style checking
 * with context-aware suggestions — no API key required.
 */

const LANGUAGETOOL_URL = 'https://api.languagetool.org/v2/check';

/**
 * Check text using LanguageTool's public API.
 * Free tier: up to 20 requests/min, 10,000 chars per request.
 * @param {string} text - Plain text to check
 * @param {string} language - Language code (default: 'en-US')
 * @returns {Promise<Array>} Array of issue objects
 */
export async function checkWithLanguageTool(text, language = 'en-US') {
  if (!text || text.length < 3) return [];

  // Chunk text if over 10,000 chars (API limit)
  const maxLen = 9500;
  const chunks = [];
  for (let i = 0; i < text.length; i += maxLen) {
    chunks.push({ text: text.slice(i, i + maxLen), offset: i });
  }

  const allIssues = [];

  for (const chunk of chunks) {
    try {
      const res = await fetch(LANGUAGETOOL_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          text: chunk.text,
          language: language,
          enabledOnly: 'false',
        }),
      });

      if (!res.ok) {
        console.warn('LanguageTool API returned', res.status);
        // Fall back to local checks for this chunk
        allIssues.push(...localCheck(chunk.text, chunk.offset));
        continue;
      }

      const data = await res.json();
      const matches = data.matches || [];

      for (const match of matches) {
        const offset = match.offset + chunk.offset;
        const length = match.length;
        const original = text.slice(offset, offset + length);
        const replacement = match.replacements?.[0]?.value || '';
        const category = match.rule?.category?.id || '';
        const ruleId = match.rule?.id || '';

        // Map LanguageTool categories to our severity
        let severity = 'warning';
        if (category === 'TYPOS' || category === 'SPELLING' || ruleId.includes('SPELL')) {
          severity = 'error';
        } else if (category === 'GRAMMAR' || category === 'PUNCTUATION') {
          severity = 'warning';
        } else if (category === 'STYLE' || category === 'REDUNDANCY' || category === 'TYPOGRAPHY') {
          severity = 'style';
        } else if (category === 'CASING') {
          severity = 'warning';
        }

        allIssues.push({
          original,
          corrected: replacement,
          reason: match.message || 'Issue detected',
          shortMessage: match.shortMessage || '',
          severity,
          position: offset,
          length,
          category: category,
          ruleId: ruleId,
          replacements: (match.replacements || []).slice(0, 5).map(r => r.value),
        });
      }
    } catch (err) {
      console.warn('LanguageTool API unreachable, using local fallback:', err.message);
      allIssues.push(...localCheck(chunk.text, chunk.offset));
    }
  }

  return allIssues.sort((a, b) => a.position - b.position);
}

// ─── Enhanced Local Fallback ────────────────────────────────────────────────────

const MISSPELLINGS = {
  'accomodate': 'accommodate', 'acheive': 'achieve', 'accross': 'across',
  'agressive': 'aggressive', 'apparantly': 'apparently', 'arguement': 'argument',
  'basicly': 'basically', 'begining': 'beginning', 'beleive': 'believe',
  'buisness': 'business', 'calender': 'calendar', 'cemetary': 'cemetery',
  'comming': 'coming', 'commitee': 'committee', 'completly': 'completely',
  'concious': 'conscious', 'definitly': 'definitely', 'dissapear': 'disappear',
  'embarass': 'embarrass', 'enviroment': 'environment', 'exagerate': 'exaggerate',
  'excercise': 'exercise', 'existance': 'existence', 'familar': 'familiar',
  'finaly': 'finally', 'foriegn': 'foreign', 'freind': 'friend',
  'goverment': 'government', 'gaurd': 'guard', 'happend': 'happened',
  'heirarchy': 'hierarchy', 'immediatly': 'immediately', 'independant': 'independent',
  'knowlege': 'knowledge', 'libary': 'library', 'maintainance': 'maintenance',
  'neccessary': 'necessary', 'nieghbor': 'neighbor', 'noticable': 'noticeable',
  'occured': 'occurred', 'occurence': 'occurrence', 'oportunity': 'opportunity',
  'posession': 'possession', 'prefered': 'preferred', 'privelege': 'privilege',
  'pronounciation': 'pronunciation', 'realy': 'really', 'recieve': 'receive',
  'recomend': 'recommend', 'relevent': 'relevant', 'remeber': 'remember',
  'resturant': 'restaurant', 'rythm': 'rhythm', 'sentance': 'sentence',
  'seperate': 'separate', 'similer': 'similar', 'speach': 'speech',
  'strenght': 'strength', 'succesful': 'successful', 'surprize': 'surprise',
  'therefor': 'therefore', 'tommorow': 'tomorrow', 'truely': 'truly',
  'untill': 'until', 'usefull': 'useful', 'wether': 'whether', 'wierd': 'weird',
  'writting': 'writing', 'teh': 'the', 'adn': 'and', 'taht': 'that',
  'alot': 'a lot', 'noone': 'no one',
};

const GRAMMAR_RULES = [
  { pattern: /\b(\w+)\s+\1\b/gi, message: (m) => `Repeated word: "${m[1]}"`, fix: (m) => m[1], severity: 'error', skip: ['had', 'that', 'very', 'so', 'no'] },
  { pattern: /\bcould\s+of\b/gi, message: () => '"Could of" should be "could have"', fix: () => 'could have', severity: 'warning' },
  { pattern: /\bwould\s+of\b/gi, message: () => '"Would of" should be "would have"', fix: () => 'would have', severity: 'warning' },
  { pattern: /\bshould\s+of\b/gi, message: () => '"Should of" should be "should have"', fix: () => 'should have', severity: 'warning' },
  { pattern: /\bmight\s+of\b/gi, message: () => '"Might of" should be "might have"', fix: () => 'might have', severity: 'warning' },
  { pattern: /\bmust\s+of\b/gi, message: () => '"Must of" should be "must have"', fix: () => 'must have', severity: 'warning' },
  { pattern: /\byour\s+(going|coming|doing|being|welcome|right|wrong|fired|hired)\b/gi, message: () => 'Did you mean "you\'re" (you are)?', fix: (m) => m[0].replace(/^your/i, "you're"), severity: 'warning' },
  { pattern: /\btheir\s+(is|are|was|were|has|have|will|would|could|should|might|must)\b/gi, message: () => 'Did you mean "there"?', fix: (m) => m[0].replace(/^their/i, 'there'), severity: 'warning' },
  { pattern: /\bits\s+(a|the|very|not|been|going|time|own)\b/gi, message: () => 'Did you mean "it\'s" (it is)?', fix: (m) => m[0].replace(/^its/i, "it's"), severity: 'style' },
  { pattern: /([,;])([A-Za-z])/g, message: () => 'Missing space after punctuation', fix: (m) => m[1] + ' ' + m[2], severity: 'warning' },
  { pattern: /([.!?])\s+([a-z])/g, message: () => 'Capitalize the first word of a sentence', fix: (m) => m[1] + ' ' + m[2].toUpperCase(), severity: 'warning', skipCheck: (text, idx) => /\b[A-Za-z]{1,3}\.$/.test(text.slice(Math.max(0, idx - 4), idx + 1)) },
];

const STYLE_RULES = [
  { pattern: /\b(very|really|extremely|totally|completely|absolutely|literally)\s+(good|bad|big|small|nice|great|important|interesting)\b/gi, message: (m) => `Consider a stronger word instead of "${m[0]}"`, severity: 'style' },
  { pattern: /\b(in order to)\b/gi, message: () => '"In order to" can usually be shortened to "to"', fix: () => 'to', severity: 'style' },
  { pattern: /\b(at this point in time)\b/gi, message: () => 'Wordy — use "now" or "currently"', fix: () => 'now', severity: 'style' },
  { pattern: /\b(due to the fact that)\b/gi, message: () => 'Wordy — use "because"', fix: () => 'because', severity: 'style' },
  { pattern: /\b(in the event that)\b/gi, message: () => 'Wordy — use "if"', fix: () => 'if', severity: 'style' },
  { pattern: /\b(it is important to note that)\b/gi, message: () => 'Unnecessary filler — just state the point', severity: 'style' },
  { pattern: /\b(suddenly|immediately|instantly)\b/gi, message: (m) => `"${m[0]}" is often unnecessary in fiction — show the action directly`, severity: 'style' },
];

function localCheck(text, baseOffset = 0) {
  const issues = [];

  // Misspellings
  const wordPattern = /\b[a-zA-Z']+\b/g;
  let match;
  while ((match = wordPattern.exec(text)) !== null) {
    const lower = match[0].toLowerCase();
    if (MISSPELLINGS[lower]) {
      issues.push({
        original: match[0],
        corrected: MISSPELLINGS[lower],
        reason: `Misspelling: should be "${MISSPELLINGS[lower]}"`,
        severity: 'error',
        position: match.index + baseOffset,
        length: match[0].length,
        replacements: [MISSPELLINGS[lower]],
      });
    }
  }

  // Grammar rules
  for (const rule of GRAMMAR_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      if (rule.skip && rule.skip.includes(match[1]?.toLowerCase())) continue;
      if (rule.skipCheck && rule.skipCheck(text, match.index)) continue;
      const corrected = rule.fix ? (typeof rule.fix === 'function' ? rule.fix(match) : rule.fix) : '';
      issues.push({
        original: match[0],
        corrected,
        reason: typeof rule.message === 'function' ? rule.message(match) : rule.message,
        severity: rule.severity,
        position: match.index + baseOffset,
        length: match[0].length,
        replacements: corrected ? [corrected] : [],
      });
    }
  }

  // Style rules
  for (const rule of STYLE_RULES) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      const corrected = rule.fix ? (typeof rule.fix === 'function' ? rule.fix(match) : rule.fix) : '';
      issues.push({
        original: match[0],
        corrected,
        reason: typeof rule.message === 'function' ? rule.message(match) : rule.message,
        severity: rule.severity || 'style',
        position: match.index + baseOffset,
        length: match[0].length,
        replacements: corrected ? [corrected] : [],
      });
    }
  }

  return issues;
}

/**
 * Main entry point — tries LanguageTool API, falls back to local.
 */
export async function checkSpellingAndGrammar(text, language = 'en-US') {
  return checkWithLanguageTool(text, language);
}
