import type { SeoMeta } from "@/lib/types";

const SCHEMA: SeoMeta["schemaType"][] = ["Article", "HowTo", "FAQPage"];

function isSchema(v: unknown): v is SeoMeta["schemaType"] {
  return typeof v === "string" && (SCHEMA as string[]).includes(v);
}

export function isSeoMeta(x: unknown): x is SeoMeta {
  if (typeof x !== "object" || x === null) return false;
  const o = x as Record<string, unknown>;
  if (typeof o.metaTitle !== "string" || typeof o.metaDescription !== "string")
    return false;
  if (typeof o.urlSlug !== "string" || typeof o.focusKeyword !== "string")
    return false;
  if (!isSchema(o.schemaType)) return false;
  if (typeof o.ogTitle !== "string" || typeof o.twitterDescription !== "string")
    return false;
  if (
    typeof o.readabilityGrade !== "string" ||
    typeof o.estimatedWordCount !== "string"
  )
    return false;
  if (!Array.isArray(o.secondaryKeywords)) return false;
  if (!o.secondaryKeywords.every((k) => typeof k === "string")) return false;
  return true;
}

export function defaultSeoMeta(
  topic: string,
  article: string,
  focusKeyword: string,
): SeoMeta {
  const words = article.trim().split(/\s+/).filter(Boolean).length;
  const title = `${topic} | Expert guide`.slice(0, 60);
  const desc = `Learn about ${focusKeyword || topic} with practical tips and data-backed insights.`.slice(
    0,
    155,
  );
  const slug = (focusKeyword || topic)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 6)
    .join("-");
  return {
    metaTitle: title,
    metaDescription: desc,
    urlSlug: slug || "seo-article",
    focusKeyword: focusKeyword || topic.slice(0, 60),
    secondaryKeywords: [],
    schemaType: "Article",
    ogTitle: title,
    twitterDescription: desc,
    readabilityGrade: "Grade 9–10",
    estimatedWordCount: String(words || 2000),
  };
}
