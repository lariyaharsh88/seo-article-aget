import {
  FreeToolShell,
  freeToolMetadata,
} from "@/components/free-tools/FreeToolShell";
import { SerpPreviewTool } from "@/components/free-tools/SerpPreview";

const DESC =
  "Free SERP preview tool. See exactly how your title, URL and meta description will look in Google search results on desktop and mobile, with pixel-accurate truncation.";

export const metadata = freeToolMetadata("serp-preview", DESC, [
  "serp preview tool",
  "google serp simulator",
  "serp snippet preview",
  "google search preview",
]);

export default function Page() {
  return (
    <FreeToolShell
      slug="serp-preview"
      description={DESC}
      intro={
        "Type your page title, URL and meta description to see how your result will look in Google \u2014 on desktop and mobile \u2014 including where Google will cut it off."
      }
      steps={[
        "Enter your page title, URL and meta description.",
        "Watch the length bars: green is good, amber could be longer, red will be cut.",
        "Switch between desktop and mobile to check both views.",
      ]}
      faqs={[
        {
          q: "Why does Google cut my title?",
          a: "Google limits titles by width (about 600 pixels), not characters. Wide letters like W and M take more space than i or l.",
        },
        {
          q: "Is the preview exactly what Google shows?",
          a: "It's very close: it uses the same font and width limits. Google can still rewrite titles or descriptions for some searches.",
        },
        {
          q: "Why is the mobile description shorter?",
          a: "Mobile results have less width, so Google shows fewer characters of the description.",
        },
      ]}
    >
      <SerpPreviewTool />
    </FreeToolShell>
  );
}
