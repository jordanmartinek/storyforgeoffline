/**
 * Comprehensive manuscript format analysis engine.
 * Checks consistency, pacing, structure, word-level craft, and dialogue.
 * All local — no API needed.
 */

// ─── Utilities ──────────────────────────────────────────────────────────────────

function splitParagraphs(text) {
  return text.split(/\n\s*\n/).filter(p => p.trim());
}

function splitSentences(text) {
  return text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0).map(s => s.trim());
}

function splitLines(text) {
  return text.split('\n');
}

function wordCount(text) {
  return text.split(/\s+/).filter(Boolean).length;
}

function isDialogue(line) {
  return /[""\u201C\u201D]/.test(line.trim());
}


// ─── CONSISTENCY CHECKS ─────────────────────────────────────────────────────────

/** Detect tense shifts (past vs present) */
function checkTenseConsistency(text) {
  const issues = [];
  const paragraphs = splitParagraphs(text);

  const pastPattern = /\b(was|were|had|went|came|took|said|told|looked|walked|ran|felt|knew|thought|saw|heard|made|found|got|gave|did|could|would)\b/gi;
  const presentPattern = /\b(is|are|has|goes|comes|takes|says|tells|looks|walks|runs|feels|knows|thinks|sees|hears|makes|finds|gets|gives|does|can|will)\b/gi;

  for (const para of paragraphs) {
    const sentences = splitSentences(para);
    if (sentences.length < 3) continue;

    let pastCount = 0;
    let presentCount = 0;
    const pastSentences = [];
    const presentSentences = [];

    sentences.forEach((s, i) => {
      // Skip dialogue lines
      if (isDialogue(s)) return;
      const past = (s.match(pastPattern) || []).length;
      const present = (s.match(presentPattern) || []).length;
      if (past > present && past > 0) { pastCount++; pastSentences.push(i); }
      if (present > past && present > 0) { presentCount++; presentSentences.push(i); }
    });

    if (pastCount > 0 && presentCount > 0 && Math.min(pastCount, presentCount) >= 2) {
      const dominant = pastCount > presentCount ? 'past' : 'present';
      const minority = dominant === 'past' ? 'present' : 'past';
      const minoritySentence = dominant === 'past' ? sentences[presentSentences[0]] : sentences[pastSentences[0]];
      issues.push({
        type: 'tense_shift',
        severity: 'warning',
        message: `Tense inconsistency: mostly ${dominant} tense but shifts to ${minority}. Check for unintentional tense drift.`,
        excerpt: minoritySentence?.slice(0, 70) + '...',
      });
      break; // one per scene is enough
    }
  }
  return issues;
}


/** Detect POV shifts (first person vs third person) */
function checkPOVConsistency(text) {
  const issues = [];
  const sentences = splitSentences(text).filter(s => !isDialogue(s));
  if (sentences.length < 5) return issues;

  let firstPerson = 0;
  let thirdPerson = 0;

  for (const s of sentences) {
    if (/\bI\s+(was|am|have|had|will|would|could|should|went|saw|felt|thought|knew|heard)\b/.test(s)) firstPerson++;
    if (/\b(he|she)\s+(was|is|had|went|saw|felt|thought|knew|heard|looked|turned|said)\b/i.test(s)) thirdPerson++;
  }

  if (firstPerson > 2 && thirdPerson > 2) {
    const dominant = firstPerson > thirdPerson ? 'first' : 'third';
    const minority = dominant === 'first' ? 'third' : 'first';
    issues.push({
      type: 'pov_shift',
      severity: 'warning',
      message: `POV inconsistency: mostly ${dominant} person but ${minority} person also appears outside dialogue. Verify this is intentional.`,
    });
  }
  return issues;
}


/** Detect number format inconsistency (spelled out vs digits) */
function checkNumberConsistency(text) {
  const issues = [];
  const spelledNumbers = text.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand)\b/gi) || [];
  const digitNumbers = text.match(/\b\d{1,3}\b/g) || [];

  // Filter out likely non-narrative digits (years, times)
  const narrativeDigits = digitNumbers.filter(d => !/^(19|20)\d\d$/.test(d) && !/^\d{1,2}$/.test(d) && parseInt(d) < 100);

  if (spelledNumbers.length > 2 && narrativeDigits.length > 2) {
    issues.push({
      type: 'number_format',
      severity: 'info',
      message: `Mixed number formats: some spelled out (${spelledNumbers.slice(0,2).join(', ')}), some as digits. Fiction typically spells out numbers under 100.`,
    });
  }
  return issues;
}

