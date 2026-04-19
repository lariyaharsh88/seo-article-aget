"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { buildEducationFunnelUrl } from "@/lib/education-funnel-url";
import { EDUCATION_HOSTS, EDUCATION_SITE_URL } from "@/lib/education-hosts";
import { SITE_LOGO_PATH, SITE_NAME } from "@/lib/seo-site";

const mainNav = [
  { href: "/", label: "Home" },
  { href: "/seo-agent", label: "Platform" },
  { href: "/ai-seo-tools", label: "Solutions" },
  { href: "/free-tools", label: "Resources" },
  { href: `${EDUCATION_SITE_URL}/education`, label: "Education" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bulk-article-creating-agent", label: "Bulk articles" },
  { href: "/pricing", label: "Pricing" },
  { href: "/login?next=/seo-agent", label: "Sign in" },
] as const;

/** Stays on education.rankflowhq.com — avoids middleware redirects to apex. */
const educationNav = [
  { href: "/education", label: "Home" },
  { href: "/news", label: "News" },
  { href: "/blogs", label: "Blog" },
  { href: "/blog-create", label: "Create blog" },
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setEducationSurface(EDUCATION_HOSTS.has(window.location.hostname.toLowerCase()));
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const nav = educationSurface ? educationNav : mainNav;
  const homeHref = educationSurface ? "/education" : "/";
  const saasHref = buildEducationFunnelUrl("/seo-agent", "header_nav");

  return (
    <header
      className={`sticky top-0 z-50 border-b border-border/80 bg-background/70 pt-[max(0.25rem,env(safe-area-inset-top))] backdrop-blur-xl transition-all duration-300 ease-in-out supports-[backdrop-filter]:bg-background/55 ${
        scrolled ? "shadow-[0_8px_30px_rgba(2,6,23,0.35)]" : ""
      }`}
    >
      <div className="relative mx-auto max-w-7xl px-4 md:px-6">
        <div
          className={`flex items-center justify-between gap-3 transition-all duration-300 ease-in-out ${
            scrolled ? "py-2" : "py-3"
          }`}
        >
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
              className={`shrink-0 object-contain transition-all duration-300 ease-in-out ${
                scrolled ? "h-9 w-9" : "h-11 w-11"
              }`}
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-border text-text-secondary transition-all hover:border-accent hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent md:hidden"
            aria-expanded={open}
            aria-controls="site-nav-mobile"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((o) => !o)}
          >
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
          <nav className="hidden flex-wrap items-center justify-end gap-2 md:flex" aria-label="Primary">
            <ThemeToggle />
            {nav.map((item) => {
              const navBtn =
                "btn-premium rounded-lg border border-border/80 bg-surface/40 px-3 py-1.5 font-mono text-xs text-text-secondary transition-all duration-200 hover:-translate-y-0.5 hover:border-accent/70 hover:text-text-primary focus:outline-none focus:ring-2 focus:ring-accent";
              const isExternal = item.href.startsWith("http");
              return isExternal ? (
                <a
                  key={item.href}
                  href={item.href}
                  className={navBtn}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {item.label}
                </a>
              ) : (
                <Link key={item.href} href={item.href} className={navBtn}>
                  {item.label}
                </Link>
              );
            })}
            {!educationSurface ? (
              <Link
                href="/seo-agent"
                className="btn-premium pulse-subtle rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
              >
                Start Building
              </Link>
            ) : (
              <a
                href={saasHref}
                className="btn-premium rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
              >
                RankFlowHQ SaaS
              </a>
            )}
          </nav>
        </div>
        <nav
          id="site-nav-mobile"
          className={`${open ? "block border-t border-border/80" : "hidden"} md:hidden`}
          aria-hidden={!open}
          aria-label="Primary"
        >
          <ul className="flex flex-col gap-1 py-3">
            <li className="px-1 pb-1">
              <ThemeToggle />
            </li>
            {nav.map((item) => (
              <li key={item.href}>
                {item.href.startsWith("http") ? (
                  <a
                    href={item.href}
                    className="flex min-h-11 items-center rounded-lg border border-transparent px-3 py-2.5 font-mono text-xs text-text-secondary transition-colors hover:border-border hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="flex min-h-11 items-center rounded-lg border border-transparent px-3 py-2.5 font-mono text-xs text-text-secondary transition-colors hover:border-border hover:text-accent focus:outline-none focus:ring-2 focus:ring-accent"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
            {educationSurface ? (
              <li>
                <a
                  href={saasHref}
                  className="flex min-h-11 items-center rounded-lg border border-accent/40 bg-accent/10 px-3 py-2.5 font-mono text-xs text-accent"
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
