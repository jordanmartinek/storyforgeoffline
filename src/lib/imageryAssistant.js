/**
 * Local imagery suggestion engine.
 * Analyzes prose and provides suggestions for stronger imagery,
 * metaphors, sensory language, and "show don't tell" rewrites.
 * 
 * No API required — works entirely in the browser.
 */

// ─── Weak verbs that could be strengthened ──────────────────────────────────────
const WEAK_VERBS = {
  'walked': ['strode', 'ambled', 'shuffled', 'trudged', 'sauntered', 'marched', 'crept'],
  'ran': ['sprinted', 'bolted', 'dashed', 'scrambled', 'tore', 'flew', 'charged'],
  'said': ['whispered', 'murmured', 'declared', 'snapped', 'breathed', 'urged', 'pleaded'],
  'looked': ['gazed', 'glanced', 'peered', 'stared', 'squinted', 'surveyed', 'studied'],
  'went': ['hurried', 'crept', 'wandered', 'rushed', 'drifted', 'charged', 'slipped'],
  'got': ['seized', 'snatched', 'earned', 'claimed', 'acquired', 'received', 'gained'],
  'saw': ['glimpsed', 'spotted', 'witnessed', 'observed', 'noticed', 'discovered', 'caught sight of'],
  'came': ['arrived', 'emerged', 'appeared', 'materialized', 'swept in', 'burst in', 'crept in'],
  'made': ['crafted', 'forged', 'fashioned', 'constructed', 'produced', 'created', 'built'],
  'put': ['placed', 'set', 'slid', 'tucked', 'pressed', 'planted', 'dropped'],
  'took': ['grabbed', 'seized', 'snatched', 'claimed', 'lifted', 'plucked', 'extracted'],
  'moved': ['shifted', 'slid', 'drifted', 'surged', 'crept', 'lunged', 'eased'],
  'felt': ['sensed', 'experienced', 'registered', 'detected', 'recognized'],
  'seemed': ['appeared', 'struck me as', 'gave the impression of', 'had the air of'],
};

// ─── Abstract nouns that could be made concrete ─────────────────────────────────
const ABSTRACT_NOUNS = new Set([
  'love', 'hate', 'fear', 'anger', 'sadness', 'happiness', 'joy', 'sorrow',
  'beauty', 'evil', 'truth', 'freedom', 'justice', 'power', 'hope', 'despair',
  'courage', 'loneliness', 'silence', 'darkness', 'time', 'death', 'life',
]);

// ─── Sensory detail prompts ─────────────────────────────────────────────────────
const SENSORY_PROMPTS = {
  visual: [
    'What colors dominate this scene?',
    'What is the quality of light (harsh, dim, flickering, golden)?',
    'What shapes or textures catch the eye?',
    'What small visual detail could ground the reader?',
  ],
  auditory: [
    'What sounds fill this space (or what silence)?',
    'Is there a rhythm to the sounds — steady, staccato, building?',
    'What distant sounds contrast with close ones?',
  ],
  tactile: [
    'What would the character feel on their skin — temperature, texture, wind?',
    'Is anything pressing, rubbing, or wrapping around them?',
    'What does the ground feel like underfoot?',
  ],
  olfactory: [
    'What does this place smell like?',
    'Is there a smell memory the character would connect to?',
    'What lingers in the air — smoke, perfume, decay, rain?',
  ],
  gustatory: [
    'Can the character taste anything — blood, salt, fear, sweetness?',
    'What taste lingers from a recent meal or drink?',
  ],
};

