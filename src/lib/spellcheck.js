/**
 * Local spelling and grammar checker.
 * No external API required — runs entirely in the browser.
 */

const MISSPELLINGS = {
  'accomodate': 'accommodate', 'acheive': 'achieve', 'accross': 'across',
  'agressive': 'aggressive', 'apparantly': 'apparently', 'arguement': 'argument',
  'assasination': 'assassination', 'basicly': 'basically', 'begining': 'beginning',
  'beleive': 'believe', 'buisness': 'business', 'calender': 'calendar',
  'camoflage': 'camouflage', 'cemetary': 'cemetery', 'collegue': 'colleague',
  'comming': 'coming', 'commitee': 'committee', 'completly': 'completely',
  'concious': 'conscious', 'curiousity': 'curiosity', 'definitly': 'definitely',
  'dilemna': 'dilemma', 'dissapear': 'disappear', 'dissapoint': 'disappoint',
  'ecstacy': 'ecstasy', 'embarass': 'embarrass', 'enviroment': 'environment',
  'exagerate': 'exaggerate', 'excercise': 'exercise', 'existance': 'existence',
  'familar': 'familiar', 'finaly': 'finally', 'foriegn': 'foreign',
  'freind': 'friend', 'goverment': 'government', 'gaurd': 'guard',
  'happend': 'happened', 'harrass': 'harass', 'heirarchy': 'hierarchy',
  'humourous': 'humorous', 'ignorence': 'ignorance', 'immediatly': 'immediately',
  'independant': 'independent', 'intellegence': 'intelligence', 'jewlery': 'jewelry',
  'knowlege': 'knowledge', 'liason': 'liaison', 'libary': 'library',
  'liesure': 'leisure', 'maintainance': 'maintenance', 'millenium': 'millennium',
  'mischievious': 'mischievous', 'neccessary': 'necessary', 'necessery': 'necessary',
  'nieghbor': 'neighbor', 'noticable': 'noticeable', 'occassion': 'occasion',
  'occured': 'occurred', 'occurence': 'occurrence', 'oportunity': 'opportunity',
  'paralel': 'parallel', 'percieve': 'perceive', 'perseverence': 'perseverance',
  'posession': 'possession', 'prefered': 'preferred', 'privelege': 'privilege',
  'professer': 'professor', 'pronounciation': 'pronunciation', 'publically': 'publicly',
  'realy': 'really', 'recieve': 'receive', 'recomend': 'recommend',
  'refered': 'referred', 'relevent': 'relevant', 'religous': 'religious',
  'remeber': 'remember', 'repitition': 'repetition', 'resistence': 'resistance',
  'resturant': 'restaurant', 'rythm': 'rhythm', 'sentance': 'sentence',
  'seperate': 'separate', 'similer': 'similar', 'sinceerly': 'sincerely',
  'speach': 'speech', 'strenght': 'strength', 'succesful': 'successful',
  'supercede': 'supersede', 'surprize': 'surprise', 'temperture': 'temperature',
  'tendancy': 'tendency', 'therefor': 'therefore', 'tommorow': 'tomorrow',
  'tounge': 'tongue', 'truely': 'truly', 'tyrany': 'tyranny',
  'untill': 'until', 'unuseual': 'unusual', 'usefull': 'useful',
  'vaccuum': 'vacuum', 'vehical': 'vehicle', 'visious': 'vicious',
  'wether': 'whether', 'wierd': 'weird', 'writting': 'writing', 'yeild': 'yield',
  'teh': 'the', 'adn': 'and', 'taht': 'that', 'ahve': 'have',
  'dont': "don't", 'doesnt': "doesn't", 'didnt': "didn't", 'wasnt': "wasn't",
  'werent': "weren't", 'isnt': "isn't", 'arent': "aren't", 'cant': "can't",
  'wont': "won't", 'wouldnt': "wouldn't", 'couldnt': "couldn't",
  'youre': "you're", 'youve': "you've", 'theyre': "they're", 'theyve': "they've",
  'alot': 'a lot', 'noone': 'no one', 'eachother': 'each other',
  'infact': 'in fact', 'inspite': 'in spite',
};

