import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Archived Education Content",
  description: "Archived education section.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ArchiveEducationPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-text-primary">
        Archived Education Content
      </h1>
      <p className="mt-3 font-serif text-text-secondary">
        Legacy education-related pages are archived here and noindexed.
      </p>
      <Link href="/" className="mt-6 inline-block text-accent hover:underline">
        Back to RankFlowHQ home
      </Link>
    </main>
  );
}
