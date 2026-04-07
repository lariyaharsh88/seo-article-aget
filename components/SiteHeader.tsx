import Link from "next/link";

const nav = [
  { href: "/", label: "SEO Agent" },
  { href: "/education-trends", label: "Education trends" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="font-display text-lg text-text-primary transition-colors duration-200 hover:text-accent"
        >
          SEO Article Agent
        </Link>
        <nav
          className="flex flex-wrap gap-2"
          aria-label="Primary"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-all duration-200 hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
