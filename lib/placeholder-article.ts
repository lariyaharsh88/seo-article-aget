/**
 * Shared articles saved before a real title/slug was set get `generated-article[-xxxxxx]` slugs and the
 * title "Generated article". They are thin duplicates for search, so they are noindexed and kept out of sitemaps.
 */
export const PLACEHOLDER_ARTICLE_SLUG_PREFIX = "generated-article";

export function isPlaceholderArticleSlug(slug: string): boolean {
  return /^generated-article(-[a-z0-9]+)?$/i.test(slug);
}

/** Article HTML usually starts with its own <h1>; the page already renders the title as <h1>. */
export function demoteHtmlH1(html: string): string {
  return html.replace(/<h1(\s|>)/gi, "<h2$1").replace(/<\/h1>/gi, "</h2>");
}
