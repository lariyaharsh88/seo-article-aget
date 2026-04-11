/** Google AdSense publisher ID (`ca-pub-…`). */
export const ADSENSE_CLIENT_ID =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID?.trim() ||
  "ca-pub-7494206891190273";

/**
 * Ad unit slot IDs from AdSense → Ads → By ad unit.
 * Set in `.env` / hosting env; leave unset to hide that placement.
 */
export const ADSENSE_SLOTS = {
  /** Home: below hero, above tool cards. */
  homeTop: process.env.NEXT_PUBLIC_ADSENSE_SLOT_HOME_TOP?.trim() || "",
  /** Site-wide: above footer chrome. */
  footer: process.env.NEXT_PUBLIC_ADSENSE_SLOT_FOOTER?.trim() || "",
  /** SEO article pipeline: top of tool main column. */
  toolInline: process.env.NEXT_PUBLIC_ADSENSE_SLOT_TOOL_INLINE?.trim() || "",
} as const;
