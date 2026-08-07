/**
 * Writing assistant — grammar, spelling, and style checker.
 * 
 * Strategy:
 * 1. Tries LanguageTool's free public API (best quality)
 * 2. If API fails (CORS, 404, rate limit, offline) → falls back to local engine
 * 3. Local engine is comprehensive enough to be useful on its own
 * 
 * The app NEVER crashes on checker failure.
 */

const LANGUAGETOOL_URL = 'https://api.languagetool.org/v2/check';
const FETCH_TIMEOUT_MS = 8000;

// ─── LanguageTool API (with graceful fallback) ──────────────────────────────────

async function tryLanguageTool(text, language = 'en-US') {
  // AbortController for timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(LANGUAGETOOL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        text: text.slice(0, 9500), // API limit
        language: language,
        enabledOnly: 'false',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.warn('[SpellCheck] LanguageTool returned', res.status, '— using local fallback');
      return null; // signal to use local
    }

    const data = await res.json();
    if (!data || !Array.isArray(data.matches)) {
      return null;
    }

    return data.matches.map(match => {
      const category = match.rule?.category?.id || '';
      const ruleId = match.rule?.id || '';

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

      return {
        original: text.slice(match.offset, match.offset + match.length),
        corrected: match.replacements?.[0]?.value || '',
        reason: match.message || 'Issue detected',
        shortMessage: match.shortMessage || '',
        severity,
        position: match.offset,
        length: match.length,
        category,
        ruleId,
        replacements: (match.replacements || []).slice(0, 5).map(r => r.value),
      };
    });
  } catch (err) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.warn('[SpellCheck] LanguageTool timed out — using local fallback');
    } else {
      console.warn('[SpellCheck] LanguageTool unavailable:', err.message, '— using local fallback');
    }
    return null; // signal to use local
  }
}

// ─── Comprehensive Local Engine ─────────────────────────────────────────────────

const MISSPELLINGS = {
  'accomodate': 'accommodate', 'acheive': 'achieve', 'accross': 'across',
  'agressive': 'aggressive', 'apparantly': 'apparently', 'arguement': 'argument',
  'assasination': 'assassination', 'basicly': 'basically', 'begining': 'beginning',
  'beleive': 'believe', 'buisness': 'business', 'calender': 'calendar',
  'camoflage': 'camouflage', 'cemetary': 'cemetery', 'collegue': 'colleague',
  'comming': 'coming', 'commitee': 'committee', 'completly': 'completely',
  'concious': 'conscious', 'curiousity': 'curiosity', 'definitly': 'definitely',
  'definately': 'definitely', 'dilemna': 'dilemma', 'dissapear': 'disappear',
  'dissapoint': 'disappoint', 'ecstacy': 'ecstasy', 'embarass': 'embarrass',
  'enviroment': 'environment', 'exagerate': 'exaggerate', 'excercise': 'exercise',
  'existance': 'existence', 'familar': 'familiar', 'finaly': 'finally',
  'foriegn': 'foreign', 'freind': 'friend', 'goverment': 'government',
  'gaurd': 'guard', 'happend': 'happened', 'harrass': 'harass',
  'heirarchy': 'hierarchy', 'humourous': 'humorous', 'ignorence': 'ignorance',
  'immediatly': 'immediately', 'independant': 'independent', 'intellegence': 'intelligence',
  'jewlery': 'jewelry', 'knowlege': 'knowledge', 'liason': 'liaison',
  'libary': 'library', 'liesure': 'leisure', 'maintainance': 'maintenance',
  'millenium': 'millennium', 'mischievious': 'mischievous', 'neccessary': 'necessary',
  'necessery': 'necessary', 'nieghbor': 'neighbor', 'noticable': 'noticeable',
  'occassion': 'occasion', 'occured': 'occurred', 'occurence': 'occurrence',
  'oportunity': 'opportunity', 'paralel': 'parallel', 'percieve': 'perceive',
  'perseverence': 'perseverance', 'posession': 'possession', 'prefered': 'preferred',
  'privelege': 'privilege', 'professer': 'professor', 'pronounciation': 'pronunciation',
  'publically': 'publicly', 'realy': 'really', 'recieve': 'receive',
  'recomend': 'recommend', 'refered': 'referred', 'relevent': 'relevant',
  'religous': 'religious', 'remeber': 'remember', 'repitition': 'repetition',
  'resistence': 'resistance', 'resturant': 'restaurant', 'rythm': 'rhythm',
  'sentance': 'sentence', 'seperate': 'separate', 'similer': 'similar',
  'sinceerly': 'sincerely', 'speach': 'speech', 'strenght': 'strength',
  'succesful': 'successful', 'supercede': 'supersede', 'surprize': 'surprise',
  'temperture': 'temperature', 'tendancy': 'tendency', 'therefor': 'therefore',
  'tommorow': 'tomorrow', 'tounge': 'tongue', 'truely': 'truly',
  'tyrany': 'tyranny', 'untill': 'until', 'unuseual': 'unusual',
  'usefull': 'useful', 'vaccuum': 'vacuum', 'vehical': 'vehicle',
  'visious': 'vicious', 'wether': 'whether', 'wierd': 'weird',
  'writting': 'writing', 'yeild': 'yield',
  // Common typos
  'teh': 'the', 'adn': 'and', 'taht': 'that', 'ahve': 'have',
  'hte': 'the', 'nto': 'not', 'htat': 'that', 'nad': 'and',
  'waht': 'what', 'thier': 'their', 'ot': 'to', 'fo': 'of',
  'jsut': 'just', 'konw': 'know', 'whcih': 'which', 'wich': 'which',
  'becuase': 'because', 'beacuse': 'because', 'becasue': 'because',
  // Contractions people forget
  'dont': "don't", 'doesnt': "doesn't", 'didnt': "didn't",
  'wasnt': "wasn't", 'werent': "weren't", 'isnt': "isn't",
  'arent': "aren't", 'cant': "can't", 'wont': "won't",
  'wouldnt': "wouldn't", 'couldnt': "couldn't", 'shouldnt': "shouldn't",
  'youre': "you're", 'youve': "you've", 'theyre': "they're",
  'theyve': "they've", 'weve': "we've", 'ive': "I've",
  // Common confusions
  'alot': 'a lot', 'noone': 'no one', 'eachother': 'each other',
  'infact': 'in fact', 'inspite': 'in spite', 'aswell': 'as well',
  'infront': 'in front', 'alright': 'all right', 'eventhough': 'even though',
};