// ─── PACING & RHYTHM ────────────────────────────────────────────────────────────

/** Detect monotonous paragraph lengths */
function checkParagraphVariety(text) {
  const issues = [];
  const paras = splitParagraphs(text);
  if (paras.length < 5) return issues;

  const lengths = paras.map(p => wordCount(p));
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 10 && avg > 30 && paras.length > 5) {
    issues.push({
      type: 'paragraph_monotony',
      severity: 'info',
      message: `Paragraphs are all similar length (~${Math.round(avg)} words each). Mix short punchy paragraphs with longer ones for rhythm.`,
    });
  }

  // Wall of text detection
  const longParas = paras.filter(p => wordCount(p) > 200);
  if (longParas.length > 0) {
    issues.push({
      type: 'wall_of_text',
      severity: 'warning',
      message: `${longParas.length} paragraph${longParas.length > 1 ? 's' : ''} over 200 words. Break these up — readers need visual breathing room.`,
      excerpt: longParas[0].slice(0, 60) + '...',
    });
  }
  return issues;
}


/** Sentence length variation and rhythm */
function checkSentenceRhythm(text) {
  const issues = [];
  const sentences = splitSentences(text).filter(s => !isDialogue(s));
  if (sentences.length < 8) return issues;

  const lengths = sentences.map(s => wordCount(s));
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  if (stdDev < 3) {
    issues.push({
      type: 'sentence_monotony',
      severity: 'info',
      message: `Sentences are very uniform (avg ${Math.round(avg)} words, low variation). Vary length: short punchy lines build tension, longer ones slow the pace.`,
    });
  }

  // Check for consecutive long sentences (5+ in a row over 25 words)
  let longRun = 0;
  let maxRun = 0;
  for (const len of lengths) {
    if (len > 25) { longRun++; maxRun = Math.max(maxRun, longRun); }
    else longRun = 0;
  }
  if (maxRun >= 5) {
    issues.push({
      type: 'long_sentence_run',
      severity: 'info',
      message: `${maxRun} consecutive long sentences. Insert a short sentence to break the rhythm and re-engage the reader.`,
    });
  }

  // Tension arc: do sentences get shorter toward the end?
  if (lengths.length > 10) {
    const firstHalf = lengths.slice(0, Math.floor(lengths.length / 2));
    const secondHalf = lengths.slice(Math.floor(lengths.length / 2));
    const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avgSecond < avgFirst * 0.7 && avgFirst > 15) {
      issues.push({
        type: 'tension_build',
        severity: 'info',
        message: `Sentences shorten toward the end — good tension building! Average drops from ${Math.round(avgFirst)} to ${Math.round(avgSecond)} words.`,
        details: 'This is a positive observation, not a problem.',
      });
    }
  }
  return issues;
}


// ─── WORD-LEVEL CRAFT ───────────────────────────────────────────────────────────

const FILTER_WORDS = ['saw', 'heard', 'felt', 'noticed', 'realized', 'watched', 'observed', 'knew', 'thought', 'wondered', 'decided', 'seemed', 'appeared'];
const WEASEL_WORDS = ['somewhat', 'rather', 'quite', 'slightly', 'a bit', 'a little', 'fairly', 'pretty much', 'sort of', 'kind of', 'almost', 'nearly', 'basically', 'essentially', 'virtually', 'practically'];
const EMPTY_AMPLIFIERS = ['very', 'really', 'extremely', 'totally', 'completely', 'absolutely', 'literally', 'utterly', 'incredibly', 'amazingly', 'terribly'];

