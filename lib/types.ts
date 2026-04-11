export interface Keyword {
  keyword: string;
  type: "primary" | "secondary" | "lsi" | "longtail";
  intent: "informational" | "commercial" | "transactional";
  difficulty: "low" | "medium" | "high";
}

/** Google answer / featured-snippet block from Serper `answerBox`. */
export interface FeaturedSnippet {
  title?: string;
  url?: string;
  text: string;
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
  /** Optional page URL to align the brief with a published URL (research + GSC filter). */
  sourceUrl: string;
  /** Used for Google autocomplete; defaults to topic line if empty when fetching suggestions. */
  primaryKeyword: string;
}

export interface ServerKeyStatus {
  gemini: boolean;
  tavily: boolean;
  serper: boolean;
}

/** Chart image URL plus caption from research (see /api/research-images — QuickChart templates). */
export interface ResearchImageAsset {
  url: string;
  /** Short excerpt from research that supplied the numeric values. */
  dataPoint: string;
  alt: string;
  insight: string;
  /** Fixed template id, e.g. "QuickChart · bar". */
  templateLabel: string;
}
