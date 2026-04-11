"use client";

import type { BlogPost } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";

type Props = {
  initialPosts: BlogPost[];
};

export function BlogCreateClient({ initialPosts }: Props) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/blog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: slug.trim() || undefined,
          excerpt: excerpt.trim() || undefined,
          content,
          published,
        }),
      });
      const data: unknown = await res.json();
      if (!res.ok) {
        const msg =
          typeof data === "object" &&
          data !== null &&
          "error" in data &&
          typeof (data as { error: unknown }).error === "string"
            ? (data as { error: string }).error
            : `HTTP ${res.status}`;
        throw new Error(msg);
      }
      setTitle("");
      setSlug("");
      setExcerpt("");
      setContent("");
      setPublished(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-10 px-4 py-10 md:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">
            CMS
          </p>
          <h1 className="font-display text-3xl text-text-primary">
            Create blog post
          </h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            Markdown-friendly body. Slug is generated from the title if left empty.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/blogs"
            className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-secondary hover:border-accent hover:text-accent"
          >
            View blog
          </Link>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/blogs" })}
            className="rounded-lg border border-border px-3 py-2 font-mono text-xs text-text-muted hover:bg-background/80"
          >
            Sign out
          </button>
        </div>
      </div>

      <form onSubmit={(e) => void onSubmit(e)} className="space-y-5">
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Title
          </span>
          <input
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Post title"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Slug (optional)
          </span>
          <input
            className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="auto-from-title"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Excerpt (optional)
          </span>
          <textarea
            className="min-h-[72px] w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Short summary for listings"
          />
        </label>
        <label className="block space-y-2">
          <span className="font-mono text-xs uppercase text-text-muted">
            Content
          </span>
          <textarea
            required
            className="custom-scrollbar min-h-[280px] w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm leading-relaxed text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write in Markdown (headings, lists, links…)"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-3 font-mono text-xs text-text-secondary">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="rounded border-border"
          />
          Published (visible on /blogs)
        </label>
        {error && (
          <p className="rounded-lg border border-red-500/40 bg-red-950/30 px-4 py-3 font-mono text-sm text-red-200">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-accent px-6 py-2.5 font-mono text-sm font-semibold text-background transition-opacity enabled:hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Publishing…" : "Publish post"}
        </button>
      </form>

      <section className="border-t border-border pt-8">
        <h2 className="font-display text-xl text-text-primary">Your posts</h2>
        <ul className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <li className="font-serif text-sm text-text-muted">No posts yet.</li>
          ) : (
            posts.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface/60 px-4 py-3"
              >
                <div>
                  <span className="font-display text-text-primary">{p.title}</span>
                  <span className="ml-2 font-mono text-xs text-text-muted">
                    /blogs/{p.slug}
                  </span>
                  {!p.published && (
                    <span className="ml-2 rounded border border-amber-500/40 px-1.5 py-0.5 font-mono text-[10px] text-amber-400">
                      draft
                    </span>
                  )}
                </div>
                {p.published && (
                  <Link
                    href={`/blogs/${p.slug}`}
                    className="font-mono text-xs text-accent hover:underline"
                  >
                    View →
                  </Link>
                )}
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
