import { RepurposeUrlClient } from "@/components/RepurposeUrlClient";
import { ToolExplainerSection } from "@/components/ToolExplainerSection";
import { getToolExplainerMarkdown } from "@/lib/tool-explainer";

export default async function RepurposeUrlPage() {
  const markdown = await getToolExplainerMarkdown("repurpose-url");
  return (
    <>
      <RepurposeUrlClient />
      <ToolExplainerSection markdown={markdown} />
    </>
  );
}
