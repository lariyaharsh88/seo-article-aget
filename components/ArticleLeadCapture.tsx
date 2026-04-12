"use client";

import { useState } from "react";
import { SITE_NAME } from "@/lib/seo-site";

type Source = "blog" | "news";

/** Short CTA linking to the lead form below the fold. */
export function ArticleLeadCtaStrip({ className = "" }: { className?: string }) {
  return (
    <p className={`font-mono text-sm ${className}`.trim()}>
      <a
        href="#get-in-touch"
        className="text-accent underline-offset-2 transition-colors hover:underline"
      >
        Need SEO or content help? Get in touch
      </a>
    </p>
  );
}

export type ArticleLeadCaptureProps = {
  source: Source;
  articleSlug: string;
  articleTitle: string;
};

export function ArticleLeadCapture({
  source,
  articleSlug,
  articleTitle,
}: ArticleLeadCaptureProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMessage(null);
    setStatus("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source,
          articleSlug,
          articleTitle,
          name,
          email,
          phone: phone.trim() || undefined,
          message: message.trim() || undefined,
          website: honeypot,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };
      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong.");
        return;
      }
      setStatus("success");
      setName("");
      setEmail("");
      setPhone("");
      setMessage("");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Try again.");
    }
  }

  return (
    <section
      id="get-in-touch"
      aria-labelledby="article-lead-heading"
      className="mt-12 scroll-mt-24 rounded-xl border border-border bg-surface/60 p-6 sm:p-8"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h2
            id="article-lead-heading"
            className="font-display text-xl text-text-primary sm:text-2xl"
          >
            Get in touch
          </h2>
          <p className="mt-2 font-serif text-sm text-text-secondary sm:text-base">
            Tell us how we can help with SEO, content, or outreach. We’ll reply by
            email.
          </p>
        </div>
        <p className="shrink-0 font-mono text-[11px] text-text-muted">
          {SITE_NAME}
        </p>
      </div>

      {status === "success" ? (
        <p
          className="mt-6 rounded-lg border border-accent/30 bg-accent/5 px-4 py-3 font-serif text-sm text-text-primary"
          role="status"
        >
          Thanks — your message was sent. We’ll get back to you soon.
        </p>
      ) : (
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden" aria-hidden>
            <label htmlFor="lead-website">Website</label>
            <input
              id="lead-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="lead-name"
                className="block font-mono text-xs text-text-muted"
              >
                Name <span className="text-accent">*</span>
              </label>
              <input
                id="lead-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                maxLength={120}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary outline-none ring-accent/40 transition-shadow focus:border-accent focus:ring-2"
              />
            </div>
            <div>
              <label
                htmlFor="lead-email"
                className="block font-mono text-xs text-text-muted"
              >
                Email <span className="text-accent">*</span>
              </label>
              <input
                id="lead-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary outline-none ring-accent/40 transition-shadow focus:border-accent focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="lead-phone"
              className="block font-mono text-xs text-text-muted"
            >
              Phone <span className="text-text-muted/70">(optional)</span>
            </label>
            <input
              id="lead-phone"
              name="phone"
              type="tel"
              autoComplete="tel"
              maxLength={40}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary outline-none ring-accent/40 transition-shadow focus:border-accent focus:ring-2 sm:max-w-md"
            />
          </div>

          <div>
            <label
              htmlFor="lead-message"
              className="block font-mono text-xs text-text-muted"
            >
              Message <span className="text-text-muted/70">(optional)</span>
            </label>
            <textarea
              id="lead-message"
              name="message"
              rows={4}
              maxLength={2000}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mt-1.5 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 font-serif text-sm text-text-primary outline-none ring-accent/40 transition-shadow focus:border-accent focus:ring-2"
              placeholder="Briefly describe what you need…"
            />
          </div>

          {errorMessage ? (
            <p className="font-serif text-sm text-red-600 dark:text-red-400" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={status === "loading"}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-5 py-2.5 font-mono text-sm font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {status === "loading" ? "Sending…" : "Send message"}
            </button>
            <p className="font-mono text-[11px] text-text-muted">
              By submitting, you agree we may contact you about this request.
            </p>
          </div>
        </form>
      )}
    </section>
  );
}