// ─── Metaphor templates for common emotions/states ──────────────────────────────
const METAPHOR_BANK = {
  anger: [
    'Anger as heat: "molten," "boiling beneath the surface," "white-hot"',
    'Anger as an animal: "snarling inside," "clawing at his composure," "prowling behind her eyes"',
    'Anger as a storm: "thundering silence," "lightning behind her words," "the pressure drop before the break"',
  ],
  fear: [
    'Fear as cold: "ice in her veins," "frozen lungs," "frost creeping up his spine"',
    'Fear as a creature: "something with teeth crouching in his chest," "it coiled around her ribs"',
    'Fear as water: "drowning in the silence," "panic rising like a tide," "pulled under by the weight of it"',
  ],
  sadness: [
    'Sadness as weight: "heavy as wet cloth," "gravity doubled," "dragging stone limbs"',
    'Sadness as absence: "a hollow where his voice used to be," "the shape of her missing"',
    'Sadness as weather: "grey pressing in," "a mist that wouldn\'t burn off," "rain with no thunder"',
  ],
  love: [
    'Love as light: "sun through a crack in the wall," "warm as morning," "the glow of a held secret"',
    'Love as hunger: "starving for the sound of her name," "a craving no meal could satisfy"',
    'Love as magnetism: "pulled as if by gravity," "drawn by invisible thread," "orbiting each other"',
  ],
  tension: [
    'Tension as a taut wire: "one more word and it would snap," "the silence twanged"',
    'Tension as a held breath: "the room forgot to breathe," "air thick as glass"',
    'Tension as pressure: "the walls leaned in," "something pressing behind the silence," "seconds stacking like bricks"',
  ],
  power: [
    'Power as a force of nature: "a wave that didn\'t ask permission," "gravity pulling others into his orbit"',
    'Power as a blade: "she carved the room into halves with one look"',
    'Power as silence: "the loudest person was the one who hadn\'t spoken yet"',
  ],
};

// ─── Analysis Functions ─────────────────────────────────────────────────────────

function findWeakVerbs(text) {
  const results = [];
  for (const [weak, alternatives] of Object.entries(WEAK_VERBS)) {
    const regex = new RegExp(`\\b${weak}\\b`, 'gi');
    let m;
    while ((m = regex.exec(text)) !== null) {
      results.push({
        type: 'weak_verb',
        original: m[0],
        position: m.index,
        suggestion: `"${weak}" → consider: ${alternatives.slice(0, 4).join(', ')}`,
        alternatives,
      });
    }
  }
  return results;
}

function findAbstractLanguage(text) {
  const results = [];
  const wordRegex = /\b\w+\b/g;
  let m;
  while ((m = wordRegex.exec(text)) !== null) {
    if (ABSTRACT_NOUNS.has(m[0].toLowerCase())) {
      results.push({
        type: 'abstract_noun',
        original: m[0],
        position: m.index,
        suggestion: `"${m[0]}" is abstract — make it concrete. What does ${m[0]} look/feel/sound like in this moment?`,
      });
    }
  }
  return results;
}

function detectMissingSenses(text) {
  const results = [];
  const hasVisual = /\b(see|saw|look|bright|dark|color|light|shadow|gleam|glow|red|blue|green|gold|silver|pale|flush)\b/i.test(text);
  const hasAuditory = /\b(hear|heard|sound|silence|quiet|loud|whisper|roar|hum|buzz|crack|thud|ring|echo)\b/i.test(text);
  const hasTactile = /\b(touch|feel|felt|cold|warm|hot|rough|smooth|soft|hard|wet|dry|sharp|heavy|light|press|grip)\b/i.test(text);
  const hasOlfactory = /\b(smell|scent|odor|stink|fragrance|aroma|whiff|reek|fresh|musty|perfume|smoke)\b/i.test(text);

  const missing = [];
  if (!hasVisual) missing.push('visual');
  if (!hasAuditory) missing.push('auditory');
  if (!hasTactile) missing.push('tactile');
  if (!hasOlfactory) missing.push('olfactory');

  if (missing.length > 0 && text.split(/\s+/).length > 50) {
    const sense = missing[Math.floor(Math.random() * missing.length)];
    const prompts = SENSORY_PROMPTS[sense] || SENSORY_PROMPTS.visual;
    results.push({
      type: 'missing_sense',
      sense,
      suggestion: `This passage lacks ${missing.join(' & ')} details. Try: ${prompts[Math.floor(Math.random() * prompts.length)]}`,
    });
  }

  return results;
}

function suggestMetaphors(text) {
  const results = [];

  // Detect emotional content and suggest metaphors
  for (const [emotion, metaphors] of Object.entries(METAPHOR_BANK)) {
    const regex = new RegExp(`\\b(${emotion}|${emotion}s|${emotion}ed|${emotion}ing|${emotion === 'anger' ? 'angry|furious|rage' : ''}${emotion === 'fear' ? 'afraid|terrified|scared' : ''}${emotion === 'sadness' ? 'sad|grief|grieving|mourning' : ''}${emotion === 'love' ? 'loved|loving' : ''}${emotion === 'tension' ? 'tense|nervous|anxious' : ''})\\b`, 'i');

    if (regex.test(text)) {
      const randomMetaphor = metaphors[Math.floor(Math.random() * metaphors.length)];
      results.push({
        type: 'metaphor',
        emotion,
        suggestion: randomMetaphor,
        effect: `Imagery alternatives for expressing "${emotion}"`,
      });
    }
  }

  return results;
}

