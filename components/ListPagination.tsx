import Link from "next/link";

type Props = {
  currentPage: number;
  totalPages: number;
  /** Supported list index route — no trailing query string */
  basePath:
    | "/blog"
    | "/blogs"
    | "/news"
    | "/article"
    | "/article/generated"
    | "/news/category/ssc"
    | "/news/category/rrb"
    | "/news/category/upsc"
    | "/news/category/board-results";
};

export function ListPagination({ currentPage, totalPages, basePath }: Props) {
  if (totalPages <= 1) return null;

  const href = (p: number) =>
    p <= 1 ? basePath : `${basePath}?page=${p}`;

  return (
    <nav
      aria-label="Pagination"
      className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-8 font-mono text-sm"
    >
      <div>
        {currentPage > 1 ? (
          <Link
            href={href(currentPage - 1)}
            className="text-accent underline-offset-2 transition-colors hover:underline"
            prefetch={false}
          >
            ← Previous
          </Link>
        ) : (
          <span className="text-text-muted">← Previous</span>
        )}
      </div>
      <span className="text-text-muted">
        Page {currentPage} of {totalPages}
      </span>
      <div>
        {currentPage < totalPages ? (
          <Link
            href={href(currentPage + 1)}
            className="text-accent underline-offset-2 transition-colors hover:underline"
            prefetch={false}
          >
            Next →
          </Link>
        ) : (
          <span className="text-text-muted">Next →</span>
        )}
      </div>
    </nav>
  );
}
