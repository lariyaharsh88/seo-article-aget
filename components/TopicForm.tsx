"use client";

import type { GscQueryRow } from "@/lib/gsc-queries";
import type { PipelineInput } from "@/lib/types";

interface TopicFormProps {
  value: PipelineInput;
  onChange: (v: PipelineInput) => void;
  disabled?: boolean;
  gscRows: GscQueryRow[];
  googleSuggestions: string[];
  onFetchSearchConsole: () => void;
  onFetchGoogleSuggestions: () => void;
  loadingGsc: boolean;
  loadingSuggest: boolean;
  gscError: string | null;
  suggestError: string | null;
  searchConsoleConfigured: boolean;
}

export function TopicForm({
  value,
  onChange,
  disabled,
  gscRows,
  googleSuggestions,
  onFetchSearchConsole,
  onFetchGoogleSuggestions,
  loadingGsc,
  loadingSuggest,
  gscError,
  suggestError,
  searchConsoleConfigured,
}: TopicFormProps) {
  return (
    <div className="space-y-4">
      <fieldset
        disabled={disabled}
        className="grid gap-4 rounded-xl border border-border bg-surface/80 p-4 backdrop-blur"
      >
        <legend className="font-mono text-sm uppercase text-accent">
          Brief
        </legend>
        <label className="flex flex-col gap-2 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Topic / title idea</span>
          <textarea
            value={value.topic}
            onChange={(e) => onChange({ ...value, topic: e.target.value })}
            rows={4}
            placeholder="e.g. Sustainable packaging for D2C skincare brands"
            className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-base text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">
            Reference page URL{" "}
            <span className="font-normal text-text-muted">(optional)</span>
          </span>
          <input
            type="url"
            value={value.sourceUrl}
            onChange={(e) => onChange({ ...value, sourceUrl: e.target.value })}
            placeholder="https://yoursite.com/blog/your-post"
            className="rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            autoComplete="url"
          />
          <span className="font-serif text-xs text-text-muted">
            Used for research context and to filter Search Console queries to this
            page when you fetch GSC data.
          </span>
        </label>
        <label className="flex flex-col gap-2 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">
            Primary keyword{" "}
            <span className="font-normal text-text-muted">(for autocomplete)</span>
          </span>
          <input
            type="text"
            value={value.primaryKeyword}
            onChange={(e) =>
              onChange({ ...value, primaryKeyword: e.target.value })
            }
            placeholder="e.g. sustainable packaging skincare — or leave blank to use first line of topic"
            className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Audience</span>
          <input
            type="text"
            value={value.audience}
            onChange={(e) => onChange({ ...value, audience: e.target.value })}
            placeholder="e.g. ecommerce operators, founders, SEOs"
            className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </label>
        <label className="flex flex-col gap-2 text-sm text-text-secondary">
          <span className="font-medium text-text-primary">Search intent</span>
          <select
            value={value.intent}
            onChange={(e) =>
              onChange({
                ...value,
                intent: e.target.value as PipelineInput["intent"],
              })
            }
            className="rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="informational">Informational</option>
            <option value="commercial">Commercial</option>
            <option value="transactional">Transactional</option>
            <option value="navigational">Navigational</option>
          </select>
        </label>
      </fieldset>

      <fieldset
        disabled={disabled}
        className="rounded-xl border border-border bg-surface/80 p-4 backdrop-blur"
      >
        <legend className="font-mono text-sm uppercase text-accent">
          Search signals
        </legend>
        <p className="mb-4 font-serif text-sm text-text-secondary">
          Pull real queries from Search Console (service account JSON +{" "}
          <code className="font-mono text-xs text-text-muted">GSC_SITE_URL</code>{" "}
          in env) and Google&apos;s autocomplete for the primary keyword.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
          <button
            type="button"
            onClick={() => onFetchSearchConsole()}
            disabled={disabled || loadingGsc || !searchConsoleConfigured}
            className="rounded-lg border border-border bg-background/80 px-4 py-2 font-mono text-xs text-text-primary transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingGsc ? "Loading GSC…" : "Fetch Search Console queries"}
          </button>
          <button
            type="button"
            onClick={() => onFetchGoogleSuggestions()}
            disabled={disabled || loadingSuggest}
            className="rounded-lg border border-accent/50 bg-accent/10 px-4 py-2 font-mono text-xs text-accent transition-colors hover:bg-accent/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loadingSuggest ? "Loading suggestions…" : "Fetch Google suggestions"}
          </button>
        </div>

        {!searchConsoleConfigured ? (
          <p className="mt-3 font-mono text-xs text-text-muted">
            Search Console is not configured. Add{" "}
            <code className="text-text-secondary">GSC_SITE_URL</code> and{" "}
            <code className="text-text-secondary">GSC_SERVICE_ACCOUNT_JSON</code>{" "}
            (or OAuth vars). Grant the service account access in Search Console.
          </p>
        ) : null}

        {gscError ? (
          <p className="mt-3 font-mono text-xs text-red-400" role="alert">
            {gscError}
          </p>
        ) : null}
        {suggestError ? (
          <p className="mt-3 font-mono text-xs text-red-400" role="alert">
            {suggestError}
          </p>
        ) : null}

        {gscRows.length > 0 ? (
          <div className="mt-4 rounded-lg border border-border bg-background/40 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase text-text-muted">
              Search Console ({gscRows.length} queries)
            </p>
            <ul className="max-h-36 space-y-1 overflow-y-auto font-mono text-[11px] text-text-secondary custom-scrollbar">
              {gscRows.slice(0, 25).map((row) => (
                <li key={row.query} className="flex justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate">{row.query}</span>
                  <span className="shrink-0 text-text-muted">
                    {row.clicks} clk · {Math.round(row.impressions)} impr
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {googleSuggestions.length > 0 ? (
          <div className="mt-4 rounded-lg border border-accent/25 bg-accent/5 p-3">
            <p className="mb-2 font-mono text-[10px] uppercase text-accent">
              Google autocomplete ({googleSuggestions.length})
            </p>
            <ul className="max-h-36 space-y-1 overflow-y-auto font-serif text-xs text-text-secondary custom-scrollbar">
              {googleSuggestions.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </fieldset>
    </div>
  );
}