function findShowDontTell(text) {
  const results = [];
  const patterns = [
    { regex: /\b(he|she|they|I)\s+(was|were)\s+(angry|sad|happy|scared|nervous|excited|tired|bored|confused)\b/gi, emotion: (m) => m[3] },
    { regex: /\b(he|she|they|I)\s+felt\s+(angry|sad|happy|scared|nervous|excited|tired|bored|confused|cold|hot|sick|dizzy|numb)\b/gi, emotion: (m) => m[2] },
  ];

  const rewrites = {
    angry: 'Show it: clenched fists, jaw tight, speaking through teeth, slamming things, pacing',
    sad: 'Show it: heavy limbs, staring at nothing, forgetting mid-sentence, hollow voice',
    happy: 'Show it: lightness in step, catching themselves smiling, warmth spreading, laughter',
    scared: 'Show it: quickened breath, checking over shoulder, sweaty palms, stomach dropping',
    nervous: 'Show it: fidgeting, dry mouth, rehearsing words silently, pulse visible in throat',
    excited: 'Show it: leaning forward, speaking faster, restless energy, can\'t sit still',
    tired: 'Show it: blinking slowly, thoughts trailing off, weight of eyelids, mechanical movements',
    confused: 'Show it: squinting, re-reading, mouth opening then closing, repeating the last word',
    cold: 'Show it: hunched shoulders, hands tucked in, breath visible, skin pale and tight',
    hot: 'Show it: flushed skin, pulling at collar, sweat at temples, seeking shade',
  };

  for (const p of patterns) {
    const regex = new RegExp(p.regex.source, p.regex.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      const emo = p.emotion(m).toLowerCase();
      results.push({
        type: 'show_dont_tell',
        original: m[0],
        position: m.index,
        suggestion: rewrites[emo] || `Instead of stating "${emo}", show it through action, body language, or sensory detail.`,
        effect: `Replace telling ("${m[0]}") with showing`,
      });
    }
  }

  return results;
}

// ─── Main Entry Point ───────────────────────────────────────────────────────────

/**
 * Analyze text and return imagery/style suggestions.
 * @param {string} text - Plain text to analyze
 * @returns {Array<{type, suggestion, effect?, original?, alternatives?}>}
 */
export function generateImagerySuggestions(text) {
  if (!text || text.length < 30) return [];

  try {
    const suggestions = [];

    // 1. Weak verbs (limit to top 5)
    const weakVerbs = findWeakVerbs(text);
    weakVerbs.slice(0, 5).forEach(v => {
      suggestions.push({
        type: 'stronger verb',
        suggestion: v.suggestion,
        effect: `Replace generic verb with something more vivid`,
      });
    });

    // 2. Show don't tell
    const showDontTell = findShowDontTell(text);
    showDontTell.slice(0, 3).forEach(s => {
      suggestions.push({
        type: 'show don\'t tell',
        suggestion: s.suggestion,
        effect: s.effect,
      });
    });

    // 3. Metaphor suggestions
    const metaphors = suggestMetaphors(text);
    metaphors.slice(0, 3).forEach(m => {
      suggestions.push({
        type: 'metaphor',
        suggestion: m.suggestion,
        effect: m.effect,
      });
    });

    // 4. Missing senses
    const missingSenses = detectMissingSenses(text);
    missingSenses.forEach(s => {
      suggestions.push({
        type: 'sensory detail',
        suggestion: s.suggestion,
        effect: `Add ${s.sense} detail to immerse the reader`,
      });
    });

    // 5. Abstract language (limit to top 3)
    const abstracts = findAbstractLanguage(text);
    abstracts.slice(0, 3).forEach(a => {
      suggestions.push({
        type: 'concrete imagery',
        suggestion: a.suggestion,
        effect: 'Abstract → concrete: what can the reader picture?',
      });
    });

    return suggestions;
  } catch (err) {
    console.error('[ImageryAssistant] Error:', err);
    return [];
  }
}
