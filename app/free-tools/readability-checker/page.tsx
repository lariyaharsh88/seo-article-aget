import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { ReadabilityCheckerTool } from "@/components/free-tools/ReadabilityChecker";

const DESC =
  "Free readability and keyword density checker. Get a Flesch reading ease score, grade level, sentence length and keyword density for your text.";

export const metadata = freeToolMetadata("readability-checker", DESC, [
  "readability checker",
  "keyword density checker",
  "flesch reading ease calculator",
  "readability score",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="readability-checker"
      description={DESC}
      intro={
        "Paste your text to see how easy it is to read and how often your keyword appears \u2014 with simple suggestions to improve both."
      }
      steps={[
        "Optionally enter the keyword you're targeting.",
        "Paste your article or draft.",
        "Follow the checks: shorten long sentences, simplify wording, and keep keyword use natural.",
      ]}
      faqs={[
        {
          q: "What is a good Flesch reading ease score?",
          a: "60 or higher is easy for most web readers. Scores below 50 are harder and suit technical or academic audiences.",
        },
        {
          q: "What keyword density is best?",
          a: "There's no magic number. Around 0.5\u20132.5% usually reads naturally; much higher looks like keyword stuffing.",
        },
        {
          q: "Does readability affect SEO?",
          a: "Indirectly. Clear writing keeps readers on the page and answers the search better, which helps rankings.",
        },
      ]}
    >
      <ReadabilityCheckerTool />
    </FreeToolShell>
  );
}