const CLICHES = [
  'dark and stormy night', 'heart skipped a beat', 'blood ran cold',
  'butterflies in her stomach', 'butterflies in his stomach',
  'time stood still', 'silence was deafening', 'avoid like the plague',
  'hit the nail on the head', 'at the end of the day', 'in the nick of time',
  'better late than never', 'crystal clear', 'dead of night',
  'easier said than done', 'face the music', 'gut feeling',
  'leave no stone unturned', 'light at the end of the tunnel',
  'once upon a time', 'read between the lines', 'rude awakening',
  'sharp as a tack', 'sigh of relief', 'slippery slope',
  'tip of the iceberg', 'under the weather', 'white as a sheet',
  'writing on the wall', 'calm before the storm', 'cold as ice',
  'crack of dawn', 'fit as a fiddle', 'good as gold',
  'in a nutshell', 'last but not least', 'needle in a haystack',
  'on thin ice', 'playing with fire', 'raining cats and dogs',
  'snake in the grass', 'stood frozen', 'took a deep breath',
  'let out a breath', 'eyes widened', 'jaw dropped',
  'rolled her eyes', 'rolled his eyes', 'clenched his jaw',
  'balled her fists', 'balled his fists', 'knot in her stomach',
  'knot in his stomach', 'pit of her stomach', 'pit of his stomach',
  'tears streaming down', 'heart pounding', 'heart racing',
  'palms sweating', 'blood boiling', 'seeing red',
  'green with envy', 'blind with rage',
];

/** Check for filter words */
function checkFilterWords(text) {
  const issues = [];
  const narrative = splitSentences(text).filter(s => !isDialogue(s)).join(' ');
  const found = [];

  for (const fw of FILTER_WORDS) {
    const regex = new RegExp(`\\b(he|she|I|they)\\s+${fw}\\b`, 'gi');
    const matches = narrative.match(regex) || [];
    if (matches.length > 0) found.push(...matches.slice(0, 2));
  }

  if (found.length > 2) {
    issues.push({
      type: 'filter_words',
      severity: 'info',
      message: `${found.length} filter words detected. These distance the reader — instead of "She saw the bird fly away," try "The bird flew away."`,
      details: found.slice(0, 4).map(f => `"${f}"`).join(', '),
    });
  }
  return issues;
}


/** Check for weasel words */
function checkWeaselWords(text) {
  const issues = [];
  const found = [];

  for (const ww of WEASEL_WORDS) {
    const regex = new RegExp(`\\b${ww}\\b`, 'gi');
    const matches = text.match(regex) || [];
    if (matches.length > 0) found.push({ word: ww, count: matches.length });
  }

  if (found.length > 3) {
    const total = found.reduce((s, f) => s + f.count, 0);
    issues.push({
      type: 'weasel_words',
      severity: 'info',
      message: `${total} weasel/hedge words found. These weaken your prose — commit to what you're saying.`,
      details: found.sort((a,b) => b.count - a.count).slice(0, 5).map(f => `"${f.word}" (${f.count}x)`).join(', '),
    });
  }
  return issues;
}

/** Check for empty amplifiers before weak adjectives */
function checkEmptyAmplifiers(text) {
  const issues = [];
  const found = [];

  for (const amp of EMPTY_AMPLIFIERS) {
    const regex = new RegExp(`\\b${amp}\\s+\\w+`, 'gi');
    const matches = text.match(regex) || [];
    found.push(...matches);
  }

  if (found.length > 3) {
    issues.push({
      type: 'empty_amplifiers',
      severity: 'info',
      message: `${found.length} weak modifier phrases. "Very tired" → "exhausted." Find the precise word instead.`,
      details: found.slice(0, 4).map(f => `"${f}"`).join(', '),
    });
  }
  return issues;
}

/** Check for clichés */
function checkCliches(text) {
  const issues = [];
  const lower = text.toLowerCase();
  const found = [];

  for (const cliche of CLICHES) {
    if (lower.includes(cliche)) {
      found.push(cliche);
    }
  }

  if (found.length > 0) {
    issues.push({
      type: 'cliches',
      severity: 'warning',
      message: `${found.length} cliché${found.length > 1 ? 's' : ''} detected. These are overused — find a fresh way to express the same idea.`,
      details: found.slice(0, 5).map(c => `"${c}"`).join(', '),
    });
  }
  return issues;
}


/** Detect overused words (personal frequency) */
function checkOverusedWords(text) {
  const issues = [];
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
  const stopWords = new Set(['that', 'this', 'with', 'from', 'they', 'been', 'have', 'were', 'said', 'each', 'which', 'their', 'will', 'other', 'about', 'many', 'then', 'them', 'some', 'would', 'make', 'like', 'into', 'could', 'than', 'been', 'your', 'what', 'when', 'there', 'here', 'just', 'back', 'over', 'also', 'after', 'down', 'should', 'because', 'does', 'before', 'through', 'where', 'much', 'still', 'between']);

  const freq = {};
  words.forEach(w => {
    if (!stopWords.has(w)) freq[w] = (freq[w] || 0) + 1;
  });

  const totalWords = words.length;
  const overused = Object.entries(freq)
    .filter(([w, count]) => count >= 4 && count / totalWords > 0.01)
    .sort((a, b) => b[1] - a[1]);

  if (overused.length > 0) {
    issues.push({
      type: 'overused_words',
      severity: 'info',
      message: `Words you use frequently: ${overused.slice(0, 6).map(([w, c]) => `"${w}" (${c}x)`).join(', ')}. Consider varying your vocabulary.`,
    });
  }
  return issues;
}

