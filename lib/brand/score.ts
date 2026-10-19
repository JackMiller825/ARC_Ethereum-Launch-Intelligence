import { findCollisions } from './collision';
import { ANIMAL_WORDS, COLOR_WORDS, COMMON_WORDS, GENERIC_WORDS, MAJOR_TICKERS, MEME_ROOTS, OFFICIAL_WORDS, PERSON_CUES, SCAM_PHRASES, SCREENED_BRANDS, TICKER_WORDS } from './directory';
import { CATEGORY_META, CRITERIA, criteriaIn, criterionById } from './rubric';
import { normalizeWeights, profileById } from './profiles';
import type { BrandAnalysis, BrandInput, CategoryId, CategoryScore, CollisionFinding, CriterionAssessment, EvidenceClass, ProfileId, Sufficiency } from './types';
import { RUBRIC_VERSION } from './types';
import { clampScore, fold, hasEmoji, initialsOf, mixedScript, normalizeName, normalizeTicker, slug, wordsOf } from './text';

const LIMITATIONS = [
  'Scores are editorial rubric results. They are not a prediction of buyers, price, or market success.',
  'A missing input is insufficient or unknown. It is not stored as zero.',
  'The bundled token list is a short reference, not a global registry.',
  'Trademark flags are a preliminary screen, not a legal determination.',
  'No logo or mascot image is reviewed unless the user only describes one. Description is still not a visual grade.',
  'Trading history is not an input, so later volume cannot raise a name score.',
];

const EMOTION = ['love', 'rage', 'happy', 'sad', 'hope', 'fear', 'gem', 'moon'];
const HUMOR = ['lol', 'kek', 'wtf', 'haha', 'joke', 'silly', 'goofy'];
const HOMOPHONES = ['to', 'too', 'two', 'see', 'sea', 'knight', 'night', 'one', 'won'];

export type BrandFeatures = ReturnType<typeof readFeatures>;

export function readFeatures(input: BrandInput, collisions: CollisionFinding[]) {
  const name = normalizeName(input.name);
  const ticker = normalizeTicker(input.ticker);
  const narrative = (input.narrative || '').trim();
  const meme = (input.memeOrigin || '').trim();
  const mascot = (input.mascot || '').trim();
  const audience = (input.audience || '').trim();
  const eth = (input.ethereumRelevance || '').trim();
  const folded = fold(name);
  const words = wordsOf(name);
  const letters = name.replace(/[^A-Za-z]/g, '');
  const vowels = (letters.match(/[aeiouy]/gi) || []).length;
  const syllables = letters ? Math.max(1, (letters.toLowerCase().match(/[aeiouy]+/g) || []).length) : 0;
  const pronounceable = letters.length > 0 && vowels > 0 && !/[^aeiouy\s\d]{4,}/i.test(name) && !hasEmoji(name) && !mixedScript(name);
  const initials = initialsOf(name);
  const story = narrative.length >= 12 || meme.length >= 8;
  const blob = fold(`${name} ${ticker} ${narrative} ${meme} ${eth}`);
  const memeHit = MEME_ROOTS.some((root) => folded.includes(root) || fold(meme).includes(root) || ticker.toLowerCase() === root);
  const generic = words.some((word) => GENERIC_WORDS.includes(fold(word))) || GENERIC_WORDS.includes(folded);
  const overlap = words.filter((word) => word.length > 2 && narrative.toLowerCase().includes(word.toLowerCase())).length;
  const links = `${input.links?.website || ''} ${input.links?.telegram || ''} ${input.links?.x || ''}`.trim();
  return {
    name, ticker, narrative, meme, mascot, audience, eth, folded, words, letters, vowels, syllables, pronounceable, initials, story, blob, memeHit, generic, overlap, links,
    emoji: hasEmoji(name),
    mixed: mixedScript(name),
    digits: /\d/.test(name),
    tickerIsInitials: Boolean(ticker) && ticker === initials,
    tickerIsPrefix: ticker.length >= 2 && fold(words[0] || '').startsWith(ticker.toLowerCase()),
    tickerInName: Boolean(ticker) && folded.replace(/\s/g, '').includes(ticker.toLowerCase()),
    major: MAJOR_TICKERS.has(ticker),
    confusable: /[0O]/.test(ticker) && /[O0]/.test(ticker) && ticker.includes('0') && ticker.includes('O') || (/[1I]/.test(ticker) && /[Il1]/.test(ticker) && ticker.length > 1 && /[1I]/.test(ticker) && /[I1l]/.test(ticker) && (ticker.includes('1') && /[Il]/.test(ticker))),
    exactTicker: collisions.some((item) => item.matchType === 'exact-ticker'),
    exactName: collisions.some((item) => item.matchType === 'exact-name' || item.matchType === 'normalized'),
    anyCollision: collisions.length > 0,
    fuzzy: collisions.some((item) => item.matchType === 'spelling' || item.matchType === 'phonetic' || item.matchType === 'word-order' || item.matchType === 'abbreviation'),
    brandHit: SCREENED_BRANDS.some((brand) => folded.includes(brand)),
    official: OFFICIAL_WORDS.some((word) => blob.includes(word)),
    scam: SCAM_PHRASES.some((phrase) => blob.includes(phrase)),
    person: PERSON_CUES.some((word) => blob.includes(word)),
    animal: ANIMAL_WORDS.some((word) => folded.includes(word) || fold(mascot).includes(word)),
    color: COLOR_WORDS.some((word) => blob.includes(word)),
    common: COMMON_WORDS.includes(folded) || words.some((word) => COMMON_WORDS.includes(fold(word)) && words.length === 1),
    tickerWord: TICKER_WORDS.includes(ticker.toLowerCase()),
    homophone: words.some((word) => HOMOPHONES.includes(fold(word))),
    emotion: EMOTION.some((word) => blob.includes(word)),
    humor: HUMOR.some((word) => blob.includes(word)),
    alliteration: words.length >= 2 && words.every((word) => fold(word)[0] === fold(words[0])[0]),
    jargon: /\b(erc-?20|liquidity|uniswap|airdrop|whitelist)\b/i.test(`${narrative} ${eth}`),
    trend: /\b(today|tonight|this week|breaking)\b/i.test(narrative),
    dated: /\d{4}-\d{2}-\d{2}/.test(input.contextNote || ''),
    imagery: Boolean(input.imageryDescribed),
    collisions,
  };
}

