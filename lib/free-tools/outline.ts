import { fetchGoogleSearchSuggestions } from "@/lib/google-suggest";
import type { Outline } from "@/lib/free-tools/outline-format";

/**
 * Builds an article outline from real Google autocomplete data (free, no AI): question
 * searches become FAQs, modifier searches ("best", "vs", "for", "cost") become sections.
 */

const QUESTION_WORDS = ["what", "how", "why", "when", "which", "can", "is", "does", "should"];
const MODIFIERS = ["best", "vs", "for", "free", "cost", "examples", "tips", "tools"];

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function uniq(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const k = x.toLowerCase().replace(/\s+/g, " ").trim();
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function buildOutline(keywordRaw: string): Promise<Outline> {
  const keyword = keywordRaw.trim().replace(/\s+/g, " ").slice(0, 80);
  const k = keyword.toLowerCase();
  const queries = [k, ...QUESTION_WORDS.map((w) => `${w} ${k}`), ...MODIFIERS.map((m) => `${k} ${m}`)];
  const results = await Promise.allSettled(queries.map((q) => fetchGoogleSearchSuggestions(q)));
  // Drop suggestions that only echo one of our own queries (e.g. "what intermittent fasting").
  const sent = new Set(queries.map((q) => q.toLowerCase()));
  const all = uniq(
    results
      .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
      .filter((s) => !sent.has(s.toLowerCase().replace(/\s+/g, " ").trim())),
  );

  const kWords = k.split(" ").length;
  const thisYear = new Date().getFullYear();
  const hasOldYear = (s: string) => (s.match(/\b20\d\d\b/g) ?? []).some((y) => Number(y) !== thisYear);
  const wc = (s: string) => s.trim().split(/\s+/).length;
  const hasKeyword = (s: string) => s.toLowerCase().includes(k);
  const isQuestion = (s: string) => QUESTION_WORDS.some((w) => s.toLowerCase().startsWith(`${w} `));
  // Keep only suggestions that contain the full keyword and add real words (drops "what e marketing", "what X do").
  const questions = all
    .filter((s) => isQuestion(s) && hasKeyword(s) && wc(s) >= kWords + 3)
    .slice(0, 8)
    .map((q) => `${cap(q)}?`);
  const others = all.filter((s) => !isQuestion(s) && hasKeyword(s) && wc(s) > kWords && !/^(for|with|to|and|or)\s/i.test(s) && !hasOldYear(s));
  const pick = (re: RegExp, n: number) => others.filter((s) => re.test(s)).slice(0, n).map(cap);

  const sections: Outline["sections"] = [
    { h2: `What is ${keyword}?`, h3: ["A simple definition", "Why it matters"] },
    { h2: `How ${keyword} works`, h3: pick(/\bhow\b|\bwork|\bsteps?\b|\bprocess\b/i, 3) },
    { h2: `Benefits of ${keyword}`, h3: [] },
    { h2: `How to get started with ${keyword}`, h3: ["Step 1: …", "Step 2: …", "Step 3: …"] },
  ];
  const best = pick(/\bbest\b|\btop\b|\btools?\b|\bapps?\b|\bsoftware\b/i, 4);
  if (best.length) sections.push({ h2: `Best ${keyword} options`, h3: best });
  const cost = pick(/\bcost|\bprice|\bpricing|\bfree\b|\bcheap/i, 3);
  if (cost.length) sections.push({ h2: `Free and paid ${keyword} options`, h3: cost });
  const vs = pick(/\bvs\b|\bversus\b|\balternative/i, 3);
  if (vs.length) sections.push({ h2: `${cap(keyword)} compared`, h3: vs });
  const forWho = pick(/\bfor\b/i, 3);
  if (forWho.length) sections.push({ h2: `${cap(keyword)} for different needs`, h3: forWho });
  sections.push({ h2: "Common mistakes to avoid", h3: [] }, { h2: "Conclusion", h3: [] });

  const used = new Set(sections.flatMap((s) => s.h3.map((h) => h.toLowerCase())));
  return {
    keyword,
    title: `${cap(keyword)}: The Complete Guide (${new Date().getFullYear()})`,
    sections,
    faqs: questions,
    related: others.filter((s) => !used.has(cap(s).toLowerCase())).slice(0, 12),
  };
}
