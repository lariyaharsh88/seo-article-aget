import type { NewsArticle } from "@/lib/education-news/types";

interface NewsCardProps {
  article: NewsArticle;
  isNew?: boolean;
  onPreview?: () => void;
}

export function EducationNewsCard({
  article,
  isNew = false,
  onPreview,
}: NewsCardProps) {
  return (
    <div className="group block rounded-xl border border-border bg-surface/80 p-3 transition-all duration-200 hover:border-accent/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3
            className="mb-1 line-clamp-2 cursor-pointer font-serif text-sm font-medium leading-snug text-text-primary transition-colors duration-200 hover:text-accent"
            onClick={() => onPreview?.()}
          >
            {article.title}
          </h3>
          <div className="flex items-center gap-2 font-mono text-xs text-text-muted">
            <span className="flex items-center gap-1.5">
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {article.lastModifiedTime}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isNew ? (
            <span className="inline-flex animate-pulse items-center rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-bold text-background">
              NEW
            </span>
          ) : null}
          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border bg-background/80 px-2 py-0.5 font-mono text-[10px] text-text-secondary">
            {article.source}
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
        <a
          href={article.url}
          target="_blank"
          rel="nofollow noopener noreferrer"
          className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
        >
          Open in new tab →
        </a>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onPreview?.()}
            className="rounded-md border border-border bg-background/80 px-2 py-1 font-mono text-xs text-text-secondary transition-colors hover:border-accent hover:text-accent"
          >
            Preview
          </button>
          <button
            type="button"
            onClick={() => onPreview?.()}
            className="rounded-md bg-accent px-2 py-1 font-mono text-xs text-background transition-colors hover:bg-accent-dim"
          >
            Read
          </button>
        </div>
      </div>
    </div>
  );
}
