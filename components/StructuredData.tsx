import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";

/**
 * Site-wide schema.org graph (WebSite, Organization, SoftwareApplication).
 */
export function StructuredData() {
  const url = getSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${url}/#website`,
        url,
        name: SITE_NAME,
        description: SITE_DESCRIPTION,
        inLanguage: "en",
        publisher: { "@id": `${url}/#organization` },
        potentialAction: {
          "@type": "ReadAction",
          target: url,
        },
      },
      {
        "@type": "Organization",
        "@id": `${url}/#organization`,
        name: SITE_NAME,
        url,
      },
      {
        "@type": "SoftwareApplication",
        "@id": `${url}/#software`,
        name: SITE_NAME,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "SEO Software",
        operatingSystem: "Web",
        browserRequirements: "Requires JavaScript. Modern browser.",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
        },
        description: SITE_DESCRIPTION,
        url,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph) }}
    />
  );
}
