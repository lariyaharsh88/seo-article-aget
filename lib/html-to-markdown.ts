import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const td = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

td.use(gfm);

/** Editor HTML → Markdown (GFM tables, lists, etc.). */
export function htmlToMarkdown(html: string): string {
  const raw = html.trim();
  if (!raw || raw === "<p></p>") return "";
  return td.turndown(raw).trim();
}
