"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { StoredEducationNewsListItem } from "@/lib/education-news/stored-types";

type RepurposeProgress = {
  percent: number;
  step: string;
  articleIndex?: number;
  articleTotal?: number;
};

async function consumeRepurposeNdjson(
  response: Response,
  onProgress: (p: RepurposeProgress) => void,
): Promise<void> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("No response body");
  }
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const parts = buf.split("\n");
    buf = parts.pop() ?? "";
    for (const line of parts) {
      if (!line.trim()) continue;
      let e: Record<string, unknown>;
      try {
        e = JSON.parse(line) as Record<string, unknown>;
      } catch {
        throw new Error("Invalid progress stream");
      }
      const t = e.type;
      if (t === "progress") {
        onProgress({
          percent: typeof e.percent === "number" ? e.percent : 0,
          step: typeof e.step === "string" ? e.step : "",
          articleIndex:
            typeof e.articleIndex === "number" ? e.articleIndex : undefined,
          articleTotal:
            typeof e.articleTotal === "number" ? e.articleTotal : undefined,
        });
      } else if (t === "complete") {
        return;
      } else if (t === "error") {
        const msg =
          typeof e.message === "string" ? e.message : "Repurpose failed";
        throw new Error(msg);
      }
    }
  }
  if (buf.trim()) {
    let e: Record<string, unknown>;
    try {
      e = JSON.parse(buf) as Record<string, unknown>;
    } catch {
      throw new Error("Invalid progress stream");
    }
    if (e.type === "error") {
      throw new Error(
        typeof e.message === "string" ? e.message : "Repurpose failed",
      );
    }
    if (e.type !== "complete") {
      throw new Error("Stream ended without completion");
    }
  }
}

type Props = {
  initialItems: StoredEducationNewsListItem[];
  /** Increment when live sitemap refresh succeeds so we re-fetch stored rows. */
  syncKey?: number;
};

/** Pending = not yet successfully repurposed (ready). Repurposed = ready on site. */
type RepurposeListFilter = "pending" | "repurposed";

function rowMatchesFilter(
  row: StoredEducationNewsListItem,
  filter: RepurposeListFilter,
): boolean {
  const ready = row.repurposeStatus === "ready";
  return filter === "repurposed" ? ready : !ready;
}

