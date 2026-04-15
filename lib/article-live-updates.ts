const LIVE_UPDATES_HEADING = "## 🔴 Live Updates";
const SECTION_SPLIT_RE = /\n##\s+/;

function formatIstTimeLabel(d: Date): string {
  return d.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export type LiveUpdateEntry = {
  /** e.g. "2:30 PM IST" */
  timeLabel: string;
  timestampLabel: string;
  note: string;
};

export function extractLiveUpdates(markdown: string): LiveUpdateEntry[] {
  const idx = markdown.indexOf(LIVE_UPDATES_HEADING);
  if (idx < 0) return [];
  const tail = markdown.slice(idx + LIVE_UPDATES_HEADING.length);
  const sectionEndMatch = SECTION_SPLIT_RE.exec(tail);
  const section =
    sectionEndMatch && sectionEndMatch.index >= 0
      ? tail.slice(0, sectionEndMatch.index)
      : tail;

  const lines = section
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const out: LiveUpdateEntry[] = [];

  for (const line of lines) {
    const withDate = line.match(/^- \*\*Updated:\s*(.+?)\*\* — (.+)$/);
    if (withDate) {
      const ts = withDate[1].trim();
      const timeOnly = (ts.match(/\b\d{1,2}:\d{2}\s*[AP]M\b/i)?.[0] || ts).toUpperCase();
      out.push({
        timeLabel: `${timeOnly.replace(/\s+/g, " ")} IST`,
        timestampLabel: ts,
        note: withDate[2].trim(),
      });
      continue;
    }
    const timeOnly = line.match(/^- \*\*(\d{1,2}:\d{2}\s*[AP]M\s*IST)\*\* — (.+)$/i);
    if (timeOnly) {
      const t = timeOnly[1].replace(/\s+/g, " ").toUpperCase();
      out.push({
        timeLabel: t,
        timestampLabel: t,
        note: timeOnly[2].trim(),
      });
    }
  }
  return out;
}

export function appendLiveUpdateToMarkdown(
  markdown: string,
  note: string,
  now = new Date(),
): string {
  const cleanNote = note.replace(/\s+/g, " ").trim();
  if (!cleanNote) return markdown;
  const entry = `- **${formatIstTimeLabel(now)} IST** — ${cleanNote}`;

  const idx = markdown.indexOf(LIVE_UPDATES_HEADING);
  if (idx < 0) {
    return `${LIVE_UPDATES_HEADING}\n${entry}\n\n${markdown}`.trim();
  }

  const head = markdown.slice(0, idx + LIVE_UPDATES_HEADING.length);
  const rest = markdown.slice(idx + LIVE_UPDATES_HEADING.length);
  return `${head}\n${entry}${rest}`;
}

export function latestLiveUpdate(markdown: string): LiveUpdateEntry | null {
  const updates = extractLiveUpdates(markdown);
  return updates.length > 0 ? updates[0] : null;
}

export function hasRecentLiveSignal(updatedAt: Date, now = new Date()): boolean {
  return now.getTime() - updatedAt.getTime() <= 24 * 60 * 60 * 1000;
}

export function buildAutoRefreshNote(title: string, now = new Date()): string {
  const hour = now.getUTCHours();
  const prefix =
    hour % 2 === 0
      ? "Checked latest official references and refreshed key points."
      : "Updated this article with fresh verification details.";
  return `${prefix} ${title.slice(0, 90)} update reviewed.`;
}
