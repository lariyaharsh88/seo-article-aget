import { load } from "cheerio";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/**
 * Best-effort plain text from an article URL (external sites may block server IPs).
 */
export async function fetchArticlePlainText(
  url: string,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(12_000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const html = await res.text();
    if (!html || html.length < 200) return null;

    const $ = load(html);
    $("script,style,noscript,iframe,svg,nav,footer,header").remove();
    const fromArticle = $("article").text().trim();
    const fromMain = $("main").text().trim();
    const fromBody = $("body").text().trim();
    const text = (fromArticle || fromMain || fromBody)
      .replace(/\s+/g, " ")
      .trim();
    if (text.length < 80) return null;
    return text.slice(0, 12_000);
  } catch {
    return null;
  }
}