// ─── DIALOGUE CHECKS ────────────────────────────────────────────────────────────

const EXOTIC_TAGS = ['exclaimed', 'ejaculated', 'pontificated', 'mused', 'opined', 'interjected', 'queried', 'retorted', 'proclaimed', 'declared', 'bellowed', 'shrieked', 'gasped', 'stammered', 'chortled', 'guffawed', 'snorted', 'growled', 'hissed', 'barked', 'snarled', 'crooned', 'purred'];

/** Detect exotic/distracting dialogue tags */
function checkDialogueTags(text) {
  const issues = [];
  const found = [];

  for (const tag of EXOTIC_TAGS) {
    const regex = new RegExp(`[""\u201D]\\s*(he|she|they|I|\\w+)\\s+${tag}`, 'gi');
    const matches = text.match(regex) || [];
    if (matches.length > 0) found.push({ tag, count: matches.length });
  }

  if (found.length > 2) {
    const total = found.reduce((s, f) => s + f.count, 0);
    issues.push({
      type: 'exotic_dialogue_tags',
      severity: 'info',
      message: `${total} exotic dialogue tags. "Said" is invisible to readers — fancy tags draw attention to themselves.`,
      details: found.slice(0, 4).map(f => `"${f.tag}" (${f.count}x)`).join(', '),
    });
  }
  return issues;
}


/** Detect talking heads (long dialogue with no action beats) */
function checkTalkingHeads(text) {
  const issues = [];
  const lines = splitLines(text);
  let consecutiveDialogue = 0;
  let maxRun = 0;
  let runStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    if (isDialogue(line)) {
      if (consecutiveDialogue === 0) runStart = i;
      consecutiveDialogue++;
      maxRun = Math.max(maxRun, consecutiveDialogue);
    } else {
      consecutiveDialogue = 0;
    }
  }

  if (maxRun >= 6) {
    issues.push({
      type: 'talking_heads',
      severity: 'warning',
      message: `${maxRun} consecutive dialogue lines without action or description. Add beats — gestures, movement, interiority — to ground the conversation.`,
    });
  }
  return issues;
}

/** Detect attribution clarity issues */
function checkAttributionClarity(text) {
  const issues = [];
  const lines = splitLines(text).filter(l => l.trim());
  let untaggedDialogue = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (isDialogue(trimmed)) {
      // Check if this line has a tag (he said, she said, Name said)
      const hasTag = /[""\u201D]\s*(he|she|they|I|\w+)\s+(said|asked|replied|whispered|shouted|called|muttered|answered)/i.test(trimmed);
      const hasBeat = /[""\u201D][.,]?\s*\w+\s+(turned|looked|stood|sat|walked|nodded|shook|smiled|frowned|laughed|sighed)/i.test(trimmed);
      if (!hasTag && !hasBeat) untaggedDialogue++;
      else untaggedDialogue = 0;
    } else {
      untaggedDialogue = 0;
    }

    if (untaggedDialogue >= 4) {
      issues.push({
        type: 'attribution_clarity',
        severity: 'info',
        message: `${untaggedDialogue}+ dialogue lines without attribution. After 3 lines, readers may lose track of who's speaking.`,
      });
      break;
    }
  }
  return issues;
}

