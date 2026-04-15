import { headers } from "next/headers";
import { SiteDomain } from "@prisma/client";
import { EDUCATION_CANONICAL_HOST, EDUCATION_HOSTS } from "@/lib/education-hosts";
import { getSiteUrl } from "@/lib/site-url";

export { SiteDomain };

/** Resolve which surface the request is served on (main app vs education subdomain). */
export async function getRequestSiteDomain(): Promise<SiteDomain> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "")
    .split(":")[0]
    .toLowerCase();
  return EDUCATION_HOSTS.has(host) ? SiteDomain.education : SiteDomain.main;
}

export function canonicalOriginForSiteDomain(domain: SiteDomain): string {
  if (domain === SiteDomain.education) {
    return `https://${EDUCATION_CANONICAL_HOST}`;
  }
  return getSiteUrl().replace(/\/$/, "");
}

/** Absolute URL for a path on the canonical host for that domain. */
export function absoluteUrlForSiteDomain(domain: SiteDomain, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${canonicalOriginForSiteDomain(domain)}${p}`;
}
