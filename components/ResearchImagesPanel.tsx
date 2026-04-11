"use client";

import { useCallback, useState } from "react";
import {
  appendResearchImagesSection,
  spreadResearchImagesAfterHeadings,
} from "@/lib/research-images";
import type { ResearchImageAsset } from "@/lib/types";

interface ResearchImagesPanelProps {
  topic: string;
  audience: string;
  researchContext: string;
  article: string;
  /** When true, inserts are blocked (e.g. while the article is still streaming). */
  disableArticleMutation?: boolean;
  onApplyArticle: (next: string) => void;
  onRemountEditor: () => void;
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

export function ResearchImagesPanel({
  topic,
  audience,
  researchContext,
  article,
  disableArticleMutation,
  onApplyArticle,
  onRemountEditor,
}: ResearchImagesPanelProps) {
  const [count, setCount] = useState(4);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<ResearchImageAsset[]>([]);
  const [selected, setSelected] = useState<Record<number, boolean>>({});

  const hasContext = researchContext.trim().length > 0;

  const toggle = useCallback((i: number) => {
    setSelected((prev) => ({ ...prev, [i]: !prev[i] }));
  }, []);

  const generate = useCallback(async () => {
    if (!hasContext) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/research-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim() || "Article",
          audience,
          researchContext,
          count,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          isRecord(data) && typeof data.error === "string"
            ? data.error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      const list =
        isRecord(data) && Array.isArray(data.images)
          ? data.images.filter(
              (x): x is ResearchImageAsset =>
                typeof x === "object" &&
                x !== null &&
                typeof (x as ResearchImageAsset).url === "string" &&
                typeof (x as ResearchImageAsset).dataPoint === "string" &&
                typeof (x as ResearchImageAsset).alt === "string" &&
                typeof (x as ResearchImageAsset).insight === "string" &&
                typeof (x as ResearchImageAsset).templateLabel === "string",
            )
          : [];
      setAssets(list);
      const sel: Record<number, boolean> = {};
      list.forEach((_, i) => {
        sel[i] = true;
      });
      setSelected(sel);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
      setAssets([]);
    } finally {
      setLoading(false);
    }
  }, [audience, count, hasContext, researchContext, topic]);

  const picked = assets.filter((_, i) => selected[i] !== false);

  const insertAppend = useCallback(() => {
    if (picked.length === 0) return;
    const next = appendResearchImagesSection(article, picked);
    onApplyArticle(next);
    onRemountEditor();
  }, [article, onApplyArticle, onRemountEditor, picked]);

  const insertSpread = useCallback(() => {
    if (picked.length === 0) return;
    const next = spreadResearchImagesAfterHeadings(article, picked);
    onApplyArticle(next);
    onRemountEditor();
  }, [article, onApplyArticle, onRemountEditor, picked]);

  return (
    <div className="mb-4 space-y-3 rounded-lg border border-border bg-background/40 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
          Data infographics (SVG — no chart API)
        </span>
        <label className="flex items-center gap-1.5 font-mono text-xs text-text-secondary">
          Max
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            disabled={loading}
            className="rounded border border-border bg-surface px-2 py-1 text-text-primary"
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => void generate()}
          disabled={loading || !hasContext}
          className="rounded-lg border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Building…" : "Build infographics from numbers"}
        </button>
      </div>
      {!hasContext && (
        <p className="font-mono text-xs text-text-muted">
          Run the pipeline through the research step. Numbers in the notes are
          turned into SVG infographic layouts (comparison, stat strip, grid) —
          no external chart API and no AI image model.
        </p>
      )}
      {error && (
        <p className="font-mono text-xs text-red-300" role="alert">
          {error}
        </p>
      )}
      {assets.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={insertAppend}
              disabled={picked.length === 0 || disableArticleMutation}
              className="rounded-lg bg-accent px-3 py-1.5 font-mono text-xs font-semibold text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Insert section (end of article)
            </button>
            <button
              type="button"
              onClick={insertSpread}
              disabled={picked.length === 0 || disableArticleMutation}
              className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
            >
              Spread after ## headings
            </button>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2">
            {assets.map((a, i) => (
              <li
                key={`${a.url}-${i}`}
                className="overflow-hidden rounded-lg border border-border bg-surface/60"
              >
                <label className="flex cursor-pointer gap-2 p-2 font-mono text-[10px] text-text-muted">
                  <input
                    type="checkbox"
                    checked={selected[i] !== false}
                    onChange={() => toggle(i)}
                    className="mt-0.5"
                  />
                  Include in article
                </label>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={a.url}
                  alt={a.alt}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
                <div className="space-y-1 p-3">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
                    Data point
                  </p>
                  <p className="font-serif text-xs text-text-secondary">
                    {a.dataPoint}
                  </p>
                  <p className="font-serif text-sm text-text-primary">{a.alt}</p>
                  <p className="font-serif text-xs italic text-text-secondary">
                    {a.insight}
                  </p>
                  <p className="font-mono text-[10px] text-text-muted">
                    {a.templateLabel}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