const CONFUSED_PATTERNS = [
  { pattern: /\btheir\s+(is|are|was|were|has|have|will|would|could|should)\b/gi, message: 'Did you mean "there" instead of "their"?', fix: (m) => m.replace(/^their/i, 'there') },
  { pattern: /\byour\s+(going|coming|doing|being|running|walking|leaving|making|saying|telling|welcome)\b/gi, message: 'Did you mean "you\'re" (you are) instead of "your"?', fix: (m) => m.replace(/^your/i, "you're") },
  { pattern: /\bcould\s+of\b/gi, message: '"Could of" should be "could have".', fix: () => 'could have' },
  { pattern: /\bwould\s+of\b/gi, message: '"Would of" should be "would have".', fix: () => 'would have' },
  { pattern: /\bshould\s+of\b/gi, message: '"Should of" should be "should have".', fix: () => 'should have' },
  { pattern: /\bmight\s+of\b/gi, message: '"Might of" should be "might have".', fix: () => 'might have' },
  { pattern: /\bmust\s+of\b/gi, message: '"Must of" should be "must have".', fix: () => 'must have' },
];

export function checkSpellingAndGrammar(text) {
  if (!text || text.length < 5) return [];
  const issues = [];

  // 1. Misspellings
  const wordPattern = /\b[a-zA-Z']+\b/g;
  let match;
  while ((match = wordPattern.exec(text)) !== null) {
    const word = match[0];
    const lower = word.toLowerCase();
    if (MISSPELLINGS[lower]) {
      issues.push({
        original: word,
        corrected: MISSPELLINGS[lower],
        reason: 'Likely misspelling of "' + MISSPELLINGS[lower] + '"',
        severity: 'error',
        position: match.index,
      });
    }
  }

  // 2. Doubled words
  const doubledPattern = /\b(\w+)\s+\1\b/gi;
  while ((match = doubledPattern.exec(text)) !== null) {
    const doubled = match[1].toLowerCase();
    if (!['had', 'that', 'very', 'so', 'no'].includes(doubled)) {
      issues.push({
        original: match[0],
        corrected: match[1],
        reason: 'Doubled word "' + match[1] + '"',
        severity: 'error',
        position: match.index,
      });
    }
  }

  // 3. Missing capitalization after sentence end
  const capPattern = /([.!?])\s+([a-z])/g;
  while ((match = capPattern.exec(text)) !== null) {
    const before = text.slice(Math.max(0, match.index - 3), match.index + 1);
    if (!/\b[A-Za-z]{1,3}\.$/.test(before)) {
      issues.push({
        original: match[0],
        corrected: match[1] + ' ' + match[2].toUpperCase(),
        reason: 'Sentence should start with a capital letter',
        severity: 'warning',
        position: match.index,
      });
    }
  }

  // 4. Confused words
  for (const rule of CONFUSED_PATTERNS) {
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    while ((match = regex.exec(text)) !== null) {
      issues.push({
        original: match[0],
        corrected: rule.fix(match[0]),
        reason: rule.message,
        severity: 'warning',
        position: match.index,
      });
    }
  }

  // 5. Missing space after comma/semicolon
  const puncPattern = /([,;])([A-Za-z])/g;
  while ((match = puncPattern.exec(text)) !== null) {
    issues.push({
      original: match[0],
      corrected: match[1] + ' ' + match[2],
      reason: 'Missing space after punctuation',
      severity: 'warning',
      position: match.index,
    });
  }

  // 6. Unbalanced quotes
  const quoteCount = (text.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    issues.push({
      original: '(unbalanced quotes)',
      corrected: '(add missing quote)',
      reason: 'Found ' + quoteCount + ' quotation marks — one may be missing.',
      severity: 'info',
      position: 0,
    });
  }

  // Deduplicate
  const seen = new Set();
  return issues.filter(issue => {
    const key = issue.position + '-' + issue.original;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).sort((a, b) => a.position - b.position);
}