/** Detect characters using each other's names too often in dialogue */
function checkDialogueNameOveruse(text) {
  const issues = [];
  // Extract dialogue content
  const dialogueContent = [];
  const quoteRegex = /[""\u201C]([^""\u201D]+)[""\u201D]/g;
  let m;
  while ((m = quoteRegex.exec(text)) !== null) {
    dialogueContent.push(m[1]);
  }

  if (dialogueContent.length < 3) return issues;

  // Find names used in dialogue (capitalized words that repeat)
  const nameFreq = {};
  const namePattern = /\b[A-Z][a-z]{2,}\b/g;
  for (const d of dialogueContent) {
    const names = d.match(namePattern) || [];
    names.forEach(n => { nameFreq[n] = (nameFreq[n] || 0) + 1; });
  }

  const overusedNames = Object.entries(nameFreq).filter(([n, c]) => c >= 3);
  if (overusedNames.length > 0) {
    issues.push({
      type: 'dialogue_name_overuse',
      severity: 'info',
      message: `Characters say "${overusedNames[0][0]}" ${overusedNames[0][1]} times in dialogue. People rarely use names this often in conversation.`,
    });
  }
  return issues;
}


// ─── STRUCTURE & OPENING/ENDING ─────────────────────────────────────────────────

/** Check opening strength */
function checkOpening(text) {
  const issues = [];
  const firstPara = splitParagraphs(text)[0];
  if (!firstPara) return issues;
  const lower = firstPara.toLowerCase().trim();

  const weakOpenings = [
    { pattern: /^(it was a |there was a |there were )/, label: 'existential opening' },
    { pattern: /^(the sun |the sky |the wind |the rain |the weather)/, label: 'weather opening' },
    { pattern: /^(he woke|she woke|i woke|.*woke up|.*alarm went off)/, label: 'waking up opening' },
    { pattern: /^(he looked in the mirror|she looked in the mirror|.*stared at .* reflection)/, label: 'mirror opening' },
    { pattern: /^(once upon a time|long ago|in a land far|in the beginning)/, label: 'fairy tale opening' },
    { pattern: /^(my name is|let me tell you|i should probably start)/, label: 'introduction opening' },
  ];

  for (const wo of weakOpenings) {
    if (wo.pattern.test(lower)) {
      issues.push({
        type: 'weak_opening',
        severity: 'info',
        message: `Scene opens with a ${wo.label}. Agents and editors often flag these. Start with action, dialogue, or a striking image instead.`,
        excerpt: firstPara.slice(0, 60) + '...',
      });
      break;
    }
  }
  return issues;
}

/** Check ending strength */
function checkEnding(text) {
  const issues = [];
  const paras = splitParagraphs(text);
  if (paras.length < 3) return issues;
  const lastPara = paras[paras.length - 1].trim().toLowerCase();

  const weakEndings = [
    { pattern: /(went to sleep|fell asleep|closed .* eyes and drifted|everything went black)/, label: 'falling asleep' },
    { pattern: /(and that was that|and so it goes|little did .* know)/, label: 'telling coda' },
    { pattern: /(to be continued|but that.s a story for another|the end)/, label: 'meta ending' },
    { pattern: /(sighed|shrugged|turned and walked away)$/, label: 'trailing off' },
  ];

  for (const we of weakEndings) {
    if (we.pattern.test(lastPara)) {
      issues.push({
        type: 'weak_ending',
        severity: 'info',
        message: `Scene ends with ${we.label}. Strong scenes end on a beat that propels the reader forward — a revelation, decision, or image that lingers.`,
        excerpt: '...' + paras[paras.length - 1].slice(-60),
      });
      break;
    }
  }
  return issues;
}

/** Check for information dumps / exposition blocks */
function checkInfoDumps(text) {
  const issues = [];
  const paras = splitParagraphs(text);

  for (const para of paras) {
    const wc = wordCount(para);
    if (wc < 80) continue;
    // No dialogue, no action verbs — likely exposition
    if (isDialogue(para)) continue;

    const actionVerbs = para.match(/\b(ran|jumped|grabbed|pulled|pushed|threw|caught|hit|kicked|turned|walked|rushed|sprinted|ducked|climbed|fell|dove)\b/gi) || [];
    const sentences = splitSentences(para);
    const verbDensity = actionVerbs.length / sentences.length;

    if (verbDensity < 0.2 && wc > 100) {
      // Check for backstory signals
      const backstorySignals = /\b(had been|used to|years ago|back when|ever since|for as long as|it all started|the history of)\b/i.test(para);
      if (backstorySignals) {
        issues.push({
          type: 'info_dump',
          severity: 'warning',
          message: `Long expository paragraph (${wc} words) with backstory. Weave background info into action and dialogue instead of dumping it.`,
          excerpt: para.slice(0, 60) + '...',
        });
        break; // one is enough
      }
    }
  }
  return issues;
}


