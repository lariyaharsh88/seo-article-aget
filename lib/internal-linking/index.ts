export type {
  ArticleInput,
  InternalLinkEdge,
  InternalLinkKind,
  KeywordRole,
  SuggestOptions,
  SuggestResult,
} from "@/lib/internal-linking/types";
export { suggestInternalLinks } from "@/lib/internal-linking/suggest";
export {
  applyInternalLinksToMarkdown,
  type ApplyLinksOptions,
} from "@/lib/internal-linking/apply-markdown";
export { fetchOpenAIEmbeddings } from "@/lib/internal-linking/embeddings-openai";
export {
  buildArticleTextForEmbedding,
  hashEmbedding,
  pairwiseLexicalSimilarity,
} from "@/lib/internal-linking/fallback-embedding";
export { cosineSimilarity } from "@/lib/internal-linking/similarity";
export { normalizePhrase, primaryFromKeywords, tokenize } from "@/lib/internal-linking/normalize";
