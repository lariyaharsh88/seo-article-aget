import type { Metadata, Viewport } from "next";
import { Inter, Space_Mono } from "next/font/google";
import Script from "next/script";
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
  SITE_LOGO_DIMENSIONS,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/seo-site";
import { getMetadataBaseUrl, getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

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
  themeColor: "#070b14",
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
        url: SITE_LOGO_PATH,
        width: SITE_LOGO_DIMENSIONS.width,
        height: SITE_LOGO_DIMENSIONS.height,
        alt: `${SITE_NAME} — AI · SEO · Growth`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: GLOBAL_SEO_DESCRIPTION,
    images: [SITE_LOGO_PATH],
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
    <html lang="en">
      <body
        className={`${inter.variable} ${spaceMono.variable} page-grid`}
      >
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
                  : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                document.documentElement.setAttribute("data-theme", theme);
              } catch (e) {
                document.documentElement.setAttribute("data-theme", "dark");
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
      </body>
    </html>
  );
}
