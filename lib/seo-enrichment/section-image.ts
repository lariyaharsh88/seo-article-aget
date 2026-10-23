import { getSiteUrl } from "@/lib/site-url";

/**
 * Section images for enriched articles — free sources only.
 * 1. Unsplash photo search (free API key; hotlinking + credit is the required usage).
 * 2. Fallback: our own branded card (/og/card), which never rate-limits.
 * Replaces Pollinations, whose free tier returns a "Free limit reached" banner as the image.
 */
export type SectionImage = {
  url: string;
  alt: string;
  /** HTML caption with required photographer credit, when the image is a photo. */
  creditHtml?: string;
  source: "unsplash" | "card";
};

const UTM = "utm_source=rankflowhq&utm_medium=referral";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function brandedCardUrl(title: string, kicker: string, variant: number, w = 1200, h = 675): string {
  const base = getSiteUrl().replace(/\/$/, "");
  const q = new URLSearchParams({ title, kicker, v: String(variant), w: String(w), h: String(h) });
  return `${base}/og/card?${q.toString()}`;
}

type UnsplashPhoto = {
  id: string;
  alt_description: string | null;
  urls: { regular: string };
  links: { html: string; download_location: string };
  user: { name: string; links: { html: string } };
};

/** Searches Unsplash and returns the first photo not already used in this article. */
async function searchUnsplash(query: string, key: string, used: Set<string>): Promise<UnsplashPhoto | null> {
  const url = `https://api.unsplash.com/search/photos?${new URLSearchParams({
    query: query.slice(0, 100),
    per_page: "10",
    orientation: "landscape",
    content_filter: "high",
  })}`;
  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Unsplash HTTP ${res.status}`);
  const data = (await res.json()) as { results?: UnsplashPhoto[] };
  const photo = (data.results ?? []).find((p) => !used.has(p.id)) ?? null;
  if (photo) {
    used.add(photo.id);
    // Unsplash API guidelines: register a download when a photo is used.
    void fetch(photo.links.download_location, { headers: { Authorization: `Client-ID ${key}` } }).catch(() => {});
  }
  return photo;
}

export async function pickSectionImage(opts: {
  sectionTitle: string;
  keyword: string;
  index: number;
  unsplashKey?: string;
  used: Set<string>;
}): Promise<SectionImage & { note: string }> {
  const { sectionTitle, keyword, index, unsplashKey, used } = opts;
  if (unsplashKey) {
    try {
      const photo =
        (await searchUnsplash(`${keyword} ${sectionTitle}`, unsplashKey, used)) ??
        (await searchUnsplash(keyword, unsplashKey, used));
      if (photo) {
        const name = esc(photo.user.name);
        return {
          url: `${photo.urls.regular}${photo.urls.regular.includes("?") ? "&" : "?"}w=1200&q=80`,
          alt: photo.alt_description?.trim() || sectionTitle,
          creditHtml: `Photo by <a href="${esc(photo.user.links.html)}?${UTM}" rel="nofollow noopener" target="_blank">${name}</a> on <a href="https://unsplash.com/?${UTM}" rel="nofollow noopener" target="_blank">Unsplash</a>`,
          source: "unsplash",
          note: `Unsplash photo by ${photo.user.name}`,
        };
      }
    } catch (e) {
      return {
        url: brandedCardUrl(sectionTitle, keyword, index),
        alt: sectionTitle,
        source: "card",
        note: `Branded card (Unsplash failed: ${e instanceof Error ? e.message : "error"})`,
      };
    }
  }
  return {
    url: brandedCardUrl(sectionTitle, keyword, index),
    alt: sectionTitle,
    source: "card",
    note: unsplashKey ? "Branded card (no matching photo)" : "Branded card (set UNSPLASH_ACCESS_KEY for photos)",
  };
}
