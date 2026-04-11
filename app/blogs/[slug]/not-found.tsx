import Link from "next/link";

export default function BlogPostNotFound() {
  return (
    <main className="mx-auto max-w-lg px-4 py-20 text-center md:px-6">
      <h1 className="font-display text-2xl text-text-primary">Post not found</h1>
      <p className="mt-3 font-serif text-text-secondary">
        This article does not exist or is not published yet.
      </p>
      <Link
        href="/blogs"
        className="mt-8 inline-block font-mono text-sm text-accent hover:underline"
      >
        ← Back to blog
      </Link>
    </main>
  );
}
