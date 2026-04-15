import { getSiteUrl } from "@/lib/site-url";

type Channel = "telegram" | "whatsapp" | "reddit";

function normalizeAbsoluteUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return getSiteUrl();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  const base = getSiteUrl().replace(/\/$/, "");
  return trimmed.startsWith("/") ? `${base}${trimmed}` : `${base}/${trimmed}`;
}

export function withUtm(
  rawUrl: string,
  channel: Channel,
  campaign = "article_distribution",
): string {
  const abs = normalizeAbsoluteUrl(rawUrl);
  const u = new URL(abs);
  u.searchParams.set("utm_source", channel);
  u.searchParams.set("utm_medium", "social");
  u.searchParams.set("utm_campaign", campaign);
  return u.toString();
}

function compactText(s: string, max: number): string {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

export function buildDistributionPack(input: {
  title: string;
  url: string;
  excerpt?: string | null;
  campaign?: string;
}): {
  links: Record<Channel, string>;
  telegram: string;
  whatsapp: string;
  reddit: {
    title: string;
    body: string;
  };
} {
  const title = compactText(input.title, 180);
  const excerpt = compactText(
    input.excerpt?.trim() || "Latest update with key details and direct access links.",
    240,
  );
  const campaign = input.campaign || "article_distribution";

  const links = {
    telegram: withUtm(input.url, "telegram", campaign),
    whatsapp: withUtm(input.url, "whatsapp", campaign),
    reddit: withUtm(input.url, "reddit", campaign),
  };

  const telegram = [
    `📢 ${title}`,
    "",
    excerpt,
    "",
    `Read now: ${links.telegram}`,
    "",
    "#EducationNews #ExamUpdate",
  ].join("\n");

  const whatsapp = [
    `*${title}*`,
    "",
    excerpt,
    "",
    `Link: ${links.whatsapp}`,
  ].join("\n");

  const redditTitle = compactText(`${title} | Official update and key details`, 300);
  const redditBody = [
    title,
    "",
    excerpt,
    "",
    `Source article: ${links.reddit}`,
    "",
    "Sharing for students and applicants tracking this update.",
  ].join("\n");

  return {
    links,
    telegram,
    whatsapp,
    reddit: {
      title: redditTitle,
      body: redditBody,
    },
  };
}
