import { canonicalOriginForSiteDomain, getRequestSiteDomain } from "@/lib/site-domain";

/**
 * HTTPS origin without trailing slash for the current request’s site domain.
 * Use for JSON-LD and metadata on routes split between main and education.
 */
export async function getRequestSiteOrigin(): Promise<string> {
  const domain = await getRequestSiteDomain();
  return canonicalOriginForSiteDomain(domain);
}

export async function getRequestMetadataBase(): Promise<URL> {
  const origin = await getRequestSiteOrigin();
  return new URL(`${origin}/`);
}
