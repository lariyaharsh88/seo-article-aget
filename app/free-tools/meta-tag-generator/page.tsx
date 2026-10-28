import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { MetaTagGeneratorTool } from "@/components/free-tools/MetaTagGenerator";

const DESC =
  "Free meta title and description generator. Get SEO titles and meta descriptions that fit Google's pixel limits, with a live search preview. No sign-up.";

export const metadata = freeToolMetadata("meta-tag-generator", DESC, [
  "meta tag generator",
  "meta description generator",
  "seo title generator",
  "meta title generator",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="meta-tag-generator"
      description={DESC}
      intro={
        "Enter your keyword and page type to get SEO-friendly titles and meta descriptions. Each one is measured against Google's real pixel limits, so it won't get cut off in search results."
      }
      steps={[
        "Type the main keyword the page should rank for.",
        "Pick the page type (blog post, product, service, local business or homepage) and optionally add your brand and main benefit.",
        "Click a title and a description to preview them in Google, then copy them or the ready-made HTML.",
      ]}
      faqs={[
        {
          q: "How long should a meta title be?",
          a: "Google cuts titles at about 600 pixels wide \u2014 usually 50\u201360 characters. The length bar shows the real pixel width, which matters more than the character count.",
        },
        {
          q: "How long should a meta description be?",
          a: 'About 120\u2013155 characters (up to ~920 pixels on desktop). Longer descriptions are cut with "\u2026".',
        },
        {
          q: "Does Google always use my meta description?",
          a: "No. Google sometimes rewrites it to match the search. A clear, specific description that matches the page makes it more likely to be used.",
        },
        {
          q: "Do meta descriptions affect rankings?",
          a: "Not directly, but a good one increases how many people click your result, which brings more traffic.",
        },
      ]}
    >
      <MetaTagGeneratorTool />
    </FreeToolShell>
  );
}
