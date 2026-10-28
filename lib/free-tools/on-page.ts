import { load } from "cheerio";
import { safeFetch } from "@/lib/safe-fetch";

/** On-page SEO audit for the free checker: fetch one URL (SSRF-guarded, size-capped) and run checks. */
export type Check = { id: string; label: string; status: "pass" | "warn" | "fail"; detail: string };
export type OnPageReport = {
  url: string;
  finalUrl: string;
  status: number;
  score: number;
  title: string;
  description: string;
  h1: string[];
  h2: string[];
  wordCount: number;
  checks: Check[];
};

const MAX_BYTES = 3_000_000;

async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    total += value.length;
    chunks.push(value);
    if (total > MAX_BYTES) {
      void reader.cancel();
      break;
    }
  }
  return new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
}

export async function auditPage(rawUrl: string): Promise<OnPageReport> {
  const url = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
  const res = await safeFetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (compatible; RankFlowHQ-SEO-Checker/1.0; +https://rankflowhq.com/free-tools/on-page-seo-checker)",
      Accept: "text/html,application/xhtml+xml",
    },
    signal: AbortSignal.timeout(15_000),
  });
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("html")) throw new Error("That URL didn't return an HTML page.");
  const html = await readCapped(res);
  const $ = load(html);
  const finalUrl = res.url || url;
  const host = new URL(finalUrl).hostname;

  const title = $("head title").first().text().replace(/\s+/g, " ").trim();
  const description = ($('meta[name="description"]').attr("content") ?? "").replace(/\s+/g, " ").trim();
  const h1 = $("h1").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get().filter(Boolean);
  const h2 = $("h2").map((_, el) => $(el).text().replace(/\s+/g, " ").trim()).get().filter(Boolean);
  const canonical = $('link[rel="canonical"]').attr("href") ?? "";
  const robots = ($('meta[name="robots"]').attr("content") ?? "").toLowerCase();
  const lang = $("html").attr("lang") ?? "";
  const viewport = $('meta[name="viewport"]').attr("content") ?? "";
  const ogTitle = $('meta[property="og:title"]').attr("content") ?? "";
  const ogImage = $('meta[property="og:image"]').attr("content") ?? "";
  const schemaCount = $('script[type="application/ld+json"]').length;
  const imgs = $("img").toArray();
  const noAlt = imgs.filter((el) => !($(el).attr("alt") ?? "").trim()).length;
  let internal = 0;
  let external = 0;
  $("a[href]").each((_, el) => {
    const href = $(el).attr("href") ?? "";
    if (/^(#|mailto:|tel:|javascript:)/i.test(href)) return;
    try {
      const u = new URL(href, finalUrl);
      if (u.hostname === host) internal++;
      else external++;
    } catch {
      /* ignore bad href */
    }
  });
  $("script, style, noscript, nav, footer, header").remove();
  const wordCount = ($("body").text().match(/[A-Za-z0-9À-ɏऀ-ॿ]+/g) ?? []).length;

  const c: Check[] = [];
  const add = (id: string, label: string, status: Check["status"], detail: string) => c.push({ id, label, status, detail });

  add("https", "HTTPS", finalUrl.startsWith("https://") ? "pass" : "fail", finalUrl.startsWith("https://") ? "Page is served securely." : "Serve the page over HTTPS.");
  add("status", "Page responds", res.status === 200 ? "pass" : "fail", `HTTP ${res.status}.`);
  add(
    "title",
    "Title tag",
    !title ? "fail" : title.length > 60 || title.length < 25 ? "warn" : "pass",
    !title ? "Missing — add a <title>." : `${title.length} characters${title.length > 60 ? " — may be cut in Google (aim for 50–60)" : title.length < 25 ? " — short; add the keyword and a benefit" : ""}.`,
  );
  add(
    "description",
    "Meta description",
    !description ? "fail" : description.length > 160 || description.length < 70 ? "warn" : "pass",
    !description ? "Missing — Google will pick random text from the page." : `${description.length} characters${description.length > 160 ? " — will be cut (aim for 120–155)" : description.length < 70 ? " — short; explain the page and give a reason to click" : ""}.`,
  );
  add("h1", "One H1 heading", h1.length === 1 ? "pass" : h1.length === 0 ? "fail" : "warn", h1.length === 1 ? `"${h1[0].slice(0, 80)}"` : h1.length === 0 ? "No H1 found." : `${h1.length} H1s found — use one main heading.`);
  add("h2", "Subheadings (H2)", h2.length >= 2 ? "pass" : "warn", `${h2.length} H2 heading(s). Break long pages into sections.`);
  add("words", "Content length", wordCount >= 600 ? "pass" : wordCount >= 300 ? "warn" : "fail", `About ${wordCount.toLocaleString()} words of main content.`);
  add("canonical", "Canonical URL", canonical ? "pass" : "warn", canonical ? canonical : "No canonical tag — add one to avoid duplicate-URL issues.");
  add("index", "Indexable", /noindex/.test(robots) ? "fail" : "pass", /noindex/.test(robots) ? "Page has noindex — Google won't show it." : "No noindex tag.");
  add("viewport", "Mobile viewport", viewport ? "pass" : "fail", viewport ? "Mobile viewport is set." : "Add <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">.");
  add("lang", "Language set", lang ? "pass" : "warn", lang ? `lang="${lang}"` : "Add a lang attribute to <html>.");
  add("alt", "Image alt text", imgs.length === 0 ? "pass" : noAlt === 0 ? "pass" : noAlt / imgs.length > 0.3 ? "fail" : "warn", imgs.length === 0 ? "No images." : `${noAlt} of ${imgs.length} images missing alt text.`);
  add("internal", "Internal links", internal >= 3 ? "pass" : "warn", `${internal} internal, ${external} external links.`);
  add("og", "Social preview (Open Graph)", ogTitle && ogImage ? "pass" : "warn", ogTitle && ogImage ? "og:title and og:image set." : "Add og:title and og:image so shares look good.");
  add("schema", "Structured data", schemaCount ? "pass" : "warn", schemaCount ? `${schemaCount} JSON-LD block(s) found.` : "No JSON-LD structured data — add Article, Product or FAQ schema.");

  const pts = c.reduce((n, x) => n + (x.status === "pass" ? 1 : x.status === "warn" ? 0.5 : 0), 0);
  return {
    url,
    finalUrl,
    status: res.status,
    score: Math.round((pts / c.length) * 100),
    title,
    description,
    h1,
    h2: h2.slice(0, 20),
    wordCount,
    checks: c,
  };
}
