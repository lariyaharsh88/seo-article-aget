"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/seo-site";

const nav = [
  { href: "/", label: "Home" },
  { href: "/blogs", label: "Blog" },
  { href: "/news", label: "News" },
  { href: "/seo-agent", label: "Article pipeline" },
  { href: "/repurpose-url", label: "URL repurpose" },
  { href: "/ai-seo-toolkit", label: "AI SEO Toolkit" },
  { href: "/off-page-seo", label: "Off-page SEO" },
  { href: "/education-trends", label: "Education trends" },
  { href: "/education-news", label: "Education news" },
] as const;

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-3 py-3">
          <Link
            href="/"
            className="flex items-center transition-opacity duration-200 hover:opacity-90"
            onClick={() => setOpen(false)}
          >
            <Image
              src={SITE_LOGO_PATH}
              alt={`${SITE_NAME} — AI · SEO · Growth`}
              width={44}
              height={44}
              className="h-11 w-11 shrink-0 object-contain"
              priority
            />
            <span className="sr-only">{SITE_NAME}</span>
          </Link>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-border p-2 text-text-secondary transition-all hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent md:hidden"
            aria-expanded={open}
            aria-controls="site-nav-mobile"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
          <nav
            className="hidden flex-wrap items-center justify-end gap-2 md:flex"
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
        <nav
          id="site-nav-mobile"
          className={`${open ? "block border-t border-border/80" : "hidden"} md:hidden`}
          aria-hidden={!open}
          aria-label="Primary"
        >
          <ul className="flex flex-col gap-1 py-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg border border-transparent px-3 py-2.5 font-mono text-xs text-text-secondary transition-colors hover:border-border hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