function scored(id: string, score: number, rationale: string, advice: string, sufficiency: Sufficiency = 'high', evidence: EvidenceClass = 'deterministic', source: string | null = null): CriterionAssessment {
  const def = criterionById(id);
  return { id, score: clampScore(score), status: 'scored', weight: def.weight, evidence, sufficiency, rationale, advice, riskSeverity: null, source };
}

function gap(id: string, status: 'insufficient' | 'unknown', rationale: string): CriterionAssessment {
  const def = criterionById(id);
  return { id, score: null, status, weight: def.weight, evidence: def.method === 'deterministic' ? 'deterministic' : 'editorial-rubric', sufficiency: 'none', rationale, advice: 'Add the missing context and run the rubric again. This item was not given a zero.', riskSeverity: null, source: null };
}

function risk(id: string, severity: number, rationale: string, advice: string, sufficiency: Sufficiency = 'medium', evidence: EvidenceClass = 'editorial-rubric', source: string | null = null): CriterionAssessment {
  const def = criterionById(id);
  const sev = clampScore(severity);
  return { id, score: clampScore(10 - sev), status: 'scored', weight: def.weight, evidence, sufficiency, rationale, advice, riskSeverity: sev, source };
}

function related(features: BrandFeatures) {
  return features.tickerIsInitials || features.tickerIsPrefix || features.tickerInName;
}

