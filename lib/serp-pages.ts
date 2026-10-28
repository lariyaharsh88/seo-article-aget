// Server-only: fetches SERP + competitor pages.
import * as cheerio from "cheerio";
import { serperSearch } from "@/lib/serper";
import type { CompetitorPageText } from "@/lib/term-coverage";

export interface SerpPage extends CompetitorPageText {
  title: string;
  headings: string[];
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";
const SKIP_HOSTS = /(^|\.)(youtube\.com|youtu\.be|reddit\.com|quora\.com)$/i;
const MAX_BYTES = 2 * 1024 * 1024;

async function serperSearchGl(keyword: string, apiKey: string, gl?: string) {
  if (!gl) return serperSearch(keyword, apiKey);
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: { "X-API-KEY": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ q: keyword, num: 10, gl }),
  });
  if (!res.ok) throw new Error(`Serper error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()) as Awaited<ReturnType<typeof serperSearch>>;
}

async function readCapped(res: Response): Promise<string> {
  if (!res.body) return "";
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (size < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    chunks.push(value);
    size += value.byteLength;
  }
  void reader.cancel().catch(() => {});
  return new TextDecoder().decode(Buffer.concat(chunks.map((c) => Buffer.from(c))));
}

export function extractMainText(html: string): { text: string; headings: string[]; title: string } {
  const $ = cheerio.load(html);
  const title = $("title").first().text().replace(/\s+/g, " ").trim();
  $("script,style,noscript,nav,header,footer,aside,form,iframe,svg,button").remove();
  let root = $("article").first();
  if (!root.length || root.text().trim().length < 500) root = $("main").first();
  if (!root.length || root.text().trim().length < 500) root = $("body");
  const headings = root
    .find("h2,h3")
    .map((_, el) => $(el).text().replace(/\s+/g, " ").trim())
    .get()
    .filter((h) => h.length > 2 && h.length < 160);
  root.find("p,li,h1,h2,h3,h4,td,div,br").after(" ");
  const text = root.text().replace(/\s+/g, " ").trim();
  return { text, headings, title };
}

async function fetchPage(url: string, serpTitle: string): Promise<SerpPage | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const ct = res.headers.get("content-type") ?? "";
    if (!/text\/html|xhtml/i.test(ct)) return null;
    const html = await readCapped(res);
    const { text, headings, title } = extractMainText(html);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    if (wordCount < 100) return null;
    return { url, title: serpTitle || title, text, wordCount, headings };
  } catch {
    return null;
  }
}

export async function fetchSerpPages(
  keyword: string,
  apiKey: string,
  country?: string,
  maxPages = 8,
): Promise<SerpPage[]> {
  const data = await serperSearchGl(keyword, apiKey, country);
  const results = (data.organic ?? [])
    .filter((o) => {
      if (!o.link) return false;
      try {
        const u = new URL(o.link);
        return !SKIP_HOSTS.test(u.hostname) && !/\.pdf($|\?)/i.test(u.pathname);
      } catch {
        return false;
      }
    })
    .slice(0, maxPages);
  const pages = await Promise.all(results.map((o) => fetchPage(o.link!, o.title ?? "")));
  return pages.filter((p): p is SerpPage => p !== null);
}
