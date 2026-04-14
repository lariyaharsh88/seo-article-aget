import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Archive",
  description: "Archived legacy sections.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ArchivePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 md:px-6">
      <h1 className="font-display text-3xl text-text-primary">Archive</h1>
      <p className="mt-3 font-serif text-text-secondary">
        This section contains archived legacy content that is outside the current
        AI SEO tool focus.
      </p>
      <ul className="mt-6 space-y-2 font-mono text-sm">
        <li>
          <Link href="/archive/news" className="text-accent hover:underline">
            Archived news
          </Link>
        </li>
        <li>
          <Link href="/archive/education" className="text-accent hover:underline">
            Archived education content
          </Link>
        </li>
      </ul>
    </main>
  );
}