// ─── PASSIVE VOICE & ADVERBS ────────────────────────────────────────────────────

/** Detailed passive voice check with examples */
function checkPassiveVoice(text) {
  const issues = [];
  const sentences = splitSentences(text).filter(s => !isDialogue(s));
  if (sentences.length < 5) return issues;

  const passivePattern = /\b(is|are|was|were|been|being|be|get|gets|got)\s+(\w+ed|written|spoken|taken|given|made|done|seen|known|found|told|shown|brought|thought|kept|heard|built|sent|left|held)\b/i;
  const passiveSentences = sentences.filter(s => passivePattern.test(s));
  const ratio = passiveSentences.length / sentences.length;

  if (ratio > 0.2 && passiveSentences.length > 3) {
    issues.push({
      type: 'passive_voice',
      severity: 'warning',
      message: `${Math.round(ratio * 100)}% passive voice (${passiveSentences.length}/${sentences.length} sentences). Active voice is more direct and engaging.`,
      excerpt: passiveSentences[0]?.slice(0, 60) + '...',
      details: passiveSentences.length > 1 ? `Another: "${passiveSentences[1]?.slice(0, 50)}..."` : undefined,
    });
  }
  return issues;
}

/** Adverb density check */
function checkAdverbs(text) {
  const issues = [];
  const exceptions = new Set(['only', 'early', 'daily', 'family', 'holy', 'lily', 'july', 'fly', 'ally', 'apply', 'reply', 'supply', 'rely', 'ugly', 'belly', 'jelly', 'bully', 'holly', 'lonely', 'likely', 'friendly', 'lovely', 'elderly', 'costly', 'really', 'finally', 'usually', 'actually', 'probably', 'especially', 'suddenly', 'certainly', 'definitely', 'obviously', 'immediately', 'absolutely']);

  const words = text.toLowerCase().split(/\s+/);
  const adverbs = words.filter(w => w.endsWith('ly') && w.length > 4 && !exceptions.has(w));
  const unique = [...new Set(adverbs)];
  const density = words.length > 0 ? (adverbs.length / words.length * 100) : 0;

  if (adverbs.length > 5 && density > 1.2) {
    issues.push({
      type: 'adverb_density',
      severity: 'info',
      message: `${adverbs.length} adverbs (${density.toFixed(1)}% density). "Don't tell me the moon is shining; show me the glint of light on broken glass." — Chekhov`,
      details: unique.slice(0, 8).join(', '),
    });
  }
  return issues;
}

/** Repeated words in close proximity */
function checkRepeatedWords(text) {
  const issues = [];
  const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 4);
  const common = new Set(['their', 'there', 'would', 'could', 'should', 'about', 'which', 'other', 'being', 'after', 'before', 'those', 'these', 'where', 'still', 'never', 'every', 'again', 'around', 'through', 'between']);

  const seen = new Map();
  const repeated = [];

  words.forEach((word, i) => {
    if (common.has(word)) return;
    if (seen.has(word) && i - seen.get(word) < 30) {
      repeated.push(word);
    }
    seen.set(word, i);
  });

  const unique = [...new Set(repeated)];
  if (unique.length > 2) {
    issues.push({
      type: 'word_repetition',
      severity: 'info',
      message: `Words repeated within close proximity: ${unique.slice(0, 6).join(', ')}. Vary vocabulary or restructure sentences.`,
    });
  }
  return issues;
}


// ─── SCREENPLAY-SPECIFIC ────────────────────────────────────────────────────────

