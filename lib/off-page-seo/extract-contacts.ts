import { load } from "cheerio";

const EMAIL_RE =
  /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g;

const FAKE = /example\.com|domain\.com|yoursite\.com|email\.com|test\.com/i;

function cleanEmail(s: string): string | null {
  const e = s.trim().toLowerCase();
  if (FAKE.test(e)) return null;
  if (e.length > 80) return null;
  return e;
}

export interface ContactBundle {
  emails: string[];
  contact_page: string | null;
  twitter: string | null;
  linkedin: string | null;
}

export async function extractContactsForDomain(
  domain: string,
): Promise<ContactBundle> {
  const base = domain.replace(/^www\./, "");
  const paths = [
    "/contact",
    "/contact-us",
    "/about",
    "/about-us",
    "/write-for-us",
    "/guest-post",
    "/",
  ];

  const emails = new Set<string>();
  let contactPage: string | null = null;
  let twitter: string | null = null;
  let linkedin: string | null = null;

  for (const path of paths) {
    const url = `https://${base}${path}`;
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RankFlowHQ/1.0; +https://github.com/)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(7500),
      });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("text/html") && !ct.includes("application/xhtml")) {
        continue;
      }
      const html = await res.text();
      if (html.length > 2_000_000) continue;

      const $ = load(html);

      $("a[href^='mailto:'], a[href^='MAILTO:']").each((_, el) => {
        const href = $(el).attr("href") || "";
        const raw = href.replace(/^mailto:/i, "").split("?")[0]?.trim();
        if (raw?.includes("@")) {
          const c = cleanEmail(raw);
          if (c) emails.add(c);
        }
      });

      const text = $.text();
      for (const m of text.match(EMAIL_RE) || []) {
        const c = cleanEmail(m);
        if (c) emails.add(c);
      }

      $("a[href]").each((_, el) => {
        const href = ($(el).attr("href") || "").trim();
        if (!twitter && /twitter\.com\//i.test(href) && !/intent\//i.test(href)) {
          twitter = href.startsWith("http") ? href : `https://${href.replace(/^\/\//, "")}`;
        }
        if (!linkedin && /linkedin\.com\//i.test(href)) {
          linkedin = href.startsWith("http") ? href : `https://${href.replace(/^\/\//, "")}`;
        }
      });

      if (!contactPage && path !== "/" && emails.size > 0) {
        contactPage = url;
      }
      if (emails.size >= 3) break;
    } catch {
      /* network / TLS / timeout */
    }
  }

  const list = Array.from(emails).slice(0, 5);
  return {
    emails: list,
    contact_page: contactPage,
    twitter,
    linkedin,
  };
}
