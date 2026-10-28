import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { WordCounterTool } from "@/components/free-tools/WordCounter";

const DESC =
  "Free word counter with reading time. Count words, characters, sentences and paragraphs as you type, and see reading and speaking time.";

export const metadata = freeToolMetadata("word-counter", DESC, [
  "word counter",
  "character counter",
  "reading time calculator",
  "word count tool",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="word-counter"
      description={DESC}
      intro={
        "Type or paste your text to count words, characters, sentences and paragraphs instantly \u2014 plus reading and speaking time."
      }
      steps={[
        "Type or paste your text into the box.",
        "See the counts update as you type.",
        "Compare against typical lengths for blog posts, product pages and more.",
      ]}
      faqs={[
        {
          q: "How is reading time calculated?",
          a: "At an average of 238 words per minute for silent reading, and 140 words per minute for speaking.",
        },
        {
          q: "How long should a blog post be?",
          a: "Long enough to fully answer the search. Many ranking guides are 1,000\u20132,000 words, but quality and intent matter more than length.",
        },
        {
          q: "Is my text stored?",
          a: "No. Everything is counted in your browser \u2014 nothing is sent to our servers.",
        },
      ]}
    >
      <WordCounterTool />
    </FreeToolShell>
  );
}
