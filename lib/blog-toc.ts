export type TocEntry = {
  id: string;
  text: string;
  level: 2 | 3;
};

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, "")
    .replace(/&amp;/g, "and")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function extractTocFromMarkdown(markdown: string): TocEntry[] {
  const lines = markdown.split(/\r?\n/);
  const entries: TocEntry[] = [];
  const seen = new Map<string, number>();

  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const level = m[1].length as 2 | 3;
    const text = m[2].trim();
    if (!text) continue;
    const base = slugifyHeading(text) || "section";
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    const id = n === 1 ? base : `${base}-${n}`;
    entries.push({ id, text, level });
  }
  return entries;
}

/**
 * Adds ids to rendered markdown heading tags (<h2>/<h3>) in sequence
 * so TOC links can jump to the section anchors.
 */
export function addHeadingIdsToHtml(html: string, toc: TocEntry[]): string {
  let i2 = 0;
  let i3 = 0;
  const h2 = toc.filter((x) => x.level === 2);
  const h3 = toc.filter((x) => x.level === 3);

  return html.replace(/<h([23])>([\s\S]*?)<\/h\1>/g, (full, level, inner) => {
    if (level === "2") {
      const e = h2[i2++];
      return e ? `<h2 id="${e.id}">${inner}</h2>` : full;
    }
    const e = h3[i3++];
    return e ? `<h3 id="${e.id}">${inner}</h3>` : full;
  });
}
