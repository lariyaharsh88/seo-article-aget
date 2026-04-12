import Link from "next/link";

/** Shown when the DB query fails after retries (avoids throwing into error.tsx). */
export function NewsArticleTransientFailure({ slug }: { slug: string }) {
  const retryHref = `/news/${encodeURIComponent(slug)}`;
  return (
    <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
      <p className="font-mono text-xs">
        <Link
          href="/news"
          className="text-text-muted transition-colors hover:text-accent"
        >
          ← All news
        </Link>
      </p>
      <h1 className="mt-6 font-display text-2xl text-text-primary">
        This article could not be loaded
      </h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        The server could not load this page from the database (often temporary on
        cold start or connection blips). Try again in a few seconds.
      </p>
      <a
        href={retryHref}
        className="mt-6 inline-block rounded-lg border border-border px-4 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent/10"
      >
        Try again
      </a>
    </main>
  );
}
