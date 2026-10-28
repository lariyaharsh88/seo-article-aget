/** Plain-text statistics shared by the word counter and readability checker (runs in the browser). */

export function stripHtml(input: string): string {
  return input.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ");
}

/** Letters/digits: Latin (incl. accents) and Devanagari. Avoids the regex `u` flag (TS target is ES5). */
const WORD = "A-Za-z0-9\\u00C0-\\u024F\\u0900-\\u097F";
const WORD_RE = new RegExp(`[${WORD}][${WORD}'’-]*`, "g");
const HAS_WORD_RE = new RegExp(`[${WORD}]`);

export function words(text: string): string[] {
  return text.toLowerCase().match(WORD_RE) ?? [];
}

export function sentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?।])\s+(?=[A-Z0-9"“(\u0900-\u097F])/)
    .map((s) => s.trim())
    .filter((s) => HAS_WORD_RE.test(s));
}

export function paragraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim()).length;
}

/** Rough English syllable count (good enough for Flesch scores). */
export function syllables(word: string): number {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const groups = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "").match(/[aeiouy]{1,2}/g);
  return Math.max(1, groups?.length ?? 1);
}

export type TextStats = {
  words: number;
  characters: number;
  charactersNoSpaces: number;
  sentences: number;
  paragraphs: number;
  readingMinutes: number;
  speakingMinutes: number;
  avgWordsPerSentence: number;
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  longSentences: number;
};

export function textStats(raw: string): TextStats {
  const text = stripHtml(raw);
  const w = words(text);
  const s = sentences(text);
  const syl = w.reduce((n, x) => n + syllables(x), 0);
  const wc = w.length;
  const sc = Math.max(1, s.length);
  const wps = wc / sc;
  const spw = wc ? syl / wc : 0;
  return {
    words: wc,
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, "").length,
    sentences: wc ? s.length : 0,
    paragraphs: paragraphs(text),
    readingMinutes: wc / 238,
    speakingMinutes: wc / 140,
    avgWordsPerSentence: wc ? wps : 0,
    fleschReadingEase: wc ? Math.max(0, Math.min(100, 206.835 - 1.015 * wps - 84.6 * spw)) : 0,
    fleschKincaidGrade: wc ? Math.max(0, 0.39 * wps + 11.8 * spw - 15.59) : 0,
    longSentences: s.filter((x) => words(x).length > 25).length,
  };
}

export function formatMinutes(min: number): string {
  if (min < 1) return `${Math.max(1, Math.round(min * 60))} sec`;
  return `${Math.round(min)} min`;
}

export function readingLabel(score: number): string {
  if (score >= 80) return "Very easy";
  if (score >= 60) return "Easy — good for most web readers";
  if (score >= 50) return "Fairly difficult";
  if (score >= 30) return "Difficult";
  return "Very difficult";
}

const STOP = new Set(
  "the a an and or but to of in for on with is are was were be been as that this it its by from at your you we our can will into how what why when where who which about more less than not no so if then they their them he she his her i me my do does did have has had just also there here very".split(" "),
);

export function topTerms(raw: string, limit = 15): Array<{ term: string; count: number; density: number }> {
  const w = words(stripHtml(raw));
  const map = new Map<string, number>();
  for (const x of w) if (x.length >= 3 && !STOP.has(x)) map.set(x, (map.get(x) ?? 0) + 1);
  return Array.from(map, ([term, count]) => ({ term, count, density: w.length ? (count / w.length) * 100 : 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** Occurrences of a (multi-word) phrase, case-insensitive, on word boundaries. */
export function phraseCount(raw: string, phrase: string): number {
  const p = phrase.trim().toLowerCase();
  if (!p) return 0;
  const text = ` ${words(stripHtml(raw)).join(" ")} `;
  const needle = ` ${words(p).join(" ")} `;
  if (needle.trim() === "") return 0;
  let n = 0;
  let i = text.indexOf(needle);
  while (i !== -1) {
    n++;
    i = text.indexOf(needle, i + needle.length - 1);
  }
  return n;
}
