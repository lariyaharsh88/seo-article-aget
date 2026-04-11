import { SeoAgentClient } from "@/components/SeoAgentClient";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export default async function SeoAgentPage() {
  const markdown = await getToolExplainerMarkdown("seo-agent");
  return (
    <>
      <SeoAgentClient />
      <ToolExplainerSection markdown={markdown} />
    </>
  );
}
