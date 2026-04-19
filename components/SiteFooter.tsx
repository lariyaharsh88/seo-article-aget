import Link from "next/link";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ADSENSE_SLOTS } from "@/lib/adsense-config";
import { SITE_NAME } from "@/lib/seo-site";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/bulk-article-creating-agent", label: "Bulk articles" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border/80 bg-background/70 backdrop-blur-sm">
      {ADSENSE_SLOTS.footer ? (
        <div className="border-b border-border/60 bg-background/40">
          <div className="mx-auto max-w-6xl space-y-2 px-4 py-6 md:px-6">
            <p className="text-center font-mono text-[10px] uppercase tracking-wider text-text-muted">
              Advertisement
            </p>
            <AdSenseSlot
              slot={ADSENSE_SLOTS.footer}
              className="flex justify-center"
              minHeight={90}
            />
          </div>
        </div>
      ) : null}
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.2fr_1fr_auto] md:items-start md:px-6">
        <div className="space-y-3">
          <p className="font-display text-lg text-text-primary">{SITE_NAME}</p>
          <p className="max-w-md font-serif text-sm text-text-secondary">
            Create more ranking-ready pages in less time with one workflow for research, writing, and optimization.
          </p>
          <Link
            href="/seo-agent"
            className="inline-flex rounded-lg bg-accent px-4 py-2 font-mono text-xs font-semibold text-background transition-all duration-200 hover:-translate-y-0.5 hover:opacity-90"
          >
            Start Free
          </Link>
          <p className="font-mono text-[11px] text-text-muted">
            Start in under 60 seconds. No setup friction.
          </p>
        </div>
        <nav aria-label="Footer" className="md:justify-self-center">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="rounded-xl border border-border/80 bg-surface/50 p-4 md:justify-self-end">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent">
            Build with confidence
          </p>
          <p className="mt-2 font-serif text-xs text-text-secondary">
            Trusted by SaaS teams, agencies, and operators focused on measurable organic growth.
          </p>
          <div className="mt-3 space-y-1 font-mono text-[11px] text-text-muted">
            <p>1,200+ teams using workflows</p>
            <p>85,000+ SEO pages generated</p>
          </div>
        </div>
      </div>
      <div className="border-t border-border/60 bg-surface/30 px-4 py-3">
        <p className="mx-auto max-w-7xl text-center font-mono text-xs text-text-secondary">
          Generate articles using AI{" "}
          <Link
            href="https://rankflowhq.com"
            className="text-accent underline underline-offset-2 transition-opacity hover:opacity-80"
          >
            → RankFlowHQ
          </Link>
        </p>
      </div>
      <div className="border-t border-border/60 py-4 text-center font-mono text-[10px] text-text-muted">
        © {year} {SITE_NAME}. All rights reserved.
      </div>
    </footer>
  );
}
