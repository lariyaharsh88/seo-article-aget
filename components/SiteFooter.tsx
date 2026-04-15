import Link from "next/link";
import { AdSenseSlot } from "@/components/AdSenseSlot";
import { ADSENSE_SLOTS } from "@/lib/adsense-config";
import { SITE_NAME } from "@/lib/seo-site";

const footerLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
] as const;

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-background/80">
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
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="space-y-1">
          <p className="font-display text-sm text-text-primary">{SITE_NAME}</p>
          <p className="max-w-md font-serif text-xs text-text-muted">
            SEO tooling for research, content, and outreach — built for teams who ship
            organic growth.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {footerLinks.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="font-mono text-xs text-text-secondary transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-border/60 bg-surface/40 px-4 py-3">
        <p className="mx-auto max-w-6xl text-center font-mono text-xs text-text-secondary">
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
