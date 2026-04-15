/** Main SaaS origin for education → product funnel links. */
export const MAIN_SAAS_ORIGIN = "https://rankflowhq.com";

/** UTM `utm_medium` values for funnel attribution. */
export type EducationFunnelMedium =
  | "top_bar"
  | "sticky_button"
  | "exit_popup"
  | "inline_article"
  | "article_footer"
  | "header_nav";

const UTM_SOURCE = "education_site";
const UTM_CAMPAIGN = "education_to_saas";

/**
 * Build a RankFlowHQ URL with consistent UTM params for education traffic.
 * Use `utm_content` for article slug or page id when helpful for analytics.
 */
export function buildEducationFunnelUrl(
  path: string,
  medium: EducationFunnelMedium,
  content?: string,
): string {
  const normalized =
    path.startsWith("http") || path.startsWith("//")
      ? path
      : `${MAIN_SAAS_ORIGIN}${path.startsWith("/") ? path : `/${path}`}`;
  const u = new URL(normalized);
  u.searchParams.set("utm_source", UTM_SOURCE);
  u.searchParams.set("utm_medium", medium);
  u.searchParams.set("utm_campaign", UTM_CAMPAIGN);
  if (content?.trim()) {
    u.searchParams.set("utm_content", content.trim().slice(0, 200));
  }
  return u.toString();
}
