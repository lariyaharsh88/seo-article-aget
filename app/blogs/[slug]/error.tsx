"use client";

import Link from "next/link";

export default function BlogPostError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto min-w-0 max-w-3xl px-4 py-8 sm:py-10 md:px-6">
      <p className="font-mono text-xs">
        <Link
          href="/blogs"
          className="text-text-muted transition-colors hover:text-accent"
        >
          ← All posts
        </Link>
      </p>
      <h1 className="mt-6 font-display text-2xl text-text-primary">
        This article could not be loaded
      </h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        The server hit an error (often a temporary database issue on cold start).
        Try again in a few seconds.
      </p>
      {process.env.NODE_ENV === "development" ? (
        <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-background/80 p-3 font-mono text-xs text-red-300">
          {error.message}
        </pre>
      ) : null}
      <button
        type="button"
        onClick={() => reset()}
        className="mt-6 rounded-lg border border-border px-4 py-2 font-mono text-sm text-accent hover:bg-accent/10"
      >
        Try again
      </button>
    </main>
  );
}
