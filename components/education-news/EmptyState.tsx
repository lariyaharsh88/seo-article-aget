import Link from "next/link";

export function EducationNewsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface/50 px-4 py-16 text-center">
      <svg
        className="mx-auto h-16 w-16 text-text-muted"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
        />
      </svg>
      <h3 className="mt-4 font-display text-xl text-text-primary">
        Quiet news cycle right now
      </h3>
      <p className="mt-2 font-serif text-sm text-text-secondary">
        No fresh stories were detected from your selected sources yet.
      </p>
      <p className="mt-1 max-w-md font-serif text-xs text-text-muted">
        Use this window to run a quick keyword workflow so you have publish-ready content as soon as demand spikes.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          href="/seo-agent?try=1"
          className="inline-flex min-h-10 items-center justify-center rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background hover:opacity-90"
        >
          Generate a fallback article
        </Link>
        <Link
          href="/education-trends"
          className="inline-flex min-h-10 items-center justify-center rounded-lg border border-border px-4 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
        >
          Explore trend signals
        </Link>
      </div>
      <p className="mt-3 font-mono text-[11px] text-text-muted">🗞️ Tip: refresh in 30-60 minutes for new coverage.</p>
    </div>
  );
}
