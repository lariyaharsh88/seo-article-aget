import { InternalLinkKind, KeywordRole, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function toKeywordRole(role?: string): KeywordRole {
  if (role === "primary" || role === "supporting") return role;
  return KeywordRole.secondary;
}

/** Replace keywords for an article (full sync). */
export async function replaceArticleKeywords(
  articleId: string,
  keywords: { phrase: string; role?: string }[],
): Promise<void> {
  await prisma.articleKeyword.deleteMany({ where: { articleId } });
  if (keywords.length === 0) return;
  await prisma.articleKeyword.createMany({
    data: keywords.map((k) => ({
      articleId,
      phrase: k.phrase.trim(),
      role: toKeywordRole(k.role),
    })),
  });
}

/** Upsert cached embedding after an OpenAI (or other) embed call. */
export async function upsertArticleEmbedding(
  articleId: string,
  model: string,
  vector: number[],
): Promise<void> {
  await prisma.articleEmbedding.upsert({
    where: { articleId },
    create: {
      articleId,
      model,
      dimensions: vector.length,
      vector: vector as unknown as Prisma.InputJsonValue,
    },
    update: {
      model,
      dimensions: vector.length,
      vector: vector as unknown as Prisma.InputJsonValue,
    },
  });
}

/** Replace all stored suggestions touching these article ids (simple approach: delete by user scope optional). */
export async function replaceInternalLinkSuggestionsForArticles(
  articleIds: string[],
  edges: {
    fromId: string;
    toId: string;
    score: number;
    anchorText: string;
    kind: InternalLinkKind | "same_cluster" | "supporting_keyword" | "parent_child" | "semantic";
    rationale?: string;
  }[],
): Promise<void> {
  await prisma.internalLinkSuggestion.deleteMany({
    where: {
      OR: [{ fromArticleId: { in: articleIds } }, { toArticleId: { in: articleIds } }],
    },
  });
  if (edges.length === 0) return;
  await prisma.internalLinkSuggestion.createMany({
    data: edges.map((e) => ({
      fromArticleId: e.fromId,
      toArticleId: e.toId,
      score: e.score,
      anchorText: e.anchorText,
      kind: e.kind,
      rationale: e.rationale ?? null,
    })),
  });
}
