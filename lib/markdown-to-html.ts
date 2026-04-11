import { marked } from "marked";

marked.setOptions({
  gfm: true,
});

/**
 * Full Markdown → HTML for paste into CMS/email. Includes GFM tables, lists, headings, etc.
 * Output is not sanitized — only use with trusted model-generated content.
 */
export function markdownToArticleHtml(markdown: string): string {
  const raw = markdown.trim();
  if (!raw) return "";
  const inner = marked.parse(raw) as string;
  return `<article class="seo-article">\n${inner}\n</article>`;
}

/** HTML fragment for Tiptap (no outer wrapper). */
export function markdownToEditorHtml(markdown: string): string {
  const raw = markdown.trim();
  if (!raw) return "<p></p>";
  return marked.parse(raw) as string;
}
