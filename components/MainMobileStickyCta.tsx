"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { EDUCATION_HOSTS } from "@/lib/education-hosts";

const HIDE_PATH_PREFIXES = ["/seo-agent", "/login", "/dashboard", "/auth"] as const;

export function MainMobileStickyCta() {
  const pathname = usePathname();
  const [isEducationHost, setIsEducationHost] = useState(false);

  useEffect(() => {
    setIsEducationHost(EDUCATION_HOSTS.has(window.location.hostname.toLowerCase()));
  }, []);

  const shouldHide = useMemo(() => {
    if (!pathname) return false;
    return HIDE_PATH_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  }, [pathname]);

  if (isEducationHost || shouldHide) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[58] border-t border-border/80 bg-background/90 px-3 pb-[calc(0.65rem+env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
      <Link
        href="/seo-agent"
        className="btn-premium pulse-subtle flex min-h-11 w-full items-center justify-center rounded-xl bg-accent px-4 py-2.5 font-mono text-sm font-semibold text-background"
      >
        Get SEO Traffic Now
      </Link>
    </div>
  );
}
