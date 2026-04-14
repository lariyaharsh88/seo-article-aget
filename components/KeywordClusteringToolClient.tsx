"use client";

import { useMemo, useState } from "react";

type Cluster = {
  name: string;
  keywords: string[];
};

function parseKeywords(text: string): string[] {
  return text
    .split(/\r?\n|,/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function clustersToText(clusters: Cluster[]): string {
  return clusters
    .map((c) => `${c.name}\n${c.keywords.map((k) => `- ${k}`).join("\n")}`)
    .join("\n\n");
}

function clustersToCsv(clusters: Cluster[]): string {
  const esc = (s: string) => `"${s.replace(/"/g, '""')}"`;
  const lines = ["cluster,keyword"];
  for (const c of clusters) {
    for (const k of c.keywords) lines.push(`${esc(c.name)},${esc(k)}`);
  }
  return `${lines.join("\n")}\n`;
}

export function KeywordClusteringToolClient() {
  const [rawInput, setRawInput] = useState("");
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedKeywords = useMemo(() => parseKeywords(rawInput), [rawInput]);

  async function runClustering() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/keyword-clustering", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keywords: parsedKeywords }),
      });
      const data = (await res.json()) as {
        error?: string;
        clusters?: Cluster[];
      };
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      setClusters(Array.isArray(data.clusters) ? data.clusters : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Clustering failed");
      setClusters([]);
    } finally {
      setLoading(false);
    }
  }

  async function copyClusters() {
    if (clusters.length === 0) return;
    await navigator.clipboard.writeText(clustersToText(clusters));
  }

  function downloadCsv() {
    if (clusters.length === 0) return;
    const blob = new Blob([clustersToCsv(clusters)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "keyword-clusters.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-border bg-surface/70 p-5 md:p-6">
      <h2 className="font-display text-3xl text-text-primary">AI Keyword Clustering Tool</h2>
      <p className="mt-2 max-w-3xl font-serif text-sm text-text-secondary">
        Paste keywords (one per line or comma-separated). The tool groups similar terms into clusters you can
        use for content planning and internal linking.
      </p>

      <label className="mt-4 block">
        <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
          Keywords
        </span>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder="ai seo tools&#10;best ai seo tools&#10;keyword clustering tool&#10;seo keyword grouping"
          className="mt-2 h-44 w-full rounded-lg border border-border bg-background/80 px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-accent"
        />
      </label>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={loading || parsedKeywords.length < 2}
          onClick={() => void runClustering()}
          className="rounded-lg bg-accent px-4 py-2 font-mono text-sm text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Clustering..." : "Cluster Keywords"}
        </button>
        <button
          type="button"
          disabled={clusters.length === 0}
          onClick={() => void copyClusters()}
          className="rounded-lg border border-border px-4 py-2 font-mono text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Copy
        </button>
        <button
          type="button"
          disabled={clusters.length === 0}
          onClick={downloadCsv}
          className="rounded-lg border border-border px-4 py-2 font-mono text-sm text-text-secondary hover:border-accent hover:text-accent disabled:opacity-40"
        >
          Download CSV
        </button>
        <span className="font-mono text-xs text-text-muted">
          {parsedKeywords.length} keywords detected
        </span>
      </div>

      {error ? (
        <p role="alert" className="mt-3 rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 font-mono text-xs text-red-200">
          {error}
        </p>
      ) : null}

      {clusters.length > 0 ? (
        <div className="mt-5 space-y-3">
          {clusters.map((cluster) => (
            <article key={cluster.name} className="rounded-xl border border-border bg-background/70 p-4">
              <h3 className="font-display text-xl text-text-primary">{cluster.name}</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 font-serif text-sm text-text-secondary">
                {cluster.keywords.map((k) => (
                  <li key={`${cluster.name}-${k}`}>{k}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