function analyzeScreenplay(content) {
  const issues = [];
  const text = content;
  const lines = splitLines(text);
  const paras = splitParagraphs(text);

  // Scene heading format
  const headingPattern = /^(INT\.|EXT\.|INT\/EXT\.)/i;
  const potentialHeadings = lines.filter(l => headingPattern.test(l.trim()));
  const nonUpper = potentialHeadings.filter(l => l.trim() !== l.trim().toUpperCase());
  if (nonUpper.length > 0) {
    issues.push({ type: 'scene_heading_caps', severity: 'warning', message: `${nonUpper.length} scene heading(s) not in ALL CAPS.`, excerpt: nonUpper[0]?.trim().slice(0, 40) });
  }

  // Long action blocks
  for (const para of paras) {
    const wc = wordCount(para);
    if (wc > 40 && !isDialogue(para) && !headingPattern.test(para.trim())) {
      issues.push({ type: 'long_action_block', severity: 'warning', message: `Action block is ${wc} words. Keep to 3-4 lines max — be visual and concise.`, excerpt: para.slice(0, 50) + '...' });
      break;
    }
  }

  // Camera directions
  const cameraDirs = text.match(/\b(CLOSE ON|WIDE SHOT|PAN TO|ZOOM IN|ANGLE ON|POV|TRACKING SHOT|CRANE SHOT|DOLLY|SMASH CUT|MATCH CUT)\b/g) || [];
  if (cameraDirs.length > 1) {
    issues.push({ type: 'camera_directions', severity: 'info', message: `${cameraDirs.length} camera directions. Spec scripts avoid directing — describe what we SEE.`, details: [...new Set(cameraDirs)].join(', ') });
  }

  // Unfilmable content
  const unfilmable = text.match(/\b(he thinks|she thinks|he remembers|she remembers|internally|in his mind|in her mind|he feels|she feels)\b/gi) || [];
  if (unfilmable.length > 0) {
    issues.push({ type: 'unfilmable', severity: 'warning', message: `${unfilmable.length} unfilmable phrase(s). Internal thoughts can't be filmed — show it through action or dialogue.`, details: unfilmable.slice(0, 3).join(', ') });
  }

  // Character intro (first appearance should be CAPS)
  const charIntroPattern = /\b([A-Z]{2,})\s*(\(\d+|,\s*\d+)/;
  // Just check if there are any ALL CAPS names that look like character intros
  const capsNames = text.match(/\b[A-Z]{2,}\b/g) || [];
  if (capsNames.length === 0 && paras.length > 3) {
    issues.push({ type: 'character_intro', severity: 'info', message: 'No CHARACTER NAMES in caps found. First appearances should be in ALL CAPS with brief description.' });
  }

  // Parenthetical overuse
  const parens = text.match(/\([^)]{3,}\)/g) || [];
  if (parens.length > 5) {
    issues.push({ type: 'parenthetical_overuse', severity: 'info', message: `${parens.length} parentheticals — use sparingly. Trust actors.` });
  }

  // Page estimate (~56 lines per page, 1 page ≈ 1 minute)
  const pageEstimate = Math.round(lines.length / 56);
  if (pageEstimate > 0) {
    issues.push({ type: 'page_estimate', severity: 'info', message: `Estimated ${pageEstimate} page${pageEstimate > 1 ? 's' : ''} (~${pageEstimate} minute${pageEstimate > 1 ? 's' : ''} of screen time).` });
  }

  return issues;
}


// ─── MAIN ENTRY POINTS ──────────────────────────────────────────────────────────

function analyzeNovel(content) {
  if (!content || content.trim().length < 30) return [];

  const allIssues = [];

  // Run all checks
  allIssues.push(...checkTenseConsistency(content));
  allIssues.push(...checkPOVConsistency(content));
  allIssues.push(...checkNumberConsistency(content));
  allIssues.push(...checkParagraphVariety(content));
  allIssues.push(...checkSentenceRhythm(content));
  allIssues.push(...checkFilterWords(content));
  allIssues.push(...checkWeaselWords(content));
  allIssues.push(...checkEmptyAmplifiers(content));
  allIssues.push(...checkCliches(content));
  allIssues.push(...checkOverusedWords(content));
  allIssues.push(...checkDialogueTags(content));
  allIssues.push(...checkTalkingHeads(content));
  allIssues.push(...checkAttributionClarity(content));
  allIssues.push(...checkDialogueNameOveruse(content));
  allIssues.push(...checkOpening(content));
  allIssues.push(...checkEnding(content));
  allIssues.push(...checkInfoDumps(content));
  allIssues.push(...checkPassiveVoice(content));
  allIssues.push(...checkAdverbs(content));
  allIssues.push(...checkRepeatedWords(content));

  return allIssues;
}

/**
 * Main entry point — route based on writing mode.
 * @param {string} content - Plain text or HTML
 * @param {'novel'|'screenplay'} mode
 * @returns {Array} Issues array
 */
export function analyzeManuscript(content, mode) {
  try {
    if (!content || content.trim().length < 30) return [];
    if (mode === 'screenplay') return analyzeScreenplay(content);
    return analyzeNovel(content);
  } catch (err) {
    console.error('[FormatAssistant] Error:', err);
    return [];
  }
}
