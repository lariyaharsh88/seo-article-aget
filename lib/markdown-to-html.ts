import { marked } from "marked";
import { addExternalLinkRelToHtml } from "@/lib/html-external-links";

marked.setOptions({
  gfm: true,
});

function parseMarkdownToHtmlFragment(markdown: string): string {
  const raw = markdown.trim();
  if (!raw) return "";
  const parsed = marked.parse(raw, { async: false }) as string;
  try {
    return addExternalLinkRelToHtml(parsed);
  } catch {
    return parsed;
  }
}

/** Markdown body only (no wrapper); external links get nofollow + noopener + noreferrer. */
export function markdownToArticleBodyHtml(markdown: string): string {
  return parseMarkdownToHtmlFragment(markdown);
}

/**
 * Full Markdown → HTML for paste into CMS/email. Includes GFM tables, lists, headings, etc.
 * Output is not sanitized — only use with trusted model-generated content.
 */
export function markdownToArticleHtml(markdown: string): string {
  const inner = parseMarkdownToHtmlFragment(markdown);
  if (!inner) return "";
  return `<article class="seo-article">\n${inner}\n</article>`;
}

/** HTML fragment for Tiptap (no outer wrapper). */
export function markdownToEditorHtml(markdown: string): string {
  const inner = parseMarkdownToHtmlFragment(markdown);
  return inner || "<p></p>";
}
