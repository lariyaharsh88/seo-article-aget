"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

export type DirectoryItem = {
  href: string;
  label: string;
  blurb: string;
};

export type DirectoryGroup = {
  heading: string;
  description: string;
  items: DirectoryItem[];
};

type Props = {
  groups: DirectoryGroup[];
};

const ALL_FILTER = "All";

export function PagesDirectoryClient({ groups }: Props) {
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState<string>(ALL_FILTER);

  const filters = useMemo(
    () => [ALL_FILTER, ...groups.map((g) => g.heading)],
    [groups],
  );

  const normalizedQuery = query.trim().toLowerCase();

  const visibleGroups = useMemo(() => {
    return groups
      .filter((group) => activeGroup === ALL_FILTER || group.heading === activeGroup)
      .map((group) => {
        const items = normalizedQuery
          ? group.items.filter((item) => {
              const hay = `${item.label} ${item.blurb} ${item.href}`.toLowerCase();
              return hay.includes(normalizedQuery);
            })
          : group.items;
        return { ...group, items };
      })
      .filter((group) => group.items.length > 0);
  }, [activeGroup, groups, normalizedQuery]);

  const totalVisibleItems = visibleGroups.reduce(
    (sum, group) => sum + group.items.length,
    0,
  );

  return (
    <div className="mt-7">
      <div className="rounded-2xl border border-border bg-surface/65 p-4 shadow-[0_0_0_1px_rgba(148,163,184,0.06)] backdrop-blur-sm sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="block w-full max-w-xl">
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-text-muted">
              Quick search
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search tools, pages, or paths"
              className="mt-2 w-full rounded-xl border border-border bg-background/80 px-3 py-2.5 font-serif text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted/80 focus:border-accent/60"
            />
          </label>
          <div className="rounded-xl border border-border bg-background/60 px-4 py-3 text-center">
            <p className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
              Matches
            </p>
            <p className="mt-1 font-display text-2xl text-text-primary">
              {totalVisibleItems}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {filters.map((name) => {
            const active = activeGroup === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setActiveGroup(name)}
                className={`rounded-full border px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide transition-colors ${
                  active
                    ? "border-accent/60 bg-accent/20 text-accent"
                    : "border-border bg-background/40 text-text-secondary hover:border-accent/35 hover:text-text-primary"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>
      </div>

      {visibleGroups.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-border bg-surface/50 p-8 text-center">
          <p className="font-display text-2xl text-text-primary">No pages found</p>
          <p className="mt-2 font-serif text-sm text-text-secondary">
            Try another keyword or switch the category filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {visibleGroups.map((group) => (
            <section
              key={group.heading}
              className="rounded-2xl border border-border bg-surface/60 p-5 transition-colors hover:border-accent/40"
            >
              <h2 className="font-display text-2xl text-text-primary">{group.heading}</h2>
              <p className="mt-1 font-serif text-xs text-text-muted">
                {group.description}
              </p>
              <ul className="mt-4 space-y-2.5">
                {group.items.map((item) => (
                  <li key={item.href + item.label}>
                    <Link
                      href={item.href}
                      className="group block rounded-xl border border-border/80 bg-background/35 px-3 py-2.5 transition-colors hover:border-accent/45 hover:bg-background/60"
                    >
                      <span className="flex items-center justify-between gap-3 font-mono text-xs text-text-secondary transition-colors group-hover:text-text-primary">
                        <span>{item.label}</span>
                        <span className="text-accent">Open</span>
                      </span>
                      <span className="mt-1 block font-serif text-[11px] text-text-muted">
                        {item.blurb}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
