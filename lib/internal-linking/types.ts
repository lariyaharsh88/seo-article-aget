export type KeywordRole = "primary" | "secondary" | "supporting";

/** Article payload for the linking engine (in-memory or loaded from DB). */
export type ArticleInput = {
  id: string;
  title: string;
  topic: string;
  markdown: string;
  keywords: { phrase: string; role?: KeywordRole }[];
  /** Absolute or site-relative URL used when emitting markdown links. */
  url?: string;
};

export type InternalLinkKind =
  | "same_cluster"
  | "supporting_keyword"
  | "parent_child"
  | "semantic";

export type InternalLinkEdge = {
  fromId: string;
  toId: string;
  score: number;
  kind: InternalLinkKind;
  anchorText: string;
  href: string;
  rationale: string;
};

export type SuggestOptions = {
  /** Max outbound suggestions per source article (default 8). */
  maxOutgoingPerArticle?: number;
  /** Max inbound suggestions per target article (default 12). */
  maxIncomingPerArticle?: number;
  /** Cosine similarity floor for same-topic cluster edges (default 0.78). */
  clusterSimilarityThreshold?: number;
  /** Minimum semantic cosine to consider a candidate (default 0.52). */
  semanticMinSim?: number;
  /** OpenAI model for embeddings (default text-embedding-3-small). */
  embeddingModel?: string;
};

export type SuggestResult = {
  edges: InternalLinkEdge[];
  /** Union-find cluster id per article id. */
  clusters: Record<string, number>;
  embeddingModel: string;
  usedOpenAI: boolean;
};
