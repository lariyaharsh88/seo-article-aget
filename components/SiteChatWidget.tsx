"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SITE_NAME } from "@/lib/seo-site";

type Role = "user" | "assistant";

type Msg = { role: Role; content: string };

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Minimal **bold** + newlines for assistant text (no raw HTML). */
function formatAssistantHtml(text: string): string {
  const esc = escapeHtml(text);
  const withBold = esc.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return withBold.replace(/\n/g, "<br />");
}

export function SiteChatWidget() {
  const chatEnv = process.env.NEXT_PUBLIC_SITE_CHAT?.trim().toLowerCase();
  const hide = chatEnv === "0" || chatEnv === "false";

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!open || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, open, loading]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const send = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    setError(null);
    setInput("");
    const nextMessages: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setLoading(true);

    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;

    let assistantText = "";

    try {
      const res = await fetch("/api/site-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
        signal: ac.signal,
      });

      if (!res.ok) {
        const errJson = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(errJson.error || `Request failed (${res.status})`);
      }

      if (!res.body) throw new Error("No response body");

      setMessages((m) => [...m, { role: "assistant", content: "" }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) >= 0) {
          const block = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          for (const line of block.split("\n")) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;
            try {
              const json = JSON.parse(data) as {
                choices?: Array<{ delta?: { content?: string } }>;
              };
              const piece = json.choices?.[0]?.delta?.content;
              if (piece) {
                assistantText += piece;
                setMessages((prev) => {
                  const copy = [...prev];
                  const last = copy[copy.length - 1];
                  if (last?.role === "assistant") {
                    copy[copy.length - 1] = {
                      role: "assistant",
                      content: assistantText,
                    };
                  }
                  return copy;
                });
              }
            } catch {
              /* ignore malformed chunk */
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === "AbortError") return;
      const msg =
        e instanceof Error ? e.message : "Something went wrong. Try again.";
      setError(msg);
      setMessages((m) => {
        if (m[m.length - 1]?.role === "assistant" && !m[m.length - 1]?.content) {
          return m.slice(0, -1);
        }
        return m;
      });
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  if (hide) return null;

  return (
    <div className="pointer-events-none fixed bottom-0 right-0 z-[100] p-4 sm:p-6">
      <div className="pointer-events-auto flex max-w-[min(100vw-1rem,24rem)] flex-col items-end gap-3">
        {open ? (
          <section
            id="site-chat-panel"
            className="flex max-h-[min(520px,75vh)] w-[min(100vw-2rem,22rem)] flex-col overflow-hidden rounded-xl border border-border bg-background/95 shadow-2xl backdrop-blur-sm sm:w-[24rem]"
            aria-label={`${SITE_NAME} assistant`}
          >
            <header className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-accent">
                  {SITE_NAME}
                </p>
                <h2 className="font-display text-lg text-text-primary">
                  Site assistant
                </h2>
                <p className="mt-0.5 font-mono text-[10px] text-text-muted">
                  Tools &amp; navigation on this site only
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-1 font-mono text-xs text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
                aria-label="Close chat"
              >
                ✕
              </button>
            </header>

            <div
              ref={listRef}
              className="custom-scrollbar min-h-[200px] flex-1 space-y-3 overflow-y-auto px-4 py-3"
            >
              {messages.length === 0 && !loading ? (
                <p className="font-serif text-sm text-text-secondary">
                  Ask how to use our SEO tools, where to find the blog or pricing, or
                  what each page does. I only cover {SITE_NAME}—not general web
                  search or unrelated topics.
                </p>
              ) : null}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={
                    m.role === "user"
                      ? "ml-6 rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 font-serif text-sm text-text-primary"
                      : "mr-4 font-serif text-sm text-text-secondary"
                  }
                >
                  {m.role === "user" ? (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  ) : (
                    <div
                      className="whitespace-pre-wrap [word-break:break-word]"
                      dangerouslySetInnerHTML={{
                        __html:
                          m.content.trim() === ""
                            ? loading && i === messages.length - 1
                              ? '<span class="text-text-muted">…</span>'
                              : ""
                            : formatAssistantHtml(m.content),
                      }}
                    />
                  )}
                </div>
              ))}
              {error ? (
                <p
                  className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 font-serif text-sm text-red-200"
                  role="alert"
                >
                  {error}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border p-3">
              <div className="flex gap-2">
                <label htmlFor="site-chat-input" className="sr-only">
                  Message
                </label>
                <textarea
                  id="site-chat-input"
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send();
                    }
                  }}
                  placeholder="Ask about RankFlowHQ tools…"
                  disabled={loading}
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 font-serif text-sm text-text-primary outline-none ring-accent/30 focus:border-accent focus:ring-2"
                />
                <button
                  type="button"
                  onClick={() => void send()}
                  disabled={loading || !input.trim()}
                  className="shrink-0 self-end rounded-lg bg-accent px-3 py-2 font-mono text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </div>
          </section>
        ) : null}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-full border border-accent/50 bg-accent px-4 py-3 font-mono text-sm font-medium text-background shadow-lg transition-all hover:opacity-95"
          aria-expanded={open}
          aria-controls="site-chat-panel"
        >
          {open ? "Close" : "Chat"}
        </button>
      </div>
    </div>
  );
}
