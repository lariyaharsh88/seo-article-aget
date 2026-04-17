import type { InternalLinkEdge } from "@/lib/internal-linking/types";

export type ApplyLinksOptions = {
  /** Max replacements per unique target article in this document (default 2). */
  maxLinksPerTarget?: number;
  /** Skip auto-linking inside fenced code blocks (default true). */
  skipCodeFences?: boolean;
};

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Split markdown into alternating text / fenced-code segments (``` ... ```).
 */
function splitMarkdownPreserveFences(md: string, skipFences: boolean): { parts: string[]; inFence: boolean[] } {
  if (!skipFences) {
    return { parts: [md], inFence: [false] };
  }
  const chunks = md.split(/(```[\s\S]*?```)/g);
  const parts: string[] = [];
  const inFence: boolean[] = [];
  for (let i = 0; i < chunks.length; i++) {
    parts.push(chunks[i]);
    inFence.push(i % 2 === 1);
  }
  return { parts, inFence };
}

/**
 * Insert markdown links for the first occurrence(s) of anchor text in each editable segment.
 * Does not insert if anchor is already inside a markdown link `[...](...)`.
 */
export function applyInternalLinksToMarkdown(
  markdown: string,
  links: Pick<InternalLinkEdge, "anchorText" | "href" | "toId">[],
  opts?: ApplyLinksOptions,
): { markdown: string; applied: { toId: string; anchorText: string }[] } {
  const maxPerTarget = opts?.maxLinksPerTarget ?? 2;
  const skipFences = opts?.skipCodeFences ?? true;
  const perTarget = new Map<string, number>();
  const applied: { toId: string; anchorText: string }[] = [];

  const { parts, inFence } = splitMarkdownPreserveFences(markdown, skipFences);
  const out: string[] = [];

  for (let p = 0; p < parts.length; p++) {
    if (inFence[p]) {
      out.push(parts[p]);
      continue;
    }
    let segment = parts[p];
    for (const link of links) {
      const used = perTarget.get(link.toId) ?? 0;
      if (used >= maxPerTarget) continue;
      const anchor = link.anchorText.trim();
      if (anchor.length < 2) continue;
      const escaped = escapeRegExp(anchor);
      const re = new RegExp(`\\b(${escaped})\\b`, "i");
      if (!re.test(segment)) continue;
      segment = segment.replace(re, (match) => `[${match}](${link.href})`);
      perTarget.set(link.toId, used + 1);
      applied.push({ toId: link.toId, anchorText: anchor });
    }
    out.push(segment);
  }

  return { markdown: out.join(""), applied };
}