export function assessCriteria(features: BrandFeatures): CriterionAssessment[] {
  const name = Boolean(features.name);
  const ticker = Boolean(features.ticker);
  const story = features.story;
  const f = features;
  const list: CriterionAssessment[] = [
    !name ? gap('fi-01', 'insufficient', 'No name was supplied.') : scored('fi-01', f.emoji || f.name.length > 22 ? 3 : f.memeHit || (f.words.length <= 2 && f.pronounceable && f.name.length <= 12) ? 8 : 5, 'Judged from length, pronunciation, and whether the name hits the meme reference list.', 'Shorten the name or make the main word speakable.', 'medium', 'editorial-rubric'),
    !name ? gap('fi-02', 'insufficient', 'No name was supplied.') : scored('fi-02', f.words.length <= 3 && f.name.length <= 18 && !f.emoji ? 8 : f.words.length <= 6 ? 5 : 3, `${f.words.length} word(s), ${f.name.length} characters.`, 'Keep the public name to a few words.', 'high'),
    !name ? gap('fi-03', 'insufficient', 'No name was supplied.') : scored('fi-03', f.emotion || f.memeHit ? 7 : 5, 'A feeling-word or meme-list hit is a cue only. It is not a measured emotional response.', 'Add a concrete image word if the name feels flat.', 'low', 'editorial-rubric'),
    !name ? gap('fi-04', 'insufficient', 'No name was supplied.') : scored('fi-04', f.words.length === 2 && f.words.every((word) => word.length <= 10) || /[!?]/.test(f.name) ? 7 : 5, 'Two short words create a small contrast. A single plain label does not.', 'Pair two specific words instead of one generic label.', 'medium', 'editorial-rubric'),
    !name ? gap('fi-05', 'insufficient', 'No name was supplied.') : story && f.overlap > 0 ? scored('fi-05', 8, 'The supplied story repeats a name word.', 'Keep that word visible in the first sentence.', 'medium', 'editorial-rubric') : story ? scored('fi-05', 4, 'A story was supplied, but it does not reuse the name.', 'Use the name inside the story.', 'medium', 'editorial-rubric') : scored('fi-05', f.pronounceable ? 5 : 3, 'No narrative was supplied, so the concept is only the words themselves.', 'Add a one-sentence story if the concept matters.', 'low', 'editorial-rubric'),
    !name ? gap('fi-06', 'insufficient', 'No name was supplied.') : scored('fi-06', f.name.length >= 4 && f.name.length <= 12 && f.words.length <= 2 && !f.emoji ? 8 : 4, 'Memorability here is the shape: length and word count.', 'Aim for one or two short words.'),
    !name ? gap('fi-07', 'insufficient', 'No name was supplied.') : scored('fi-07', f.generic ? 3 : 7, f.generic ? 'The name depends on a generic crypto word.' : 'The name is not on the generic-word list. The cap is 7 because this is not a uniqueness clearance.', 'Replace coin, token, moon, or inu with a specific word.', 'medium', 'editorial-rubric'),
    !name ? gap('fi-08', 'insufficient', 'No name was supplied.') : scored('fi-08', f.syllables > 0 && f.syllables <= 3 && !f.emoji && f.words.length <= 2 ? 8 : f.syllables <= 5 ? 6 : 3, `${f.syllables || 0} vowel groups were counted as a rhythm proxy.`, 'Cut syllables before adding adjectives.'),
    !name ? gap('fi-09', 'insufficient', 'No name was supplied.') : scored('fi-09', f.pronounceable && f.letters.length > 0 && f.vowels / f.letters.length >= 0.2 && f.vowels / f.letters.length <= 0.7 ? 8 : 3, 'Speakable words have a vowel and no long consonant block.', 'Add a vowel or split the consonant cluster.'),
    !name || !ticker ? gap('fi-10', 'insufficient', 'Both a name and a ticker are required.') : scored('fi-10', related(f) ? 9 : 3, related(f) ? 'The ticker is the initials, a prefix, or contained in the name.' : 'The ticker does not visibly come from the name.', 'Use initials or the first letters of the name.'),
    !name ? gap('nq-01', 'insufficient', 'No name was supplied.') : scored('nq-01', f.pronounceable && !f.digits ? 9 : /[^aeiouy\s\d]{4,}/i.test(f.name) ? 4 : 2, 'Pronunciation uses vowels, digits, emoji, and consonant clusters.', 'Spell it the way it is said.'),
    !name ? gap('nq-02', 'insufficient', 'No name was supplied.') : scored('nq-02', f.mixed ? 2 : f.emoji ? 3 : /^[\p{L}\s'-]+$/u.test(f.name) ? 9 : 5, f.mixed ? 'Latin and Cyrillic letters are mixed, which is easy to misread.' : 'Spelling uses the character classes in the name.', 'Stay in one script and avoid emoji in the canonical name.'),
    !name ? gap('nq-03', 'insufficient', 'No name was supplied.') : scored('nq-03', f.name.length >= 4 && f.name.length <= 16 ? 9 : f.name.length < 4 || f.name.length <= 24 ? 5 : 2, `The name is ${f.name.length} characters.`, 'Keep the public name inside roughly 4–16 characters.'),
    !f.letters ? gap('nq-04', 'insufficient', 'There are no letters to measure rhythm.') : scored('nq-04', f.syllables >= 2 && f.syllables <= 4 ? 8 : f.syllables === 1 ? 6 : 4, `${f.syllables} vowel groups.`, 'Two to four syllables is the rubric’s comfortable band.'),
    !name ? gap('nq-05', 'insufficient', 'No name was supplied.') : scored('nq-05', /(.)\1/i.test(f.letters) || f.pronounceable ? (/(.)\1/i.test(f.letters) ? 7 : 6) : 3, 'A repeated letter is treated as a memory hook. This is not a listening test.', 'Repeat a sound or keep a clean ending.', 'medium', 'editorial-rubric'),
    !name ? gap('nq-06', 'insufficient', 'No name was supplied.') : scored('nq-06', f.words.length <= 3 && f.pronounceable ? 8 : 4, 'Repeatability is word count plus pronunciation.', 'Drop extra adjectives.', 'medium', 'editorial-rubric'),
    !name ? gap('nq-07', 'insufficient', 'No name was supplied.') : scored('nq-07', f.name.length <= 12 && !f.emoji && !f.mixed ? 8 : f.name.length <= 20 ? 5 : 3, 'Typing convenience is length and character class.', 'Remove emoji and extra words.'),
    !name ? gap('nq-08', 'insufficient', 'No name was supplied.') : scored('nq-08', f.emoji || f.digits || f.mixed ? 2 : f.homophone ? 5 : 8, f.homophone ? 'A listed homophone can be dictated as a different word.' : 'No listed homophone, emoji, or digit was found.', 'Avoid words that share a sound with a different spelling.', 'medium', 'editorial-rubric'),
    !name ? gap('nq-09', 'insufficient', 'No name was supplied.') : scored('nq-09', f.words.length >= 2 && f.words[0].length <= 10 ? 8 : f.words.length === 1 && f.name.length <= 10 ? 7 : 4, 'A nickname is the first word, or the name itself when it is already short.', 'Lead with the word people will actually say.', 'medium', 'editorial-rubric'),
    !name ? gap('nq-10', 'insufficient', 'No name was supplied.') : scored('nq-10', clampScore(8 - (/\bth/i.test(f.folded) ? 2 : 0) - (/gh/i.test(f.letters) ? 2 : 0) - (/q(?!u)/i.test(f.letters) ? 2 : 0) - (/[^aeiouy]r[^aeiouy]/i.test(f.letters) ? 1 : 0)), 'th, gh, q without u, and a consonant around r lower the score.', 'Prefer sounds that stay stable across languages.', 'medium', 'editorial-rubric'),
    !ticker ? gap('tq-01', 'insufficient', 'No ticker was supplied.') : scored('tq-01', f.ticker.length >= 3 && f.ticker.length <= 5 ? 8 : f.ticker.length === 2 ? 6 : f.ticker.length === 1 ? 4 : f.ticker.length <= 8 ? 5 : 3, `${f.ticker.length} characters. The shortest ticker is not automatically the best.`, 'Prefer 3–5 characters unless a longer symbol is much clearer.'),
    !ticker ? gap('tq-02', 'insufficient', 'No ticker was supplied.') : scored('tq-02', /[AEIOUY]/.test(f.ticker) || f.tickerIsInitials ? 8 : 4, /[AEIOUY]/.test(f.ticker) ? 'The ticker contains a vowel.' : 'The ticker is a consonant block and is not the name initials.', 'Add a vowel or use initials.'),
    !ticker ? gap('tq-03', 'insufficient', 'No ticker was supplied.') : scored('tq-03', (f.ticker.includes('0') && f.ticker.includes('O')) || (f.ticker.includes('1') && /[Il]/.test(f.ticker)) ? 3 : 9, '0/O and 1/I/l are the confusable pairs this check knows.', 'Spell the ticker with letters that do not share a glyph.'),
    !ticker ? gap('tq-04', 'insufficient', 'No ticker was supplied.') : scored('tq-04', f.ticker.length >= 3 && f.ticker.length <= 5 && !/^(.)\1+$/.test(f.ticker) ? 8 : 4, 'Varied 3–5 character symbols score higher.', 'Avoid a repeated single character.'),
    !name || !ticker ? gap('tq-05', 'insufficient', 'Both a name and a ticker are required.') : scored('tq-05', related(f) ? 9 : 3, related(f) ? 'The ticker points back at the name.' : 'The ticker does not point back at the name.', 'Derive the ticker from the name.'),
    !ticker ? gap('tq-06', 'insufficient', 'No ticker was supplied.') : scored('tq-06', f.tickerWord || f.tickerIsInitials ? 7 : 4, f.tickerWord ? 'The ticker is on the small symbolic-word list.' : 'The ticker is not a listed word or the name initials.', 'Use initials or a word people already know.', 'medium', 'editorial-rubric'),
    !name || !ticker ? gap('tq-07', 'insufficient', 'Both a name and a ticker are required.') : scored('tq-07', f.tickerIsInitials ? 9 : f.tickerIsPrefix ? 7 : 4, f.tickerIsInitials ? 'The ticker matches the initials.' : f.tickerIsPrefix ? 'The ticker is a prefix of the first word.' : 'The ticker is not an obvious abbreviation.', 'Use the initials.'),
    !ticker ? gap('tq-08', 'insufficient', 'No ticker was supplied.') : scored('tq-08', f.major ? 2 : 8, f.major ? `${f.ticker} is on the fixed list of widely used symbols.` : 'The ticker is not on the fixed major-symbol list. That list is not every exchange.', 'Do not reuse ETH, BTC, PEPE, or the other listed majors.'),
    !ticker ? gap('tq-09', 'insufficient', 'No ticker was supplied.') : scored('tq-09', f.ticker.length <= 5 && /^[A-Z0-9]+$/.test(f.ticker) ? 8 : 4, 'Copy convenience is length and the absence of punctuation. Punctuation is already stripped before scoring.', 'Keep the symbol alphanumeric and short.'),
    !ticker ? gap('tq-10', 'insufficient', 'No ticker was supplied.') : f.exactTicker ? scored('tq-10', 3, 'The bundled reference list already contains this ticker. That is a collision, not a fraud finding.', 'Pick a ticker that is not already on the reference list, then still run a wider search.', 'medium', 'directory', 'bundled-reference') : scored('tq-10', f.major ? 3 : 7, 'No bundled ticker hit. The score is capped at 7 because this is not a clearance.', 'Treat 7 as “not on the short list,” not as “available.”', 'low', 'editorial-rubric'),
    !name && !f.meme ? gap('mp-01', 'insufficient', 'No name or meme origin was supplied.') : scored('mp-01', f.memeHit ? 8 : 3, f.memeHit ? 'The text hits the reference meme list.' : 'The text is not on the reference meme list.', 'Use a specific joke instead of assuming recognition.', 'medium', 'editorial-rubric'),
    !name ? gap('mp-02', 'insufficient', 'No name was supplied.') : scored('mp-02', f.humor || f.memeHit ? 7 : 4, 'Humor is a word-list cue, not an audience test.', 'Add one obvious joke word if humor is the point.', 'low', 'editorial-rubric'),
    !story ? gap('mp-03', 'insufficient', 'No narrative or meme origin, so punchline clarity is not scored.') : scored('mp-03', f.humor || f.memeHit || f.name.length <= 12 ? 6 : 4, 'The supplied story or meme note is the only punchline evidence.', 'State the joke in one sentence.', 'low', 'editorial-rubric'),
    f.alliteration || (f.ticker && f.tickerInName && f.words.length >= 2) ? scored('mp-04', 7, 'Alliteration or an embedded ticker is the detected device.', 'Keep the device obvious.', 'medium', 'editorial-rubric') : !story ? gap('mp-04', 'insufficient', 'No wordplay device and no story, so wordplay is not scored.') : scored('mp-04', 4, 'A story was supplied without a detectable pun or alliteration.', 'Build one repeatable sound into the name.', 'low', 'editorial-rubric'),
    f.memeHit || story ? scored('mp-05', f.memeHit ? 7 : 5, 'Remix room comes from a meme root or a supplied story.', 'Leave one word people can swap.', 'low', 'editorial-rubric') : gap('mp-05', 'insufficient', 'No meme root or story, so remix potential is not scored.'),
    f.memeHit ? scored('mp-06', 7, 'A reference meme root can sit on an existing reaction format.', 'Do not assume the format is unused.', 'low', 'editorial-rubric') : gap('mp-06', 'insufficient', 'No meme root, so reaction-image fit is not scored.'),
    !name ? gap('mp-07', 'insufficient', 'No name was supplied.') : scored('mp-07', f.emotion ? 7 : f.memeHit ? 6 : 4, 'Expressiveness uses the feeling list and the meme list.', 'Name the feeling if the caption needs one.', 'low', 'editorial-rubric'),
    f.mascot ? scored('mp-08', 8, 'A mascot concept was written. No image was reviewed.', 'Draw it later. This score will not become a visual grade by itself.', 'medium', 'user-supplied') : f.animal ? scored('mp-08', 7, 'An animal or character word is in the name. That is concept only.', 'Describe the character before treating it as a mascot.', 'low', 'editorial-rubric') : gap('mp-08', 'insufficient', 'No mascot concept and no character word.'),
    !name ? gap('mp-09', 'insufficient', 'No name was supplied.') : scored('mp-09', ticker && f.name.length <= 16 && f.ticker.length <= 5 ? 8 : 5, 'Shareability is the length of the pair.', 'Keep both parts short enough for a post.'),
    !story ? gap('mp-10', 'insufficient', 'No story, so a recurring joke is not scored.') : scored('mp-10', f.memeHit ? 7 : 5, 'A meme root plus a story can be repeated. A story alone is weaker.', 'Write the joke so it still works next month.', 'low', 'editorial-rubric'),
    !story ? gap('ns-01', 'insufficient', 'No narrative was supplied.') : scored('ns-01', f.narrative.length >= 40 && f.narrative.length <= 400 ? 8 : 5, 'Clarity is the length of the user-supplied story. No event was added.', 'Write two or three concrete sentences.', 'medium', 'editorial-rubric', 'user-narrative'),
    !story || !name ? gap('ns-02', 'insufficient', 'A name and a story are both required.') : scored('ns-02', f.overlap > 0 ? 8 : 3, f.overlap > 0 ? 'At least one name word appears in the story.' : 'The story does not use the name.', 'Repeat the name in the story.', 'high', 'editorial-rubric'),
    !story || !ticker ? gap('ns-03', 'insufficient', 'A ticker and a story are both required.') : scored('ns-03', f.narrative.toUpperCase().includes(f.ticker) || f.narrative.toUpperCase().includes(f.initials) ? 7 : 4, 'The story is checked for the ticker or the initials.', 'Mention the ticker once.', 'medium', 'editorial-rubric'),
    !story && !f.memeHit ? gap('ns-04', 'insufficient', 'No story or culture cue was supplied.') : scored('ns-04', f.memeHit ? 7 : 5, 'Culture relevance uses the meme list inside the user text. No current event was fetched.', 'Name the reference instead of implying one.', 'low', 'editorial-rubric'),
    f.dated ? scored('ns-05', 6, 'A date was present in the user note. ARC did not verify that an event happened.', 'Keep the date with a source URL if you cite news.', 'low', 'user-supplied', 'user-note') : gap('ns-05', 'unknown', 'No dated source was supplied. ARC does not invent a current catalyst.'),
    !story ? gap('ns-06', 'insufficient', 'No story was supplied.') : scored('ns-06', f.narrative.length > 80 && !f.generic ? 7 : 4, 'A longer story that avoids the generic-word list scores higher.', 'Add a detail that is not just “a coin.”', 'low', 'editorial-rubric'),
    !story ? gap('ns-07', 'insufficient', 'No story was supplied.') : scored('ns-07', f.narrative.length > 60 ? 6 : 4, 'Expansion room is inferred from how much story text exists.', 'Add a second beat to the story.', 'low', 'editorial-rubric'),
    !story ? gap('ns-08', 'insufficient', 'No story was supplied.') : scored('ns-08', f.trend ? 3 : 6, f.trend ? 'The story uses a short-lived time word such as today or breaking.' : 'No short-lived time word was found. This is not a longevity forecast.', 'Remove “today” if the brand should outlast the week.', 'low', 'editorial-rubric'),
    !story ? gap('ns-09', 'insufficient', 'No story was supplied.') : scored('ns-09', 6, 'A supplied story can be restated. Flexibility is not extra credit for length.', 'Keep one idea that still makes sense if the joke changes.', 'low', 'editorial-rubric'),
    !story ? gap('ns-10', 'insufficient', 'No story was supplied.') : scored('ns-10', f.overlap > 0 && (related(f) || !ticker) ? 8 : 4, 'Consistency requires the story to use the name and the ticker to fit the name.', 'Align the three before publishing.', 'medium', 'editorial-rubric'),
    f.exactName ? scored('or-01', 2, 'The bundled list already has this name.', 'Change the name, then search beyond this list.', 'medium', 'directory', 'bundled-reference') : gap('or-01', 'unknown', 'No name match in the bundled reference list. Live directories were not confirmed, so uniqueness is not scored.'),
    f.exactTicker ? scored('or-02', 3, 'The bundled list already has this ticker. A duplicate ticker is common and is not a fraud finding.', 'Choose a different ticker if you need less confusion, and still search further.', 'medium', 'directory', 'bundled-reference') : gap('or-02', 'unknown', 'No ticker match in the bundled reference list. Uniqueness is not scored.'),
    f.anyCollision ? scored('or-03', f.exactName || f.exactTicker ? 2 : 4, 'A bundled-list collision is present. See the collision records for the match type.', 'Read the match type before treating it as a copy.', 'medium', 'directory', 'bundled-reference') : gap('or-03', 'unknown', 'No bundled-list collision. Similarity beyond that list is unknown.'),
    f.brandHit ? scored('or-04', 2, 'The name contains a screened company word. This is not a trademark opinion.', 'Remove the company name.', 'medium', 'editorial-rubric', 'screened-brand-list') : gap('or-04', 'unknown', 'No screened company name. This is not a trademark clearance.'),
    !name ? gap('or-05', 'insufficient', 'No name was supplied.') : scored('or-05', f.generic ? 3 : 8, f.generic ? 'The name uses a generic crypto word.' : 'The name is not on the generic-word list.', 'Replace the generic word.', 'high', 'editorial-rubric'),
    !name ? gap('or-06', 'insufficient', 'No name was supplied.') : scored('or-06', f.words.length === 2 && !f.generic ? 7 : f.generic ? 4 : 5, 'Phrasing looks at word count and the generic list.', 'Use two specific words.', 'medium', 'editorial-rubric'),
    f.alliteration || (ticker && f.tickerInName && f.words.length >= 2) ? scored('or-07', 7, 'The same device used for wordplay strength.', 'Make sure the device is still clear after you shorten the name.', 'medium', 'editorial-rubric') : gap('or-07', 'insufficient', 'No detectable wordplay, so originality of wordplay is not scored.'),
    !name ? gap('or-08', 'insufficient', 'No name was supplied.') : scored('or-08', ['pepe', 'doge', 'shib', 'inu'].some((root) => f.folded.includes(root) || f.ticker.toLowerCase() === root) ? 3 : 7, 'Popular meme roots score lower. The 7 cap is not a market survey.', 'Avoid leaning on pepe, doge, shib, or inu if distinctiveness matters.', 'medium', 'editorial-rubric'),
    f.anyCollision ? scored('or-09', 3, 'A collision or theme overlap is on the record.', 'Change the overlapping word if the theme is crowded.', 'low', 'directory', 'bundled-reference') : !story ? gap('or-09', 'unknown', 'No collision and no story, so concept overlap is not scored.') : scored('or-09', 6, 'A story was supplied and the bundled list did not collide. The score is capped.', 'Still search live directories before calling the concept open.', 'low', 'editorial-rubric'),
    !name ? gap('or-10', 'insufficient', 'No name was supplied.') : scored('or-10', f.words.length <= 3 && !f.generic && f.name.length >= 4 ? 7 : 4, 'Conversation distinctiveness is specificity plus length.', 'Drop generic words.', 'medium', 'editorial-rubric'),
    f.mascot ? scored('bi-01', 8, 'Mascot text was supplied. No drawing was reviewed.', 'Commission the picture separately.', 'medium', 'user-supplied') : f.animal ? scored('bi-01', 6, 'A character word is present. Conceptual only.', 'Describe the character.', 'low', 'editorial-rubric') : gap('bi-01', 'insufficient', 'No mascot concept to assess.'),
    !name ? gap('bi-02', 'insufficient', 'No name was supplied.') : scored('bi-02', f.words.length <= 2 && f.pronounceable ? 6 : 4, 'Logo potential is conceptual. No logo was reviewed.', 'Do not read this as a design grade.', 'low', 'editorial-rubric'),
    !name ? gap('bi-03', 'insufficient', 'No name was supplied.') : scored('bi-03', f.name.length <= 16 ? 6 : 4, 'Banner potential is whether the words fit a line. No banner was reviewed.', 'Keep the name to one line.', 'low', 'editorial-rubric'),
    !name ? gap('bi-04', 'insufficient', 'No name was supplied.') : scored('bi-04', f.emoji || f.mixed ? 3 : 6, 'Typography looks at letters only. No typeface was reviewed.', 'Use plain letters.', 'low', 'editorial-rubric'),
    !name && !f.mascot ? gap('bi-05', 'insufficient', 'No name or mascot note.') : scored('bi-05', f.color ? 7 : 5, f.color ? 'A color word was written. No palette file was reviewed.' : 'No color was named. The score stays conceptual.', 'Name a color only if you mean it.', 'low', 'editorial-rubric'),
    !ticker ? gap('bi-06', 'insufficient', 'No ticker was supplied.') : scored('bi-06', f.ticker.length >= 3 && f.ticker.length <= 5 ? 6 : 4, 'Icon potential is ticker length. No icon was reviewed.', 'Keep the symbol short enough for a square.', 'low', 'editorial-rubric'),
    story || f.mascot ? scored('bi-07', 6, 'A story or mascot note gives a scene to draw. No image was reviewed.', 'Put the scene in one sentence.', 'low', 'editorial-rubric') : gap('bi-07', 'insufficient', 'No story or mascot, so visual storytelling is not scored.'),
    f.memeHit || f.mascot ? scored('bi-08', 7, 'A meme root or mascot note can become a sticker. No sticker was reviewed.', 'Test one drawing before relying on this.', 'low', 'editorial-rubric') : gap('bi-08', 'insufficient', 'No meme root or mascot, so sticker fit is not scored.'),
    !f.links ? gap('bi-09', 'insufficient', 'No website, Telegram, or X link was supplied.') : scored('bi-09', fold(f.links).includes(f.folded.replace(/\s/g, '')) || (ticker && f.links.toUpperCase().includes(f.ticker)) ? 8 : 4, 'The link text was checked for the name or ticker. The pages were not fetched.', 'Use the name in the URL slug.', 'medium', 'user-supplied'),
    !name || !ticker ? gap('bi-10', 'insufficient', 'A name and ticker are required.') : scored('bi-10', 6, 'The same words can be reused across captions. Profiles were not checked.', 'Keep one spelling everywhere.', 'low', 'editorial-rubric'),
    !name ? gap('sd-01', 'insufficient', 'No name was supplied.') : scored('sd-01', f.generic || f.major || f.name.length < 4 ? 3 : 7, 'Distinguishability uses the generic list and length. No search engine was queried. The score is capped at 7.', 'Avoid a one-word generic name.', 'low', 'editorial-rubric'),
    gap('sd-02', 'unknown', 'Live search results were not queried, so result ambiguity is unknown.'),
    !name && !ticker ? gap('sd-03', 'insufficient', 'A name or ticker is required.') : scored('sd-03', /^[A-Z0-9]{2,8}$/.test(f.ticker) ? 8 : 4, 'Hashtag usability is a character rule. The tag was not checked on a network.', 'Use 2–8 letters or digits.'),
    !ticker ? gap('sd-04', 'insufficient', 'No ticker was supplied.') : scored('sd-04', f.ticker.length >= 2 && f.ticker.length <= 15 ? 7 : 3, 'Handle length only. The account was not checked.', 'Stay inside a typical 15-character handle.'),
    !name ? gap('sd-05', 'insufficient', 'No name was supplied.') : scored('sd-05', /^[a-z0-9-]{3,24}$/.test(slug(f.name)) && slug(f.name).length >= 3 ? 7 : 4, 'URL readability is the slug shape. Domain registration was not checked.', 'Keep the slug short and alphanumeric.'),
    !name ? gap('sd-06', 'insufficient', 'No name was supplied.') : scored('sd-06', ticker && f.pronounceable ? 7 : 4, 'Conversation potential is whether the pair can be spoken.', 'Make the name pronounceable.', 'medium', 'editorial-rubric'),
    !name ? gap('sd-07', 'insufficient', 'No name was supplied.') : scored('sd-07', f.name.length >= 4 && f.name.length <= 14 ? 8 : 4, 'Recall in a post is approximated by length.', 'Stay near 4–14 characters.'),
    !ticker ? gap('sd-08', 'insufficient', 'No ticker was supplied.') : scored('sd-08', f.ticker.length >= 3 && f.ticker.length <= 5 ? 8 : 4, 'Ticker recall uses the 3–5 character band.', 'Prefer that band.'),
    !name ? gap('sd-09', 'insufficient', 'No name was supplied.') : scored('sd-09', f.common ? 3 : 7, f.common ? 'The name is on a small common-word list, so unrelated topics can share it.' : 'The name is not on that short common-word list. The list is not a search index.', 'Add a second word if the first is ordinary.', 'low', 'editorial-rubric'),
    !f.links ? gap('sd-10', 'insufficient', 'No links were supplied, so cross-platform consistency is not scored.') : scored('sd-10', fold(f.links).includes(f.folded.replace(/\s/g, '')) || (ticker && f.links.toUpperCase().includes(f.ticker)) ? 8 : 4, 'Only the link strings were compared. Pages were not opened.', 'Repeat the ticker in each handle you control.', 'medium', 'user-supplied'),
    scored('ta-01', /\beth(ereum)?\b/i.test(`${f.name} ${f.narrative} ${f.eth}`) ? 8 : 4, f.eth ? 'The user wrote an Ethereum note. This is not holder or volume data.' : 'No Ethereum tie was stated.', 'Say Ethereum only if the token is actually planned there.', 'low', 'editorial-rubric'),
    !name ? gap('ta-02', 'insufficient', 'No name was supplied.') : scored('ta-02', f.memeHit || f.generic ? 7 : f.pronounceable ? 6 : 4, 'Trader comprehension is whether the shape looks like other memecoins. It is not a survey.', 'Do not read a high score as demand.', 'low', 'editorial-rubric'),
    scored('ta-03', f.jargon ? 4 : 6, f.jargon ? 'The user text includes heavy venue or process jargon.' : 'No heavy jargon list hit. This does not measure what traders know.', 'Put jargon in a footnote, not the name.', 'low', 'editorial-rubric'),
    !name ? gap('ta-04', 'insufficient', 'No name was supplied.') : scored('ta-04', f.pronounceable && !f.memeHit && f.words.length <= 3 ? 7 : f.memeHit ? 5 : 4, 'Broader readability prefers plain speech over an in-joke root.', 'Keep one plain word if outsiders matter.', 'low', 'editorial-rubric'),
    !name ? gap('ta-05', 'insufficient', 'No name was supplied.') : scored('ta-05', clampScore(8 - (/\bth/i.test(f.folded) ? 2 : 0) - (/gh/i.test(f.letters) ? 2 : 0)), 'The same letter patterns as cross-language pronunciation. Not a translation.', 'Avoid th and gh if many languages matter.', 'low', 'editorial-rubric'),
    !name ? gap('ta-06', 'insufficient', 'No name was supplied.') : scored('ta-06', f.memeHit || story ? 6 : 4, 'Identity potential is an editorial guess from a meme root or a story. It is not community size.', 'Do not treat this as membership.', 'low', 'editorial-rubric'),
    !f.audience ? gap('ta-07', 'insufficient', 'No target audience was named.') : scored('ta-07', f.audience.split(/\s+/).some((word) => word.length > 3 && `${f.narrative} ${f.name}`.toLowerCase().includes(word.toLowerCase())) ? 7 : 4, 'The audience words were compared with the name and story. Engagement was not measured.', 'Use the audience’s own words in the story.', 'medium', 'user-supplied'),
    !name ? gap('ta-08', 'insufficient', 'No name was supplied.') : scored('ta-08', f.pronounceable && f.words.length <= 3 && !f.jargon ? 8 : 4, 'Beginner access is short plain speech.', 'Remove jargon from the name.', 'medium', 'editorial-rubric'),
    !name ? gap('ta-09', 'insufficient', 'No name was supplied.') : scored('ta-09', f.jargon && f.memeHit ? 5 : f.pronounceable && !f.memeHit ? 7 : 5, 'Mainstream versus specialist is inferred from jargon and meme roots. It is not reach.', 'Pick one audience and write for it.', 'low', 'editorial-rubric'),
    !name ? gap('ta-10', 'insufficient', 'No name was supplied.') : scored('ta-10', f.pronounceable && !f.memeHit && !f.generic ? 7 : 4, 'Outside-crypto clarity prefers plain words that are not meme roots.', 'Read the name to someone who does not trade.', 'low', 'editorial-rubric'),
    f.official ? risk('rt-01', 9, 'A screened affiliation word is present. This is not a finding that anyone is impersonating a project.', 'Remove official, exchange, and foundation wording unless you are that entity.', 'medium', 'editorial-rubric', 'screened-affiliation-list') : risk('rt-01', 1, 'No screened affiliation word. The list is short, so absence is not proof.', 'Keep claims specific.', 'low'),
    f.brandHit ? risk('rt-02', 8, 'A screened company name appears. This is a preliminary flag, not legal advice and not a filing search.', 'Remove the company name and ask a lawyer if the overlap matters.', 'medium', 'editorial-rubric', 'screened-brand-list') : gap('rt-02', 'unknown', 'No screened company name. Trademark status is unknown.'),
    f.exactName || f.exactTicker ? risk('rt-03', 8, 'The bundled list contains this name or ticker.', 'Do not describe the name as unused.', 'medium', 'directory', 'bundled-reference') : f.fuzzy ? risk('rt-03', 5, 'A near match is on the bundled list.', 'Read the collision row before ignoring it.', 'medium', 'directory', 'bundled-reference') : gap('rt-03', 'unknown', 'No bundled-list match. This is not an all-clear for every chain.'),
    f.official ? risk('rt-04', 9, 'The wording can be read as an official affiliation.', 'Say who you are in plain words.', 'medium', 'editorial-rubric') : risk('rt-04', 2, 'No screened affiliation word. Absence on a short list is weak evidence.', 'Avoid “official” unless it is true.', 'low'),
    f.scam ? risk('rt-05', 10, 'A screened scam phrase is present. The list is small and is not a full safety review.', 'Delete profit promises and giveaway language.', 'high', 'editorial-rubric', 'scam-phrase-list') : risk('rt-05', 1, 'No screened scam phrase. Offensive language outside that list is not graded here.', 'Do not add a profit promise.', 'low'),
    risk('rt-06', f.homophone || f.mixed || (f.ticker.includes('0') && f.ticker.includes('O')) ? 7 : 2, 'Homophones, mixed scripts, and 0/O collisions raise severity.', 'Change the confusable spelling.', 'medium'),
    f.exactTicker || f.major ? risk('rt-07', f.exactTicker ? 8 : 7, f.exactTicker ? 'The ticker collides with the bundled list. That is confusion risk, not a fraud label.' : 'The ticker is on the major-symbol list.', 'Pick a ticker people will not mix up with a major asset.', 'medium', 'directory', 'bundled-reference') : gap('rt-07', 'unknown', 'No bundled or major ticker collision. Wider exchange lists were not searched.'),
    f.person || f.trend ? risk('rt-08', f.person ? 7 : 5, f.person ? 'The text uses a screened person-name cue.' : 'The story uses a short-lived time word.', 'Avoid building the name on a person or on the word today.', 'medium', 'editorial-rubric') : risk('rt-08', 3, 'No screened person cue or breaking-news word.', 'This is not a reputation investigation.', 'low'),
    !story ? gap('rt-09', 'insufficient', 'No story, so name/story inconsistency is not scored.') : risk('rt-09', f.overlap > 0 ? 2 : 7, f.overlap > 0 ? 'The story uses the name.' : 'The story never uses the name.', 'Put the name in the story.', 'medium', 'editorial-rubric'),
    !ticker ? gap('rt-10', 'insufficient', 'No ticker was supplied.') : risk('rt-10', f.ticker.length <= 2 || f.major || f.exactTicker ? 8 : 3, 'Very short tickers and major symbols are easier to confuse in a list.', 'Use 3–5 characters that are not a major symbol.', 'medium'),
  ];
  return list;
}

export function qualityLabel(score: number | null, coverage: number) {
  if (score === null || coverage < 40) return 'Insufficient information';
  if (score >= 9) return 'Exceptional editorial quality';
  if (score >= 8) return 'Strong';
  if (score >= 7) return 'Promising';
  if (score >= 6) return 'Moderate';
  if (score >= 5) return 'Mixed';
  return 'Needs improvement';
}

export function shortLabel(score: number | null) {
  if (score === null) return 'Insufficient';
  if (score >= 8) return 'Strong';
  if (score >= 6) return 'Moderate';
  if (score >= 5) return 'Mixed';
  return 'Thin';
}

function aggregate(criteria: CriterionAssessment[], weights: BrandAnalysis['weights']): { categories: CategoryScore[]; overall: number | null; coverage: number; label: string } {
  let numerator = 0;
  let scoredWeight = 0;
  let totalWeight = 0;
  const categories: CategoryScore[] = CATEGORY_META.map((meta) => {
    const items = criteria.filter((item) => criterionById(item.id).categoryId === meta.id);
    const inner = items.reduce((sum, item) => sum + item.weight, 0) || 1;
    let catNum = 0;
    let catDen = 0;
    let catAll = 0;
    for (const item of items) {
      const share = weights[meta.id] * (item.weight / inner);
      totalWeight += share;
      catAll += share;
      if (item.status === 'scored' && item.score !== null) {
        numerator += item.score * share;
        scoredWeight += share;
        catNum += item.score * share;
        catDen += share;
      }
    }
    const coverage = catAll === 0 ? 0 : Math.round((catDen / catAll) * 1000) / 10;
    const score = catDen === 0 ? null : Math.round((catNum / catDen) * 10) / 10;
    return { id: meta.id, title: meta.title, weight: weights[meta.id], score, coverage, label: shortLabel(score) };
  });
  const coverage = totalWeight === 0 ? 0 : Math.round((scoredWeight / totalWeight) * 1000) / 10;
  const overall = coverage >= 40 && scoredWeight > 0 ? Math.round((numerator / scoredWeight) * 10) / 10 : null;
  return { categories, overall, coverage, label: qualityLabel(overall, coverage) };
}

export function candidateKey(input: BrandInput) {
  const address = (input.address || '').toLowerCase();
  if (input.mode === 'historical') return `hist:${address}:${fold(input.name)}:${normalizeTicker(input.ticker)}`;
  if (input.mode === 'existing' && address) return `ca:${address}`;
  return `idea:${fold(input.name)}:${normalizeTicker(input.ticker)}`;
}

export function analyzeBrand(input: BrandInput, options?: { collisions?: CollisionFinding[]; profileId?: ProfileId; weights?: Partial<BrandAnalysis['weights']>; now?: number; researchSources?: BrandAnalysis['research']['sources'] }): BrandAnalysis {
  const now = options?.now ?? input.analyzedAt ?? 0;
  const profileId = options?.profileId || 'balanced';
  const weights = options?.weights ? normalizeWeights(options.weights) : profileById(profileId).weights;
  const collisions = options?.collisions || findCollisions(input.name, input.ticker, undefined, now);
  const criteria = assessCriteria(readFeatures({ ...input, name: normalizeName(input.name), ticker: normalizeTicker(input.ticker) }, collisions));
  if (criteria.length !== CRITERIA.length) throw new Error(`Expected ${CRITERIA.length} criteria, scored ${criteria.length}`);
  const summary = aggregate(criteria, weights);
  const id = `analysis:${candidateKey(input)}:${now}`;
  return {
    id,
    candidateId: candidateKey(input),
    rubricVersion: RUBRIC_VERSION,
    input: { ...input, name: normalizeName(input.name), ticker: normalizeTicker(input.ticker), analyzedAt: now },
    profileId,
    weights,
    criteria,
    categories: summary.categories,
    overall: summary.overall,
    label: summary.label,
    coverage: summary.coverage,
    collisions,
    research: {
      scope: 'Bundled reference list plus any live sources that returned. Not a global availability search.',
      sources: options?.researchSources || [
        { id: 'bundled-reference', status: 'ok', note: 'Short public list shipped with ARC.', checkedAt: now },
        { id: 'dexscreener', status: 'not-run', note: 'Not queried yet.', checkedAt: null },
        { id: 'coingecko', status: 'not-run', note: 'Not queried yet.', checkedAt: null },
        { id: 'domain', status: 'not-run', note: 'No domain API is configured.', checkedAt: null },
        { id: 'trademark', status: 'not-run', note: 'No trademark API is configured. Screened names are not a legal search.', checkedAt: null },
        { id: 'web-search', status: 'not-run', note: 'No web-search API is configured.', checkedAt: null },
      ],
    },
    limitations: LIMITATIONS,
    analyzedAt: now,
  };
}

export function applyModelNotes(analysis: BrandAnalysis, notes: { id: string; score?: number; rationale?: string }[], modelVersion: string): BrandAnalysis {
  const criteria = analysis.criteria.map((item) => {
    const note = notes.find((entry) => entry.id === item.id);
    if (!note) return item;
    const definition = criterionById(item.id);
    if (definition.method === 'deterministic') return item;
    if (item.evidence === 'directory' || item.evidence === 'live-source') return { ...item, rationale: note.rationale ? `${item.rationale} Model note (${modelVersion}) was not allowed to replace sourced evidence.` : item.rationale };
    if (typeof note.score === 'number' && note.score >= 0 && note.score <= 10 && item.status === 'scored') {
      const score = clampScore(note.score);
      return { ...item, score, riskSeverity: item.riskSeverity === null ? null : clampScore(10 - score), rationale: `${note.rationale || item.rationale} [${modelVersion}]` };
    }
    return note.rationale ? { ...item, rationale: `${item.rationale} [${modelVersion}] ${note.rationale}` } : item;
  });
  const summary = aggregate(criteria, analysis.weights);
  return { ...analysis, criteria, ...summary };
}

export function linkCandidateToAddress(analysis: BrandAnalysis, address: string, now = analysis.analyzedAt): BrandAnalysis {
  return {
    ...analysis,
    id: `${analysis.id}:linked:${now}`,
    input: { ...analysis.input, linkedAddress: address, contextNote: `${analysis.input.contextNote || ''} Linked to ${address} after the earlier editorial record. Trading results were not used to change scores.`.trim() },
  };
}

export function categoryItems(analysis: BrandAnalysis, id: CategoryId) {
  const ids = new Set(criteriaIn(id).map((item) => item.id));
  return analysis.criteria.filter((item) => ids.has(item.id));
}
