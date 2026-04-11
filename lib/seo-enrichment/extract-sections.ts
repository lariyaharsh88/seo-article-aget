import type { ParsedSection } from "./types";

/**
 * Split markdown into H1 line, intro (before first ##), and H2 sections.
 */
export function extractH1AndSections(markdown: string): {
  h1: string | null;
  intro: string;
  sections: ParsedSection[];
} {
  const md = markdown.replace(/\r\n/g, "\n").trim();
  if (!md) {
    return { h1: null, intro: "", sections: [] };
  }

  const h1Match = md.match(/^#\s+(.+)$/m);
  const h1 = h1Match ? h1Match[1].trim() : null;

  let rest = md;
  if (h1Match) {
    const idx = md.indexOf(h1Match[0]);
    rest = md.slice(idx + h1Match[0].length).trim();
  }

  const blocks = rest.split(/(?=^##\s)/m).filter((b) => b.trim());
  let intro = "";
  const sections: ParsedSection[] = [];

  for (const block of blocks) {
    const t = block.trim();
    if (!t.startsWith("## ")) {
      intro += (intro ? "\n\n" : "") + t;
      continue;
    }
    const m = t.match(/^##\s+(.+?)$/m);
    if (!m) continue;
    const title = m[1].trim();
    const body = t.slice(m.index! + m[0].length).trim();
    sections.push({ title, body });
  }

  return {
    h1,
    intro: intro.trim(),
    sections,
  };
}
