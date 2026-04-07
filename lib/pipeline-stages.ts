export interface PipelineStageDef {
  id: string;
  label: string;
  description: string;
  color: string;
}

export const PIPELINE_STAGES: PipelineStageDef[] = [
  {
    id: "keywords",
    label: "Keywords",
    description: "Serper signals + Gemini keyword map",
    color: "#f59e0b",
  },
  {
    id: "research",
    label: "Research",
    description: "Tavily deep crawl + stats pass",
    color: "#06b6d4",
  },
  {
    id: "serp",
    label: "SERP",
    description: "Top results, PAA, related searches",
    color: "#8b5cf6",
  },
  {
    id: "queries",
    label: "Queries",
    description: "Clustered searcher phrasing",
    color: "#ec4899",
  },
  {
    id: "outline",
    label: "Outline",
    description: "Structured H1–H3 + FAQ skeleton",
    color: "#10b981",
  },
  {
    id: "article",
    label: "Article",
    description: "Gemini long-form draft (streaming)",
    color: "#3b82f6",
  },
  {
    id: "audit",
    label: "SEO audit",
    description: "Meta pack + schema hints",
    color: "#f97316",
  },
];
