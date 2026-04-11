import { geminiText } from "@/lib/gemini";
import { fetchArticlePlainText } from "@/lib/education-news/fetch-article-text";
import { buildEducationNewsRepurposePrompt } from "@/lib/education-news/repurpose-prompt";
import { prisma } from "@/lib/prisma";

export async function runRepurposeForArticleId(
  id: string,
  geminiKey: string,
): Promise<void> {
  const row = await prisma.educationNewsArticle.findUnique({ where: { id } });
  if (!row) {
    throw new Error("Article not found");
  }

  await prisma.educationNewsArticle.update({
    where: { id },
    data: { repurposeStatus: "processing", errorMessage: null },
  });

  try {
    let plain = row.rawArticleText;
    if (!plain?.trim()) {
      plain = await fetchArticlePlainText(row.url);
      await prisma.educationNewsArticle.update({
        where: { id },
        data: {
          rawArticleText: plain,
          rawFetchedAt: plain ? new Date() : null,
        },
      });
    }

    const prompt = buildEducationNewsRepurposePrompt({
      title: row.title,
      source: row.source,
      originalUrl: row.url,
      plainTextFromPage: plain,
    });

    const md = (
      await geminiText(prompt, geminiKey, {
        temperature: 0.55,
        maxOutputTokens: 4096,
      })
    ).trim();

    if (md.length < 200) {
      throw new Error("Model returned too little text");
    }

    await prisma.educationNewsArticle.update({
      where: { id },
      data: {
        repurposedMarkdown: md,
        repurposedAt: new Date(),
        repurposeStatus: "ready",
        errorMessage: null,
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message.slice(0, 2000) : "Repurpose failed";
    await prisma.educationNewsArticle.update({
      where: { id },
      data: {
        repurposeStatus: "error",
        errorMessage: msg,
      },
    });
    throw e;
  }
}

/** Process up to `limit` rows stuck in pending/error (FIFO by updatedAt). */
export async function runRepurposePending(
  geminiKey: string,
  limit: number,
): Promise<{ processed: number; ids: string[] }> {
  const rows = await prisma.educationNewsArticle.findMany({
    where: { repurposeStatus: { in: ["pending", "error"] } },
    orderBy: { updatedAt: "asc" },
    take: Math.min(Math.max(limit, 1), 5),
    select: { id: true },
  });

  const ids: string[] = [];
  for (const r of rows) {
    await runRepurposeForArticleId(r.id, geminiKey);
    ids.push(r.id);
  }
  return { processed: ids.length, ids };
}
