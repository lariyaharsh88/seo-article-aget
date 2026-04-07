"use client";

import { useEffect, useMemo, useRef, type ReactNode } from "react";

interface ArticleRendererProps {
  markdown: string;
  streaming?: boolean;
}

function renderInlineBold(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    const m = part.match(/^\*\*(.+)\*\*$/);
    if (m) {
      return (
        <strong
          key={i}
          className="rounded bg-accent-dim/40 px-0.5 font-semibold text-text-primary"
        >
          {m[1]}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function ArticleRenderer({ markdown, streaming }: ArticleRendererProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (streaming && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [markdown, streaming]);

  const blocks = useMemo(() => {
    const lines = markdown.split("\n");
    type Block =
      | { kind: "h1"; text: string }
      | { kind: "h2"; text: string }
      | { kind: "h3"; text: string }
      | { kind: "quote"; text: string }
      | { kind: "ul"; items: string[] }
      | { kind: "ol"; items: string[] }
      | { kind: "p"; lines: string[] };

    const blocksOut: Block[] = [];
    let i = 0;

    const flushParagraph = (buf: string[]) => {
      if (buf.length) blocksOut.push({ kind: "p", lines: [...buf] });
      buf.length = 0;
    };

    const paraBuf: string[] = [];

    while (i < lines.length) {
      const line = lines[i];
      const t = line.trimEnd();
      const tr = t.trim();

      if (tr === "") {
        flushParagraph(paraBuf);
        i += 1;
        continue;
      }

      if (tr.startsWith("### ")) {
        flushParagraph(paraBuf);
        blocksOut.push({ kind: "h3", text: tr.slice(4) });
        i += 1;
        continue;
      }
      if (tr.startsWith("## ")) {
        flushParagraph(paraBuf);
        blocksOut.push({ kind: "h2", text: tr.slice(3) });
        i += 1;
        continue;
      }
      if (tr.startsWith("# ")) {
        flushParagraph(paraBuf);
        blocksOut.push({ kind: "h1", text: tr.slice(2) });
        i += 1;
        continue;
      }

      if (tr.startsWith(">")) {
        flushParagraph(paraBuf);
        blocksOut.push({ kind: "quote", text: tr.replace(/^>\s?/, "") });
        i += 1;
        continue;
      }

      if (tr.startsWith("- ") || tr.startsWith("* ")) {
        flushParagraph(paraBuf);
        const items: string[] = [];
        while (i < lines.length) {
          const L = lines[i].trim();
          if (L.startsWith("- ") || L.startsWith("* ")) {
            items.push(L.slice(2));
            i += 1;
          } else if (L === "") break;
          else break;
        }
        blocksOut.push({ kind: "ul", items });
        continue;
      }

      const ol = tr.match(/^(\d+)\.\s+(.*)$/);
      if (ol) {
        flushParagraph(paraBuf);
        const items: string[] = [ol[2] ?? ""];
        i += 1;
        while (i < lines.length) {
          const L = lines[i].trim();
          const m2 = L.match(/^\d+\.\s+(.*)$/);
          if (m2) {
            items.push(m2[1] ?? "");
            i += 1;
          } else if (L === "") break;
          else break;
        }
        blocksOut.push({ kind: "ol", items });
        continue;
      }

      paraBuf.push(t);
      i += 1;
    }
    flushParagraph(paraBuf);

    return blocksOut;
  }, [markdown]);

  return (
    <article className="prose-slate max-w-none font-serif leading-relaxed text-text-primary">
      {blocks.map((b, idx) => {
        if (b.kind === "h1") {
          return (
            <h1
              key={idx}
              className="mt-8 border-b border-border pb-3 font-display text-3xl font-normal tracking-tight text-text-primary first:mt-0 md:text-4xl"
            >
              {renderInlineBold(b.text)}
            </h1>
          );
        }
        if (b.kind === "h2") {
          return (
            <h2
              key={idx}
              className="mt-10 border-b border-border pb-2 font-mono text-lg font-bold text-accent"
            >
              {renderInlineBold(b.text)}
            </h2>
          );
        }
        if (b.kind === "h3") {
          return (
            <h3
              key={idx}
              className="mt-6 font-mono text-base font-semibold text-amber-200/90"
            >
              {renderInlineBold(b.text)}
            </h3>
          );
        }
        if (b.kind === "quote") {
          return (
            <blockquote
              key={idx}
              className="my-6 border-l-4 border-accent bg-accent-dim/10 py-2 pl-4 text-text-secondary"
            >
              {renderInlineBold(b.text)}
            </blockquote>
          );
        }
        if (b.kind === "ul") {
          return (
            <ul key={idx} className="my-4 list-none space-y-2 pl-0">
              {b.items.map((item, j) => (
                <li key={j} className="flex gap-2 font-serif text-text-primary">
                  <span className="mt-1.5 text-accent" aria-hidden>
                    →
                  </span>
                  <span>{renderInlineBold(item)}</span>
                </li>
              ))}
            </ul>
          );
        }
        if (b.kind === "ol") {
          return (
            <ol key={idx} className="my-4 list-decimal space-y-2 pl-6">
              {b.items.map((item, j) => (
                <li key={j} className="font-serif">
                  {renderInlineBold(item)}
                </li>
              ))}
            </ol>
          );
        }
        return (
          <p key={idx} className="my-4 font-serif text-[1.05rem] text-text-primary">
            {b.lines.map((ln, j) => (
              <span key={j}>
                {renderInlineBold(ln)}
                {j < b.lines.length - 1 ? <br /> : null}
              </span>
            ))}
          </p>
        );
      })}
      <div ref={bottomRef} />
    </article>
  );
}
