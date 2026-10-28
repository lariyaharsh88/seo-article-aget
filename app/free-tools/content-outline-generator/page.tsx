import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { OutlineGeneratorTool } from "@/components/free-tools/OutlineGenerator";

const DESC =
  "Free content outline generator. Turn any keyword into an article outline with H2s, H3s and FAQs based on real Google searches. Copy as Markdown.";

export const metadata = freeToolMetadata("content-outline-generator", DESC, [
  "content outline generator",
  "blog outline generator",
  "article outline generator",
  "seo content outline",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="content-outline-generator"
      description={DESC}
      intro={
        "Enter a keyword and get an article outline built from what people actually search on Google \u2014 section headings, sub-points and the questions to answer in your FAQ."
      }
      steps={[
        "Type the keyword your article should rank for.",
        "Click Generate outline \u2014 we look up related Google searches and questions.",
        "Copy the outline as Markdown, or have RankFlowHQ write the full article from it.",
      ]}
      faqs={[
        {
          q: "Where do the headings come from?",
          a: "From Google autocomplete: the searches and questions people type around your keyword. That keeps the outline focused on what readers want.",
        },
        {
          q: "Is this outline AI-generated?",
          a: "No \u2014 it's built from live search data and a proven article structure, so it's fast and free.",
        },
        {
          q: "How do I use the outline?",
          a: "Write one section per H2, answer the FAQ questions directly, and cover the related searches where they fit naturally.",
        },
      ]}
    >
      <OutlineGeneratorTool />
    </FreeToolShell>
  );
}
