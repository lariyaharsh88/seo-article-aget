import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { HeadlineGeneratorTool } from "@/components/free-tools/HeadlineGenerator";

const DESC =
  "Free headline generator for blog posts. Get 20+ click-worthy titles for any topic \u2014 how-to, list, question, guide and comparison styles.";

export const metadata = freeToolMetadata("headline-generator", DESC, [
  "headline generator",
  "blog title generator",
  "blog post title ideas",
  "title generator",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="headline-generator"
      description={DESC}
      intro={
        "Enter a topic and get 20+ headline ideas in proven formats \u2014 how-to, lists, questions, guides and comparisons \u2014 ready to copy."
      }
      steps={[
        "Type your topic or keyword, and optionally who it's for.",
        "Filter by style to find the angle you want.",
        "Copy a headline and adjust it so it promises exactly what your article delivers.",
      ]}
      faqs={[
        {
          q: "What makes a good blog headline?",
          a: 'It includes the keyword, promises a clear benefit, and sets the right expectation \u2014 for example a number, a year or "step by step".',
        },
        {
          q: "Should the headline match the SEO title?",
          a: "They can differ. The headline (H1) is for readers on the page; the SEO title is what shows in Google and should stay under ~60 characters.",
        },
        {
          q: "Do numbers in headlines work?",
          a: 'Yes \u2014 list headlines like "7 mistakes\u2026" are easy to scan and often get more clicks.',
        },
      ]}
    >
      <HeadlineGeneratorTool />
    </FreeToolShell>
  );
}
