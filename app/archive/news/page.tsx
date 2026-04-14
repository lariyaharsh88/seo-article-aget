import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Archived News",
  description: "Archived news section.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ArchiveNewsPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-text-primary">Archived News</h1>
      <p className="mt-3 font-serif text-text-secondary">
        This legacy news section has been moved to archive and is excluded from search indexing.
      </p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        Back to RankFlowHQ home
      </Link>
    </main>
  );
}