export function StoredRepurposePanel({ initialItems, syncKey = 0 }: Props) {
  const [items, setItems] = useState(initialItems);
  const [listFilter, setListFilter] = useState<RepurposeListFilter>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [batchBusy, setBatchBusy] = useState(false);
  const [detail, setDetail] = useState<{
    title: string;
    markdown: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repurposeProgress, setRepurposeProgress] =
    useState<RepurposeProgress | null>(null);

  const refreshList = useCallback(async () => {
    try {
      const res = await fetch("/api/education-news/stored", { cache: "no-store" });
      const data = (await res.json()) as {
        items?: StoredEducationNewsListItem[];
      };
      if (res.ok && Array.isArray(data.items)) {
        setItems(data.items);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    if (syncKey > 0) void refreshList();
  }, [syncKey, refreshList]);

  const filteredItems = items.filter((row) => rowMatchesFilter(row, listFilter));

  const repurposeOne = useCallback(
    async (id: string) => {
      setError(null);
      setRepurposeProgress(null);
      setBusyId(id);
      try {
        const res = await fetch("/api/education-news/repurpose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, stream: true }),
        });
        const ct = res.headers.get("content-type") ?? "";
        if (res.ok && ct.includes("ndjson")) {
          await consumeRepurposeNdjson(res, setRepurposeProgress);
        } else {
          const data: unknown = await res.json();
          if (!res.ok) {
            const msg =
              typeof data === "object" &&
              data !== null &&
              "error" in data &&
              typeof (data as { error: unknown }).error === "string"
                ? (data as { error: string }).error
                : `HTTP ${res.status}`;
            throw new Error(msg);
          }
        }
        await refreshList();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Repurpose failed");
      } finally {
        setBusyId(null);
        setRepurposeProgress(null);
      }
    },
    [refreshList],
  );

  const repurposePending = useCallback(async () => {
    setError(null);
    setRepurposeProgress(null);
    setBatchBusy(true);
    try {
      const res = await fetch("/api/education-news/repurpose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ processPending: true, limit: 5, stream: true }),
      });
      const ct = res.headers.get("content-type") ?? "";
      if (res.ok && ct.includes("ndjson")) {
        await consumeRepurposeNdjson(res, setRepurposeProgress);
      } else {
        const data: unknown = await res.json();
        if (!res.ok) {
          const msg =
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
              ? (data as { error: string }).error
              : `HTTP ${res.status}`;
          throw new Error(msg);
        }
      }
      await refreshList();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Batch repurpose failed");
    } finally {
      setBatchBusy(false);
      setRepurposeProgress(null);
    }
  }, [refreshList]);

  const openDetail = useCallback(async (id: string, title: string) => {
    setError(null);
    try {
      const res = await fetch(
        `/api/education-news/stored?id=${encodeURIComponent(id)}`,
        { cache: "no-store" },
      );
      const row = (await res.json()) as {
        repurposedMarkdown?: string | null;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(row.error || `HTTP ${res.status}`);
      }
      const md = row.repurposedMarkdown?.trim() ?? "";
      if (!md) {
        setError("No repurposed draft yet — run Repurpose first.");
        return;
      }
      setDetail({ title, markdown: md });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Load failed");
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className="mt-12 rounded-xl border border-border bg-surface/40 p-6 text-center font-serif text-sm text-text-muted">
        <p className="font-mono text-xs uppercase tracking-wide text-accent">
          Saved to database
        </p>
        <p className="mt-2">
          When the database is connected, today&apos;s sitemap rows sync here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-14 border-t border-border pt-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-wide text-accent">
            Saved &amp; AI repurposed
          </p>
          <h2 className="mt-1 font-display text-xl text-text-primary md:text-2xl">
            Database copy + SEO drafts
          </h2>
          <p className="mt-2 max-w-2xl font-serif text-sm text-text-secondary">
            Each sitemap item is upserted to Postgres. Use{" "}
            <strong className="text-text-primary">Repurpose</strong> to rewrite in the same
            RankFlowHQ / seo-agent style, capped at{" "}
            <strong className="text-text-primary">800–1000 words</strong> (Gemini → OpenRouter → Groq fallback, server keys).
            Ready drafts get a stable URL under{" "}
            <Link href="/news" className="text-accent underline-offset-2 hover:underline">
              /news/
            </Link>{" "}
            with slug and canonical URL stored in the database.             Rows are listed{" "}
            <strong className="text-text-primary">newest first</strong> by database{" "}
            <span className="font-mono text-text-muted">updatedAt</span> (sitemap sync,
            repurpose, or any row change). New rows from sync are{" "}
            <strong className="text-text-primary">repurposed automatically</strong> up
            to the configured limit when <span className="font-mono text-text-muted">GEMINI_API_KEY</span>{" "}
            is set (see <span className="font-mono text-text-muted">.env.example</span>).
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div
            role="group"
            aria-label="Filter by repurpose status"
            className="flex flex-wrap items-center gap-1.5 sm:justify-end"
          >
            <span className="mr-1 font-mono text-[10px] uppercase tracking-wide text-text-muted">
              Show
            </span>
            <button
              type="button"
              onClick={() => setListFilter("pending")}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                listFilter === "pending"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border text-text-secondary hover:border-accent/50 hover:text-text-primary"
              }`}
            >
              Pending
            </button>
            <button
              type="button"
              onClick={() => setListFilter("repurposed")}
              className={`rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors ${
                listFilter === "repurposed"
                  ? "border-accent bg-accent/20 text-accent"
                  : "border-border text-text-secondary hover:border-accent/50 hover:text-text-primary"
              }`}
            >
              Repurposed
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void refreshList()}
              className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
            >
              Refresh list
            </button>
            <button
              type="button"
              disabled={batchBusy}
              onClick={() => void repurposePending()}
              className="rounded-lg border border-accent bg-accent/15 px-3 py-2 font-mono text-xs text-accent hover:bg-accent/25 disabled:opacity-40"
            >
              {batchBusy ? "Running AI…" : "Repurpose next pending (×5)"}
            </button>
          </div>
        </div>
      </div>

      {repurposeProgress ? (
        <div
          className="mb-4 rounded-lg border border-border bg-background/80 px-3 py-3"
          aria-live="polite"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 font-mono text-xs text-text-secondary">
            <span className="text-text-primary">
              {repurposeProgress.articleTotal != null &&
              repurposeProgress.articleIndex != null
                ? `Article ${repurposeProgress.articleIndex}/${repurposeProgress.articleTotal} · `
                : null}
              {repurposeProgress.step}
            </span>
            <span className="tabular-nums text-accent">
              {Math.min(100, Math.max(0, repurposeProgress.percent))}%
            </span>
          </div>
          <div
            className="mt-2 h-1.5 overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={repurposeProgress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
              style={{
                width: `${Math.min(100, Math.max(0, repurposeProgress.percent))}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-200"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[820px] border-collapse text-left font-mono text-[11px] sm:text-xs">
          <thead className="border-b border-border bg-background/80 text-text-muted">
            <tr>
              <th className="px-3 py-2 font-normal">Title</th>
              <th className="px-3 py-2 font-normal">Source</th>
              <th className="px-3 py-2 font-normal" title="Most recently touched rows first">
                Updated ↓
              </th>
              <th className="px-3 py-2 font-normal">Status</th>
              <th className="px-3 py-2 font-normal">On site</th>
              <th className="px-3 py-2 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center font-serif text-sm text-text-muted"
                >
                  {listFilter === "pending"
                    ? "No pending rows in the latest 50 updates. Switch to Repurposed or refresh after sync."
                    : "No repurposed (ready) rows in the latest 50 updates. Switch to Pending or run Repurpose."}
                </td>
              </tr>
            ) : null}
            {filteredItems.map((row) => (
              <tr key={row.id} className="border-b border-border/80 last:border-0">
                <td className="max-w-[220px] px-3 py-2 align-top text-text-primary">
                  <span className="line-clamp-2" title={row.title}>
                    {row.title}
                  </span>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-text-secondary">
                  {row.source}
                </td>
                <td className="whitespace-nowrap px-3 py-2 align-top text-[10px] text-text-muted sm:text-[11px]">
                  {new Date(row.updatedAt).toLocaleString("en-IN", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-text-muted">
                  {row.repurposeStatus}
                  {row.repurposedAt ? (
                    <span className="ml-1 block text-[10px] text-text-muted/80">
                      {new Date(row.repurposedAt).toLocaleString("en-IN")}
                    </span>
                  ) : null}
                </td>
                <td className="max-w-[140px] px-3 py-2 align-top text-[10px] text-text-secondary">
                  {row.repurposedPath ? (
                    <Link
                      href={row.repurposedPath}
                      className="line-clamp-2 break-all text-accent underline-offset-2 hover:underline"
                      title={
                        row.repurposedCanonicalUrl ??
                        `Open ${row.repurposedPath} on this site`
                      }
                    >
                      {row.repurposedPath}
                    </Link>
                  ) : (
                    <span className="text-text-muted/70">—</span>
                  )}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      disabled={busyId === row.id}
                      onClick={() => void repurposeOne(row.id)}
                      className="rounded border border-border px-2 py-1 text-accent hover:bg-accent/10 disabled:opacity-40"
                    >
                      {busyId === row.id ? "…" : "Repurpose"}
                    </button>
                    <button
                      type="button"
                      onClick={() => void openDetail(row.id, row.title)}
                      className="rounded border border-border px-2 py-1 text-text-secondary hover:border-accent/40"
                    >
                      View draft
                    </button>
                    <a
                      href={row.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-border px-2 py-1 text-text-muted hover:text-accent"
                    >
                      Original
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {detail ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="draft-title"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 id="draft-title" className="font-display text-lg text-text-primary">
                {detail.title}
              </h3>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="rounded-lg px-2 py-1 font-mono text-xs text-text-muted hover:bg-background hover:text-text-primary"
              >
                Close
              </button>
            </div>
            <div className="custom-scrollbar max-h-[min(70vh,28rem)] overflow-y-auto p-4">
              <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-text-secondary">
                {detail.markdown}
              </pre>
            </div>
            <div className="border-t border-border px-4 py-2">
              <button
                type="button"
                onClick={() =>
                  void navigator.clipboard.writeText(detail.markdown)
                }
                className="rounded-lg border border-accent/40 px-3 py-1.5 font-mono text-xs text-accent hover:bg-accent/10"
              >
                Copy markdown
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
