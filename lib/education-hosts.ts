/** Hostnames that serve the education subdomain surface (see middleware). */
export const EDUCATION_HOSTS = new Set([
  "education.rankflowhq.com",
  "education.rankflohq.com",
]);

/** Canonical hostname for redirects from the apex app to the education surface. */
export const EDUCATION_CANONICAL_HOST = "education.rankflowhq.com";

/** Absolute origin for links from rankflowhq.com → education (footer, homepage, nav). */
export const EDUCATION_SITE_URL = `https://${EDUCATION_CANONICAL_HOST}`;
