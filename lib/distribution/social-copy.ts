/**
 * Template-based social packs (no LLM) — deterministic, cheap, safe for mass generation.
 */

export type SocialDistributionPack = {
  twitterThread: string[];
  linkedIn: string;
  pinterest: {
    title: string;
    description: string;
  };
  meta: {
    primaryKeyword?: string;
    canonicalUrl: string;
  };
};

const MAX_TWEET = 275;

function truncate(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#>*_`]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** First ~2 sentences or 320 chars of plain text. */
export function excerptFromMarkdown(markdown: string, maxLen = 320): string {
  const plain = stripMarkdown(markdown);
  if (plain.length <= maxLen) return plain;
  const cut = plain.slice(0, maxLen);
  const last = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return last > 80 ? cut.slice(0, last + 1) : `${cut}…`;
}

/** Bullet lines from markdown (## / ### / - list). */
export function extractKeyPoints(markdown: string, maxPoints = 5): string[] {
  const lines = markdown.split(/\r?\n/);
  const out: string[] = [];
  for (const line of lines) {
    const t = line.trim();
    if (/^[-*]\s+/.test(t)) {
      out.push(t.replace(/^[-*]\s+/, "").replace(/\*\*/g, "").slice(0, 200));
    }
    if (out.length >= maxPoints) break;
  }
  if (out.length >= 3) return out;
  const sentences = stripMarkdown(markdown).split(/(?<=[.!?])\s+/);
  for (const s of sentences) {
    const u = s.trim();
    if (u.length < 40) continue;
    out.push(u);
    if (out.length >= maxPoints) break;
  }
  return out.slice(0, maxPoints);
}

function chunkThread(parts: string[]): string[] {
  const out: string[] = [];
  for (const p of parts) {
    const chunks: string[] = [];
    let rest = p;
    while (rest.length > MAX_TWEET) {
      const slice = rest.slice(0, MAX_TWEET);
      const sp = slice.lastIndexOf(" ");
      chunks.push(sp > 40 ? rest.slice(0, sp) : slice);
      rest = rest.slice(sp > 40 ? sp + 1 : MAX_TWEET).trim();
    }
    if (rest) chunks.push(rest);
    out.push(...chunks);
  }
  return out.filter(Boolean);
}

export function buildSocialDistributionPack(input: {
  title: string;
  canonicalUrl: string;
  markdown: string;
  primaryKeyword?: string;
}): SocialDistributionPack {
  const excerpt = excerptFromMarkdown(input.markdown, 280);
  const points = extractKeyPoints(input.markdown, 5);
  const kw = input.primaryKeyword?.trim();

  const hook = kw
    ? `${input.title}\n\n${truncate(excerpt, 200)}\n\n${input.canonicalUrl}`
    : `${input.title}\n\n${truncate(excerpt, 220)}\n\n${input.canonicalUrl}`;

  const threadParts: string[] = [truncate(hook, MAX_TWEET)];
  threadParts.push(
    `Why it matters:\n${points
      .slice(0, 3)
      .map((p, i) => `${i + 1}) ${truncate(p, 180)}`)
      .join("\n")}`,
  );
  if (points.length > 3) {
    threadParts.push(
      `More takeaways:\n${points
        .slice(3)
        .map((p, i) => `${i + 4}) ${truncate(p, 160)}`)
        .join("\n")}\n\n${input.canonicalUrl}`,
    );
  } else {
    threadParts.push(`Read the full guide: ${input.canonicalUrl}`);
  }

  const twitterThread = chunkThread(threadParts);

  const linkedInParts = [
    truncate(input.title, 200),
    "",
    excerpt.slice(0, 2600),
    "",
    `Link: ${input.canonicalUrl}`,
  ];
  if (kw) linkedInParts.push("", `Context: ${kw}`);
  linkedInParts.push("", "What would you add? Comment below.");
  const linkedIn = linkedInParts
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 3000);

  const pinTitle = truncate(input.title, 100);
  const pinDesc = truncate(
    `${excerpt} Save for later — full checklist and examples in the article. ${input.canonicalUrl}`,
    500,
  );

  return {
    twitterThread,
    linkedIn,
    pinterest: { title: pinTitle, description: pinDesc },
    meta: { primaryKeyword: kw, canonicalUrl: input.canonicalUrl },
  };
}
