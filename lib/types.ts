export interface Keyword {
  keyword: string;
  type: "primary" | "secondary" | "lsi" | "longtail";
  intent: "informational" | "commercial" | "transactional";
  difficulty: "low" | "medium" | "high";
}

export interface Source {
  url: string;
  title: string;
  snippet: string;
}

export interface SeoMeta {
  metaTitle: string;
  metaDescription: string;
  urlSlug: string;
  focusKeyword: string;
  secondaryKeywords: string[];
  schemaType: "Article" | "HowTo" | "FAQPage";
  ogTitle: string;
  twitterDescription: string;
  readabilityGrade: string;
  estimatedWordCount: string;
}

export interface PipelineState {
  stage: string | null;
  done: string[];
  log: string[];
  article: string;
  keywords: Keyword[];
  sources: Source[];
  paas: string[];
  meta: SeoMeta | null;
  error: string | null;
}

export interface PipelineInput {
  topic: string;
  audience: string;
  intent: "informational" | "commercial" | "transactional" | "navigational";
}

export interface ServerKeyStatus {
  gemini: boolean;
  tavily: boolean;
  serper: boolean;
}
