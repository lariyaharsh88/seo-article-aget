# Internal linking engine (RankFlowHQ)

## Architecture

1. **Inputs**  
   For each article: `id`, `title`, `topic`, `markdown`, `keywords[]` with optional `role` (`primary` | `secondary` | `supporting`), and optional `url` for final `href`s.

2. **Representation**  
   A single embedding vector per article is built from `title + topic + keyword phrases`. This vector is the semantic “centroid” for matching and clustering.

3. **Similarity**  
   - **Primary path:** cosine similarity on OpenAI `text-embedding-3-small` (1536-d) vectors.  
   - **Fallback (no `OPENAI_API_KEY`):** deterministic 256-d hash bag-of-words vectors (good for CI/dev, not true semantics).

4. **Topic clusters**  
   Union–find on pairs where cosine ≥ `clusterSimilarityThreshold` (default **0.78**) **or** keyword Jaccard ≥ **0.2**. Cluster id drives the `same_cluster` link kind.

5. **Parent / child**  
   Heuristic: child primary phrase is contained in parent `title`/`topic`, or token overlap on the child primary vs parent text is very high. Emits directed `parent_child` edges (prioritized in scoring).

6. **Supporting keywords**  
   Jaccard overlap on normalized phrases, or secondary/supporting phrases from the target appear in the source body/title, or cosine is high enough—classified as `supporting_keyword`.

7. **Scoring & caps**  
   Weighted blend of semantic cosine, Jaccard, cluster bonus, and kind weights. Greedy selection sorted by score with:  
   - max outgoing per article (default **8**)  
   - max incoming per article (default **12**)  
   - **one edge per unordered pair** (avoids reciprocal spam / overlinking)

8. **Anchor text**  
   Prefer a target phrase that already appears in the source markdown; else primary keyword; else truncated title.

9. **Apply step**  
   `applyInternalLinksToMarkdown` replaces the first occurrence(s) of anchor text per target (respecting fenced ``` blocks), with `maxLinksPerTarget` (default **2**).

10. **Persistence (optional)**  
    Prisma models: `ArticleKeyword`, `ArticleEmbedding`, `InternalLinkSuggestion` — see `prisma/schema.prisma` and `lib/internal-linking/persist.ts`.

## API routes

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/api/internal-links/suggest` | Body: `{ articles, options? }` → `{ edges, clusters, embeddingModel, usedOpenAI }` |
| `POST` | `/api/internal-links/apply` | Body: `{ markdown, links: [{ toId, anchorText, href }], options? }` → `{ markdown, applied }` |

## Suggested libraries

| Use case | Library / API | Notes |
|----------|----------------|-------|
| **Embeddings (recommended)** | OpenAI `text-embedding-3-small` via REST (`lib/internal-linking/embeddings-openai.ts`) | Strong quality, low cost; add `OPENAI_API_KEY` or `x-openai-key` header. |
| **Embeddings (alt)** | OpenAI `text-embedding-3-large`, Cohere, Voyage AI, Mistral | Swap `fetch` URL/body; keep cosine + same DB schema (`dimensions` column). |
| **Local / offline** | `@xenova/transformers` | Heavier cold start; good for on-prem. |
| **Vector DB** | pgvector + `ORDER BY embedding <=> query` | Replace pairwise loop when you have 10k+ pages; store `vector` as `vector(1536)` instead of JSON. |

## Migration

```bash
npx prisma migrate deploy
# or: npx prisma migrate dev --name internal_linking_engine
```

## Sample code

```ts
import { suggestInternalLinks, applyInternalLinksToMarkdown } from "@/lib/internal-linking";

const articles = [
  {
    id: "a1",
    title: "Best CRM for small teams",
    topic: "CRM software comparison",
    markdown: "# Intro\n\nCRM software helps small teams...",
    keywords: [{ phrase: "crm for small teams", role: "primary" }],
    url: "https://example.com/crm-small-teams",
  },
  // ...
];

const { edges } = await suggestInternalLinks(articles, {
  openaiApiKey: process.env.OPENAI_API_KEY,
});

const fromA1 = edges.filter((e) => e.fromId === "a1");
const { markdown } = applyInternalLinksToMarkdown(articles[0].markdown, fromA1, {
  maxLinksPerTarget: 2,
});
```

## Future upgrades

- **pgvector** nearest-neighbor search for candidate pairs instead of O(n²).  
- **LLM reranker** for anchor placement when the phrase is not in the body.  
- **Site crawl** layer: map `url` from real slugs and canonical URLs.