const GRAMMAR_RULES = [
  // Doubled words
  {
    regex: /\b(\w+)\s+\1\b/gi,
    skip: (m) => ['had', 'that', 'very', 'so', 'no', 'bye'].includes(m[1].toLowerCase()),
    msg: (m) => `Repeated word: "${m[1]}"`,
    fix: (m) => m[1],
    severity: 'error',
  },
  // could/would/should/might/must of → have
  { regex: /\bcould\s+of\b/gi, msg: () => '"Could of" → "could have" (or "could\'ve")', fix: () => 'could have', severity: 'warning' },
  { regex: /\bwould\s+of\b/gi, msg: () => '"Would of" → "would have"', fix: () => 'would have', severity: 'warning' },
  { regex: /\bshould\s+of\b/gi, msg: () => '"Should of" → "should have"', fix: () => 'should have', severity: 'warning' },
  { regex: /\bmight\s+of\b/gi, msg: () => '"Might of" → "might have"', fix: () => 'might have', severity: 'warning' },
  { regex: /\bmust\s+of\b/gi, msg: () => '"Must of" → "must have"', fix: () => 'must have', severity: 'warning' },
  // your/you're
  { regex: /\byour\s+(going|coming|doing|being|welcome|right|wrong|fired|hired|crazy|sure|kidding|not)\b/gi, msg: () => 'Did you mean "you\'re" (you are)?', fix: (m) => m[0].replace(/^your/i, "you're"), severity: 'warning' },
  // their/there
  { regex: /\btheir\s+(is|are|was|were|has|have|will|would|could|should|might|must|isn't|aren't|wasn't|weren't)\b/gi, msg: () => 'Did you mean "there"?', fix: (m) => m[0].replace(/^their/i, 'there'), severity: 'warning' },
  // its/it's before verbs
  { regex: /\bits\s+(a|the|not|been|going|time|own|about|just|like|hard|easy|clear|true|false|important|possible|impossible|obvious)\b/gi, msg: () => 'Did you mean "it\'s" (it is)?', fix: (m) => m[0].replace(/^its/i, "it's"), severity: 'style' },
  // Missing space after punctuation
  { regex: /([,;])([A-Za-z])/g, msg: () => 'Missing space after punctuation', fix: (m) => m[1] + ' ' + m[2], severity: 'warning' },
  // Capitalization after sentence end
  {
    regex: /([.!?])\s+([a-z])/g,
    skip: (m, text, idx) => /\b[A-Za-z]{1,3}\.$/.test(text.slice(Math.max(0, idx - 4), idx + 1)),
    msg: () => 'Capitalize the first word after a sentence',
    fix: (m) => m[1] + ' ' + m[2].toUpperCase(),
    severity: 'warning',
  },
  // a/an before vowels/consonants
  { regex: /\ba\s+([aeiou]\w+)\b/gi, msg: (m) => `Use "an" before "${m[1]}" (starts with a vowel sound)`, fix: (m) => 'an ' + m[1], severity: 'warning', skip: (m) => ['useful', 'user', 'used', 'usual', 'unique', 'unit', 'union', 'united', 'universal', 'university', 'uniform', 'unicorn', 'one', 'once'].some(w => m[1].toLowerCase().startsWith(w)) },
  // Passive voice detection (simple)
  { regex: /\b(was|were|is|are|been|being)\s+(being\s+)?(given|taken|made|done|seen|told|asked|shown|sent|left|found|brought|thought|kept|heard|known|written|called|said|used|put)\b/gi, msg: (m) => `Passive voice: "${m[0]}" — consider active voice for stronger prose`, severity: 'style' },
];

