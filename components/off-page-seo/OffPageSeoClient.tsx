"use client";

import { useCallback, useMemo, useState } from "react";
import type { BacklinkOpportunity } from "@/lib/off-page-seo/types";

function downloadCsv(rows: BacklinkOpportunity[]) {
  const headers = [
    "domain",
    "type",
    "estimated_da",
    "traffic_estimate",
    "spam_score",
    "contact_email",
    "contact_page",
    "estimated_price",
    "priority_score",
    "category",
    "action",
  ];
  const esc = (s: string | number | null | undefined) => {
    const v = s == null ? "" : String(s);
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
  };
  const lines = [
    headers.join(","),
    ...rows.map((r) =>
      [
        r.domain,
        r.type,
        r.estimated_da,
        r.traffic_estimate,
        r.spam_score,
        r.contact_email ?? "",
        r.contact_page ?? "",
        r.estimated_price,
        r.priority_score,
        r.category,
        r.action,
      ]
        .map(esc)
        .join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `off-page-seo-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export function OffPageSeoClient() {
  const [domain, setDomain] = useState("");
  const [country, setCountry] = useState("India");
  const [niche, setNiche] = useState("Education");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<{
    serper_queries_run: number;
    domains_discovered: number;
    domains_enriched: number;
    note: string;
  } | null>(null);
  const [rows, setRows] = useState<BacklinkOpportunity[]>([]);

  const [minDa, setMinDa] = useState(0);
  const [maxPriceBand, setMaxPriceBand] = useState<"all" | "low" | "mid" | "high">(
    "all",
  );
  const [onlyEmail, setOnlyEmail] = useState(false);

  const run = useCallback(async () => {
    if (!domain.trim()) {
      setError("Enter a domain.");
      return;
    }
    setLoading(true);
    setError(null);
    setMeta(null);
    setRows([]);
    try {
      const res = await fetch("/api/off-page-seo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          domain: domain.trim(),
          country: country.trim() || "India",
          niche: niche.trim() || "General",
        }),
      });
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
      const op =
        typeof data === "object" &&
        data !== null &&
        "opportunities" in data &&
        Array.isArray((data as { opportunities: unknown }).opportunities)
          ? (data as { opportunities: BacklinkOpportunity[] }).opportunities
          : [];
      const m =
        typeof data === "object" && data !== null && "meta" in data
          ? (data as { meta: typeof meta }).meta
          : null;
      setRows(op);
      setMeta(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [domain, country, niche]);

  const filtered = useMemo(() => {
    let list = rows;
    if (onlyEmail) list = list.filter((r) => r.contact_email);
    list = list.filter((r) => r.estimated_da >= minDa);
    if (maxPriceBand === "low") {
      list = list.filter((r) => r.estimated_da < 20);
    } else if (maxPriceBand === "mid") {
      list = list.filter((r) => r.estimated_da >= 20 && r.estimated_da < 40);
    } else if (maxPriceBand === "high") {
      list = list.filter((r) => r.estimated_da >= 40);
    }
    return list;
  }, [rows, minDa, maxPriceBand, onlyEmail]);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-border bg-surface/80 p-6">
        <h2 className="font-display text-xl text-text-primary">Run prospecting</h2>
        <p className="mt-2 font-serif text-sm text-text-secondary">
          Discovers relevant sites, estimates authority, fetches public contacts,
          prices in INR bands, then ranks targets using smart prioritization.
        </p>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <label className="block font-mono text-xs text-text-muted">
            Domain
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary"
            />
          </label>
          <label className="block font-mono text-xs text-text-muted">
            Country
            <input
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary"
            />
          </label>
          <label className="block font-mono text-xs text-text-muted">
            Niche
            <input
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary"
            />
          </label>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-semibold text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {loading ? "Running (can take 1–2 min)…" : "Generate outreach list"}
          </button>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={() => downloadCsv(filtered)}
              className="rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
            >
              Export CSV
            </button>
          )}
        </div>
        {error && (
          <p className="mt-4 font-mono text-sm text-red-300" role="alert">
            {error}
          </p>
        )}
        {meta && (
          <p className="mt-4 font-mono text-[11px] leading-relaxed text-text-muted">
            Queries: {meta.serper_queries_run} · Discovered: {meta.domains_discovered}{" "}
            · Enriched: {meta.domains_enriched}. {meta.note}
          </p>
        )}
      </section>

      {rows.length > 0 && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-end gap-4">
            <label className="font-mono text-xs text-text-muted">
              Min est. DA
              <input
                type="number"
                min={0}
                max={100}
                value={minDa}
                onChange={(e) => setMinDa(Number(e.target.value) || 0)}
                className="ml-2 w-20 rounded border border-border bg-background px-2 py-1 font-mono text-sm"
              />
            </label>
            <label className="font-mono text-xs text-text-muted">
              Price / authority band
              <select
                value={maxPriceBand}
                onChange={(e) =>
                  setMaxPriceBand(e.target.value as typeof maxPriceBand)
                }
                className="ml-2 rounded border border-border bg-background px-2 py-1 font-mono text-sm"
              >
                <option value="all">All</option>
                <option value="low">DA &lt; 20 (lower ₹)</option>
                <option value="mid">DA 20–40</option>
                <option value="high">DA 40+</option>
              </select>
            </label>
            <label className="flex cursor-pointer items-center gap-2 font-mono text-xs text-text-muted">
              <input
                type="checkbox"
                checked={onlyEmail}
                onChange={(e) => setOnlyEmail(e.target.checked)}
              />
              Only rows with email
            </label>
            <span className="font-mono text-xs text-text-muted">
              Showing {filtered.length} of {rows.length}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[960px] border-collapse text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-border bg-background/80">
                  <th className="p-3 font-semibold text-text-secondary">Priority</th>
                  <th className="p-3 font-semibold text-text-secondary">Domain</th>
                  <th className="p-3 font-semibold text-text-secondary">DA*</th>
                  <th className="p-3 font-semibold text-text-secondary">Traffic*</th>
                  <th className="p-3 font-semibold text-text-secondary">Spam*</th>
                  <th className="p-3 font-semibold text-text-secondary">Email</th>
                  <th className="p-3 font-semibold text-text-secondary">Price (est.)</th>
                  <th className="p-3 font-semibold text-text-secondary">Category</th>
                  <th className="p-3 font-semibold text-text-secondary">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr
                    key={r.domain}
                    className="border-b border-border/60 hover:bg-background/40"
                  >
                    <td className="p-3 tabular-nums text-accent">{r.priority_score}</td>
                    <td className="p-3 text-text-primary">{r.domain}</td>
                    <td className="p-3 tabular-nums">{r.estimated_da}</td>
                    <td className="max-w-[140px] p-3 text-text-secondary">
                      {r.traffic_estimate}
                    </td>
                    <td className="p-3 tabular-nums">{r.spam_score}</td>
                    <td className="max-w-[200px] break-all p-3 text-text-secondary">
                      {r.contact_email ?? "—"}
                    </td>
                    <td className="p-3 text-text-secondary">{r.estimated_price}</td>
                    <td className="max-w-[160px] p-3 text-text-secondary">{r.category}</td>
                    <td className="max-w-[280px] p-3 text-text-muted">{r.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="font-mono text-[10px] text-text-muted">
            *DA, traffic, spam, and prices are modeled estimates unless you plug in Moz/Ahrefs
            or similar. Always verify contacts and site quality before paying or linking.
          </p>
        </section>
      )}
    </div>
  );
}
