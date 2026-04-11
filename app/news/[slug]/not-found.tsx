import Link from "next/link";

export default function NewsArticleNotFound() {
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
        Article not found
      </h1>
      <p className="mt-3 font-serif text-sm text-text-secondary">
        This URL is not a published repurposed article, or it may have been removed.
      </p>
    </main>
  );
}
