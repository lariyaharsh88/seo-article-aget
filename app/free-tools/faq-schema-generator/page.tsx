import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { FaqSchemaGeneratorTool } from "@/components/free-tools/FaqSchemaGenerator";

const DESC =
  "Free FAQ schema generator. Create valid FAQPage JSON-LD structured data from your questions and answers \u2014 copy and paste into any page.";

export const metadata = freeToolMetadata("faq-schema-generator", DESC, [
  "faq schema generator",
  "faq schema markup",
  "faqpage json-ld generator",
  "faq structured data",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="faq-schema-generator"
      description={DESC}
      intro={
        "Add your questions and answers and get valid FAQPage JSON-LD you can paste into any website."
      }
      steps={[
        "Enter each question and its answer (add as many as you need).",
        "Copy the generated code.",
        "Paste it into your page's HTML, publish, then test it with Google's Rich Results Test.",
      ]}
      faqs={[
        {
          q: "What is FAQ schema?",
          a: "Structured data (JSON-LD) that tells search engines your page has questions and answers, so they can understand and sometimes highlight them.",
        },
        {
          q: "Will Google show FAQ rich results?",
          a: "Google now shows FAQ rich results mainly for well-known government and health sites. The markup still helps search engines and AI assistants understand your content.",
        },
        {
          q: "Do the questions need to be on the page?",
          a: "Yes. Only mark up questions and answers that visitors can actually see on the page.",
        },
      ]}
    >
      <FaqSchemaGeneratorTool />
    </FreeToolShell>
  );
}
