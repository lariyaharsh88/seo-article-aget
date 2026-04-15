"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { buildEducationFunnelUrl } from "@/lib/education-funnel-url";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";
import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/seo-site";

const mainNav = [
  { href: "/", label: "Home" },
  { href: "/ai-seo-tools", label: "AI SEO Tools" },
  { href: "/free-tools/keyword-clustering", label: "Free Tools" },
  { href: "/blog", label: "Blog" },
  { href: "/pricing", label: "Pricing" },
] as const;

/** Stays on education.rankflowhq.com — avoids middleware redirects to apex. */
const educationNav = [
  { href: "/education", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/education-news", label: "Aggregator" },
  { href: "/education-trends", label: "Trends" },
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
  const [educationSurface, setEducationSurface] = useState(false);

  useEffect(() => {
    setEducationSurface(EDUCATION_HOSTS.has(window.location.hostname.toLowerCase()));
  }, []);

  const nav = educationSurface ? educationNav : mainNav;
  const homeHref = educationSurface ? "/education" : "/";
  const saasHref = buildEducationFunnelUrl("/seo-agent", "header_nav");

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
      <div className="relative mx-auto max-w-6xl px-4 md:px-6">
        <div className="flex items-center justify-between gap-3 py-3">
          <Link
            href={homeHref}
            className="flex min-w-0 items-center gap-3 transition-opacity duration-200 hover:opacity-90"
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
            <div className="min-w-0 text-left">
              <span className="font-display text-sm leading-tight text-text-primary sm:text-base">
                {SITE_NAME}
              </span>
              {educationSurface ? (
                <span className="mt-0.5 block font-mono text-[10px] uppercase tracking-[0.2em] text-accent">
                  Education
                </span>
              ) : (
                <span className="sr-only">{SITE_NAME}</span>
              )}
            </div>
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
            {educationSurface ? (
              <a
                href={saasHref}
                className="rounded-lg border border-accent/50 bg-accent/15 px-3 py-1.5 font-mono text-xs text-accent transition-all hover:bg-accent/25"
              >
                RankFlowHQ SaaS
              </a>
            ) : null}
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
            {educationSurface ? (
              <li>
                <a
                  href={saasHref}
                  className="block rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 font-mono text-xs text-accent"
                  onClick={() => setOpen(false)}
                >
                  RankFlowHQ SaaS →
                </a>
              </li>
            ) : null}
          </ul>
        </nav>
      </div>
    </header>
  );
}