const STYLE_RULES = [
  { regex: /\b(very|really|extremely|totally|completely|absolutely|literally)\s+(good|bad|big|small|nice|great|important|interesting|beautiful|happy|sad|angry|tired|old|young|fast|slow)\b/gi, msg: (m) => `Weak modifier + adjective: "${m[0]}" — try a stronger single word`, severity: 'style' },
  { regex: /\b(in order to)\b/gi, msg: () => '"In order to" → just "to"', fix: () => 'to', severity: 'style' },
  { regex: /\b(at this point in time)\b/gi, msg: () => 'Wordy → "now" or "currently"', fix: () => 'now', severity: 'style' },
  { regex: /\b(due to the fact that)\b/gi, msg: () => 'Wordy → "because"', fix: () => 'because', severity: 'style' },
  { regex: /\b(in the event that)\b/gi, msg: () => 'Wordy → "if"', fix: () => 'if', severity: 'style' },
  { regex: /\b(it is important to note that)\b/gi, msg: () => 'Filler — state the point directly', severity: 'style' },
  { regex: /\b(at the end of the day)\b/gi, msg: () => 'Cliché — try a fresh phrasing', severity: 'style' },
  { regex: /\b(each and every)\b/gi, msg: () => 'Redundant — use "each" or "every"', fix: () => 'every', severity: 'style' },
  { regex: /\b(first and foremost)\b/gi, msg: () => 'Redundant — use "first"', fix: () => 'first', severity: 'style' },
  { regex: /\b(past history)\b/gi, msg: () => 'Redundant — "history" is already past', fix: () => 'history', severity: 'style' },
  { regex: /\b(free gift)\b/gi, msg: () => 'Redundant — gifts are free by definition', fix: () => 'gift', severity: 'style' },
  { regex: /\b(suddenly)\b/gi, msg: () => '"Suddenly" weakens fiction — show the action instead of announcing it', severity: 'style' },
  { regex: /\b(began to|started to)\s+(\w+)/gi, msg: (m) => `"${m[1]} ${m[2]}" — just use "${m[2]}" directly for tighter prose`, severity: 'style' },
];

function localCheck(text) {
  if (!text || text.length < 5) return [];
  const issues = [];

  // Misspellings
  const wordRegex = /\b[a-zA-Z']+\b/g;
  let m;
  while ((m = wordRegex.exec(text)) !== null) {
    const lower = m[0].toLowerCase();
    if (MISSPELLINGS[lower]) {
      issues.push({
        original: m[0],
        corrected: MISSPELLINGS[lower],
        reason: `Misspelling → "${MISSPELLINGS[lower]}"`,
        severity: 'error',
        position: m.index,
        length: m[0].length,
        replacements: [MISSPELLINGS[lower]],
      });
    }
  }

  // Grammar + style rules
  for (const rule of [...GRAMMAR_RULES, ...STYLE_RULES]) {
    const regex = new RegExp(rule.regex.source, rule.regex.flags);
    while ((m = regex.exec(text)) !== null) {
      if (rule.skip && rule.skip(m, text, m.index)) continue;
      const corrected = rule.fix ? (typeof rule.fix === 'function' ? rule.fix(m) : rule.fix) : '';
      issues.push({
        original: m[0],
        corrected: corrected || '',
        reason: typeof rule.msg === 'function' ? rule.msg(m) : rule.msg,
        severity: rule.severity || 'warning',
        position: m.index,
        length: m[0].length,
        replacements: corrected ? [corrected] : [],
      });
    }
  }

  // Unbalanced quotes
  const quoteCount = (text.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    issues.push({
      original: '(unbalanced quotes)',
      corrected: '',
      reason: `${quoteCount} quotation marks found — one may be missing`,
      severity: 'style',
      position: 0,
      length: 0,
      replacements: [],
    });
  }

  // Deduplicate by position
  const seen = new Set();
  return issues.filter(issue => {
    const key = `${issue.position}:${issue.length}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.position - b.position);
}

// ─── Main Entry Point ───────────────────────────────────────────────────────────

/**
 * Check text for spelling, grammar, and style issues.
 * Tries LanguageTool API first; falls back to local engine on any failure.
 * NEVER throws — always returns an array (possibly empty).
 */
export async function checkSpellingAndGrammar(text, language = 'en-US') {
  if (!text || text.length < 5) return [];

  try {
    // Try LanguageTool
    const apiResult = await tryLanguageTool(text, language);
    if (apiResult !== null && apiResult.length >= 0) {
      return apiResult;
    }
  } catch (err) {
    // Swallow any unexpected error
    console.warn('[SpellCheck] Unexpected error in API path:', err);
  }

  // Fallback: local engine
  try {
    return localCheck(text);
  } catch (err) {
    console.error('[SpellCheck] Local check failed:', err);
    return []; // absolute last resort — never crash
  }
}
