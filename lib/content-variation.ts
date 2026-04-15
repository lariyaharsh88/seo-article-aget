export type VariationMode = "long-form" | "news";

function hashText(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(arr: readonly T[], hash: number, offset = 0): T {
  return arr[(hash + offset) % arr.length];
}

function pickTwoDistinct<T>(arr: readonly T[], hash: number): [T, T] {
  const firstIdx = hash % arr.length;
  const secondIdx = (hash + 3) % arr.length;
  if (firstIdx === secondIdx) {
    return [arr[firstIdx], arr[(secondIdx + 1) % arr.length]];
  }
  return [arr[firstIdx], arr[secondIdx]];
}

export function buildContentVariationInstruction(
  seed: string,
  mode: VariationMode,
): string {
  const h = hashText(seed);
  const introStyles = [
    "Start with a direct update sentence, then context.",
    "Start with why this matters, then the update.",
    "Start with a short factual summary bullet block, then narrative.",
  ] as const;
  const headingStyles = [
    "Use action-oriented headings (e.g. 'What changes now').",
    "Use question-style headings where natural (e.g. 'Who should act now?').",
    "Use concise newsroom headings with specific nouns and dates.",
  ] as const;
  const sectionOrders = [
    "Order A: Update -> Key Facts -> Impact -> Process -> FAQs -> Conclusion.",
    "Order B: Impact -> Update -> Key Facts -> Required Actions -> FAQs -> Conclusion.",
    "Order C: Summary -> Update -> Eligibility/Scope -> Timeline -> FAQs -> Conclusion.",
  ] as const;
  const sentencePatternRules = [
    "Mix short and medium sentences; avoid repeating the same opener in consecutive paragraphs.",
    "Vary paragraph length naturally (2 to 5 sentences); avoid uniform blocks.",
    "Use occasional one-line emphasis sentences for key changes/dates.",
  ] as const;

  const uniqueSections = [
    "## Student Reactions",
    "## Expert Analysis",
    "## Previous Year Trends",
  ] as const;
  const [sectionOne, sectionTwo] = pickTwoDistinct(uniqueSections, h);

  const modeSpecific =
    mode === "news"
      ? `- Include at least two unique sections from this set: ${sectionOne} and ${sectionTwo}.
- Keep these sections factual and relevant (no fabricated quotes or fake statistics).`
      : `- Include one optional perspective section when relevant: Student Reactions, Expert Analysis, or Previous Year Trends.
- Do not force all perspective sections if the topic doesn't support them.`;

  return `
ANTI-FOOTPRINT CONTENT VARIATION (must follow):
- ${pick(introStyles, h)}
- ${pick(headingStyles, h, 1)}
- ${pick(sectionOrders, h, 2)}
- ${pick(sentencePatternRules, h, 3)}
- Avoid repetitive template phrases and identical section naming across articles.
- Avoid repeated transitions like "furthermore", "moreover", "in addition" in sequence.
${modeSpecific}
`;
}
