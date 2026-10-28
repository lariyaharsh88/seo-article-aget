export const SITE_NAME = "RankFlowHQ";

/** Public path (leading slash) — served from `public/brand/`. */
export const SITE_LOGO_PATH = "/brand/rankflowhq-logo.png";

/** Pixel dimensions of `SITE_LOGO_PATH` (for OG / Twitter metadata). */
export const SITE_LOGO_DIMENSIONS = { width: 1024, height: 1024 } as const;

/** Default social-share image (1200×630). The square logo stays for schema.org `Organization.logo`. */
export const SITE_OG_IMAGE_PATH = "/brand/rankflowhq-og.png";
export const SITE_OG_IMAGE_DIMENSIONS = { width: 1200, height: 630 } as const;

/** Default meta description for the site (layout, JSON-LD where shared). */
export const SITE_DESCRIPTION =
  "Build SEO articles that rank on Google and ChatGPT using AI automation.";
