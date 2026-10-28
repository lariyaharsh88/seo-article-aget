"use client";

import { useState } from "react";
import { Card, StatusPill, btnCls, inputCls, labelCls } from "@/components/free-tools/ui";
import type { OnPageReport } from "@/lib/free-tools/on-page";

export function OnPageCheckerTool() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<OnPageReport | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const res = await fetch(`/api/free-tools/on-page?url=${encodeURIComponent(url.trim())}`);
      const data = (await res.json()) as OnPageReport & { error?: string };
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const order = { fail: 0, warn: 1, pass: 2 } as const;
  const checks = report ? [...report.checks].sort((a, b) => order[a.status] - order[b.status]) : [];
  const scoreColor = !report ? "" : report.score >= 80 ? "text-emerald-400" : report.score >= 60 ? "text-amber-400" : "text-red-400";

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
            <span className={labelCls}>Page URL</span>
            <input className={`${inputCls} mt-1`} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com/blog/my-post" required />
          </label>
          <button type="submit" className={btnCls} disabled={loading || !url.trim()}>
            {loading ? "Checking…" : "Check page"}
          </button>
        </form>
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </Card>

      {report ? (
        <>
          <Card>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-sm text-text-muted">On-page SEO score</p>
                <p className={`font-display text-5xl ${scoreColor}`}>
                  {report.score}
                  <span className="text-xl text-text-muted">/100</span>
                </p>
              </div>
              <p className="max-w-md break-all text-xs text-text-muted">{report.finalUrl}</p>
            </div>
            <ul className="mt-5 space-y-2">
              {checks.map((c) => (
                <li key={c.id} className="flex items-start gap-3 rounded-lg border border-border px-3 py-2.5">
                  <StatusPill status={c.status} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-text-primary">{c.label}</p>
                    <p className="break-words text-sm text-text-secondary">{c.detail}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <h2 className="font-display text-lg text-text-primary">What Google sees</h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="text-text-muted">Title</dt>
                <dd className="text-text-primary">{report.title || "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Meta description</dt>
                <dd className="text-text-primary">{report.description || "—"}</dd>
              </div>
              <div>
                <dt className="text-text-muted">Headings</dt>
                <dd className="text-text-secondary">
                  {report.h1.map((h) => (
                    <p key={`h1-${h}`}>
                      <span className="font-semibold text-text-primary">H1</span> {h}
                    </p>
                  ))}
                  {report.h2.map((h, i) => (
                    <p key={`h2-${i}`}>
                      <span className="text-text-muted">H2</span> {h}
                    </p>
                  ))}
                </dd>
              </div>
            </dl>
          </Card>
        </>
      ) : null}
    </div>
  );
}
