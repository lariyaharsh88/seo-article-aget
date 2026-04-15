import { SiteDomain } from "@prisma/client";

/** Education / exam / admissions — prefer education subdomain. */
const EDUCATION_RE =
  /\b(education|edtech|exam|exams|examination|board|cbse|icse|neet|jee|jee main|jee advanced|upsc|gate|cat|nda|student|school|college|university|campus|admission|admissions|syllabus|semester|scholarship|cutoff|result|marksheet|higher education|ugc|nep)\b/i;

/** AI / SEO product — prefer main domain. */
const MAIN_PRODUCT_RE =
  /\b(ai seo|llm|gpt|chatgpt|openai|rankflow|seo automation|keyword cluster|serp|backlink|programmatic seo|generative engine|llms\.txt|content workflow)\b/i;

/**
 * Heuristic: education & exam topics → education; strong product/AI signals → main;
 * default main.
 */
export function inferSiteDomainFromText(
  ...parts: (string | null | undefined)[]
): SiteDomain {
  const text = parts.filter(Boolean).join("\n").slice(0, 80_000);
  if (!text.trim()) return SiteDomain.main;
  const ed = EDUCATION_RE.test(text);
  const main = MAIN_PRODUCT_RE.test(text);
  if (ed && !main) return SiteDomain.education;
  if (main && !ed) return SiteDomain.main;
  if (ed && main) return SiteDomain.education;
  return SiteDomain.main;
}
