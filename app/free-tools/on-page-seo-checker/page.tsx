import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { OnPageCheckerTool } from "@/components/free-tools/OnPageChecker";

const DESC =
  "Free on-page SEO checker. Enter any URL to check the title, meta description, headings, content length, images, links, canonical, indexability and structured data.";

export const metadata = freeToolMetadata("on-page-seo-checker", DESC, [
  "on page seo checker",
  "seo checker",
  "website seo audit",
  "free seo audit tool",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="on-page-seo-checker"
      description={DESC}
      intro={
        "Enter a page URL and get an instant on-page SEO checklist \u2014 title, description, headings, content length, image alt text, links, indexing and structured data \u2014 with what to fix first."
      }
      steps={[
        "Paste the full URL of the page you want to check.",
        "Click Check page \u2014 it takes a few seconds.",
        "Fix the red items first, then the amber ones, and check again.",
      ]}
      faqs={[
        {
          q: "What does the on-page SEO checker look at?",
          a: "15 checks: HTTPS, response status, title, meta description, H1, subheadings, word count, canonical, noindex, mobile viewport, language, image alt text, internal links, Open Graph tags and structured data.",
        },
        {
          q: "Is a 100 score guaranteed to rank?",
          a: "No. On-page SEO is one part of ranking \u2014 content quality, search intent and backlinks matter too. The score shows whether the basics are in place.",
        },
        {
          q: "Can it check pages behind a login?",
          a: "No. It only sees what a public visitor (and Google) sees.",
        },
        {
          q: "Why couldn't it open my page?",
          a: "The site may block automated requests, take longer than 15 seconds, or the URL may be private or invalid.",
        },
      ]}
    >
      <OnPageCheckerTool />
    </FreeToolShell>
  );
}
