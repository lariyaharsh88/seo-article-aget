import Link from "next/link";

export type ContentInterlinkItem = {
  href: string;
  title: string;
  /** One line under the title (excerpt, source, date, etc.). */
  description?: string | null;
};

type Props = {
  headingId: string;
  heading: string;
  items: ContentInterlinkItem[];
  seeAllHref?: string;
  seeAllLabel?: string;
};

/**
 * Bottom-of-article internal links: one list item per related URL for SEO interlinking.
 */
export function ContentInterlinks({
  headingId,
  heading,
  items,
  seeAllHref,
  seeAllLabel,
}: Props) {
  if (items.length === 0) return null;

  return (
    <aside
      className="mt-16 border-t border-border pt-10"
      aria-labelledby={headingId}
    >
      <h2
        id={headingId}
        className="font-mono text-xs uppercase tracking-wide text-accent"
      >
        {heading}
      </h2>
      <ul className="mt-5 space-y-3">
        {items.map((item) => (
          <li
            key={item.href}
            className="rounded-xl border border-border/90 bg-surface/30 px-4 py-3 transition-colors hover:border-accent/35"
          >
            <Link
              href={item.href}
              prefetch={false}
              className="block font-display text-lg text-text-primary hover:text-accent"
            >
              {item.title}
            </Link>
            {item.description ? (
              <p className="mt-1.5 font-serif text-sm leading-snug text-text-muted line-clamp-2">
                {item.description}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
      {seeAllHref ? (
        <p className="mt-6 font-mono text-xs">
          <Link
            href={seeAllHref}
            prefetch={false}
            className="text-accent underline-offset-2 hover:underline"
          >
            {seeAllLabel ?? "See all"} →
          </Link>
        </p>
      ) : null}
    </aside>
  );
}
