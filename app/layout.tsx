import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans, Space_Mono } from "next/font/google";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { EducationTrafficCtaBar } from "@/components/EducationTrafficCtaBar";
import { LazyUiWidgets } from "@/components/LazyUiWidgets";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { UiMotionEffects } from "@/components/UiMotionEffects";
import { Providers } from "@/app/providers";
import { SupabaseAuthHashRedirect } from "@/components/SupabaseAuthHashRedirect";
import { StructuredData } from "@/components/StructuredData";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense-config";
import {
  SITE_NAME,
  SITE_OG_IMAGE_DIMENSIONS,
  SITE_OG_IMAGE_PATH,
} from "@/lib/seo-site";
import { getMetadataBaseUrl, getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

/** Headings and UI labels/buttons (Tailwind `font-display` and `font-mono`). */
const jakarta = Plus_Jakarta_Sans({
  weight: ["500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

/** Code only (`code`, `pre`) — see globals.css. */
const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

const siteUrl = getSiteUrl();
const GLOBAL_SEO_DESCRIPTION =
  "Build SEO articles that rank on Google and ChatGPT using AI.";

/** GA4 Measurement ID — override with NEXT_PUBLIC_GA_MEASUREMENT_ID if needed. */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-19XWBZXT88";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF8F5",
};

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  title: {
    default: "RankFlowHQ - AI SEO Automation Platform",
    template: `%s · RankFlowHQ - AI SEO Automation Platform`,
  },
  description: GLOBAL_SEO_DESCRIPTION,
  keywords: [
    "RankFlowHQ",
    "SEO article",
    "content SEO",
    "AI writing",
    "SERP research",
    "SEO outline",
    "long-form article",
    "meta description",
    "seo automation",
    "chatgpt seo",
  ],
  authors: [{ name: SITE_NAME }],
  creator: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: GLOBAL_SEO_DESCRIPTION,
    images: [
      {
        url: SITE_OG_IMAGE_PATH,
        width: SITE_OG_IMAGE_DIMENSIONS.width,
        height: SITE_OG_IMAGE_DIMENSIONS.height,
        alt: `${SITE_NAME} — AI · SEO · Growth`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: GLOBAL_SEO_DESCRIPTION,
    images: [SITE_OG_IMAGE_PATH],
  },
  other: {
    "google-adsense-account": ADSENSE_CLIENT_ID,
  },
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jakarta.variable} ${spaceMono.variable}`}
      >
        <Script id="chunk-reload" strategy="beforeInteractive">
          {`
            // A JS chunk can fail to load after a new deploy or a brief network/DNS blip, which leaves
            // React's "Application error" screen. Reload once (per tab, per minute) to recover.
            (function () {
              function retry(msg) {
                if (!/ChunkLoadError|Loading chunk [^ ]+ failed|Loading CSS chunk/.test(msg || "")) return;
                try {
                  var last = Number(sessionStorage.getItem("rfh:chunk-reload") || 0);
                  if (Date.now() - last < 60000) return;
                  sessionStorage.setItem("rfh:chunk-reload", String(Date.now()));
                } catch (e) {}
                location.reload();
              }
              window.addEventListener("error", function (e) {
                retry((e && e.message) || (e && e.error && (e.error.name + " " + e.error.message)));
              });
              window.addEventListener("unhandledrejection", function (e) {
                var r = e && e.reason;
                retry(r && (r.name + " " + r.message));
              });
            })();
          `}
        </Script>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
        >
          {`
            (function () {
              try {
                var stored = localStorage.getItem("rfh:theme");
                var theme = stored === "light" || stored === "dark"
                  ? stored
                  : "light";
                document.documentElement.setAttribute("data-theme", theme);
              } catch (e) {
                document.documentElement.setAttribute("data-theme", "light");
              }
            })();
          `}
        </Script>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics-gtag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
        <Script
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
            ADSENSE_CLIENT_ID,
          )}`}
          strategy="afterInteractive"
          crossOrigin="anonymous"
        />
        <StructuredData />
        <Providers>
          <AnalyticsTracker />
          <SupabaseAuthHashRedirect />
          <UiMotionEffects />
          <div className="relative z-10 flex min-h-screen flex-col">
            <SiteHeader />
            <EducationTrafficCtaBar />
            <div className="flex-1">{children}</div>
            <SiteFooter />
            <LazyUiWidgets />
          </div>
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
