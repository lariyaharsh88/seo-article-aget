export function EducationNewsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface/50 px-4 py-16">
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
        No news today
      </h3>
      <p className="mt-2 font-serif text-sm text-text-secondary">
        There are no articles published today from the selected sources (IST).
      </p>
      <p className="mt-1 font-serif text-xs text-text-muted">
        Check back later or try refreshing the page.
      </p>
    </div>
  );
}
