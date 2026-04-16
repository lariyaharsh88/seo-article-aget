"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { markdownToArticleBodyHtml } from "@/lib/markdown-to-html";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type Item = {
  id: string;
  title: string;
  topic: string;
  primaryKeyword: string | null;
  sourceUrl: string | null;
  markdown: string;
  wordCount: number;
  createdAt: string;
};

export default function DashboardArticleDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [item, setItem] = useState<Item | null>(null);

  useEffect(() => {
    let dead = false;
    void (async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) throw new Error("Please login first.");
        const res = await fetch(`/api/user-articles/${encodeURIComponent(id || "")}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = (await res.json()) as { item?: Item; error?: string };
        if (!res.ok) throw new Error(payload.error || `HTTP ${res.status}`);
        if (!dead) setItem(payload.item ?? null);
      } catch (e) {
        if (!dead) setError(e instanceof Error ? e.message : "Failed to load article");
      } finally {
        if (!dead) setLoading(false);
      }
    })();
    return () => {
      dead = true;
    };
  }, [id]);

  let html = "";
  if (item?.markdown) {
    try {
      html = markdownToArticleBodyHtml(item.markdown);
    } catch {
      html = "<p>Could not render markdown preview.</p>";
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:px-6">
      <p className="font-mono text-xs">
        <Link href="/dashboard" className="text-text-muted hover:text-accent">
          ← Dashboard
        </Link>
      </p>
      {loading ? <p className="mt-4 font-mono text-sm text-text-muted">Loading...</p> : null}
      {error ? (
        <p className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-mono text-sm text-red-200">
          {error}
        </p>
      ) : null}
      {item ? (
        <article className="mt-4">
          <h1 className="font-display text-3xl text-text-primary">{item.title}</h1>
          <p className="mt-2 font-serif text-sm text-text-secondary">{item.topic}</p>
          <div className="mt-2 flex flex-wrap gap-3 font-mono text-[11px] text-text-muted">
            <span>Words: {item.wordCount}</span>
            <span>Primary: {item.primaryKeyword || "-"}</span>
            <span>
              {new Date(item.createdAt).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
              })}{" "}
              IST
            </span>
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline-offset-2 hover:underline"
              >
                Source link
              </a>
            ) : null}
          </div>
          <div
            className="blog-prose mt-8 overflow-x-auto font-serif text-text-primary"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </article>
      ) : null}
    </main>
  );
}
