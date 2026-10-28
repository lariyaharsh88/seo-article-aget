"use client";

import Link from "next/link";
import { useState } from "react";
import { Card, CopyButton, btnCls, inputCls, labelCls } from "@/components/free-tools/ui";
import { outlineToMarkdown, type Outline } from "@/lib/free-tools/outline-format";

export function OutlineGeneratorTool() {
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [outline, setOutline] = useState<Outline | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/free-tools/outline?keyword=${encodeURIComponent(keyword.trim())}`);
      const data = (await res.json()) as Outline & { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setOutline(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const md = outline ? outlineToMarkdown(outline) : "";

  return (
    <div className="space-y-4">
      <Card>
        <form
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          onSubmit={(e) => {
            e.preventDefault();
            void run();
          }}
        >
          <label className="block flex-1">
            <span className={labelCls}>Keyword</span>
            <input className={`${inputCls} mt-1`} value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g. intermittent fasting" required minLength={2} maxLength={80} />
          </label>
          <button type="submit" className={btnCls} disabled={loading || keyword.trim().length < 2}>
            {loading ? "Building outline…" : "Generate outline"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </Card>

      {outline ? (
        <>
          <Card>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg text-text-primary">{outline.title}</h2>
              <CopyButton text={md} label="Copy as Markdown" />
            </div>
            <ol className="mt-4 space-y-3">
              {outline.sections.map((s) => (
                <li key={s.h2}>
                  <p className="text-sm font-semibold text-text-primary">H2 · {s.h2}</p>
                  {s.h3.length ? (
                    <ul className="mt-1 space-y-0.5 pl-4">
                      {s.h3.map((h) => (
                        <li key={h} className="text-sm text-text-secondary">
                          H3 · {h}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ))}
            </ol>
            {outline.faqs.length ? (
              <>
                <p className="mt-5 text-sm font-semibold text-text-primary">FAQ — questions people search</p>
                <ul className="mt-1 space-y-0.5 pl-4">
                  {outline.faqs.map((q) => (
                    <li key={q} className="text-sm text-text-secondary">
                      {q}
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </Card>
          {outline.related.length ? (
            <Card>
              <h2 className="font-display text-lg text-text-primary">Related searches to cover</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {outline.related.map((r) => (
                  <li key={r} className="rounded-full border border-border px-3 py-1 text-xs text-text-secondary">
                    {r}
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
          <Card className="border-accent/40 bg-accent/5">
            <p className="text-sm text-text-primary">Turn this outline into a researched, ready-to-publish article in a few minutes.</p>
            <Link href={`/seo-agent?keyword=${encodeURIComponent(outline.keyword)}`} className={`${btnCls} mt-3`}>
              Write this article →
            </Link>
          </Card>
        </>
      ) : null}
    </div>
  );
}
