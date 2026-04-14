import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Abril_Fatface, Lora, Space_Mono } from "next/font/google";
import Script from "next/script";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { SiteChatWidget } from "@/components/SiteChatWidget";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { Providers } from "@/app/providers";
import { StructuredData } from "@/components/StructuredData";
import { ADSENSE_CLIENT_ID } from "@/lib/adsense-config";
import {
  SITE_DESCRIPTION,
  SITE_LOGO_DIMENSIONS,
  SITE_LOGO_PATH,
  SITE_NAME,
} from "@/lib/seo-site";
import { getMetadataBaseUrl, getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const abril = Abril_Fatface({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-abril",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

const siteUrl = getSiteUrl();

/** GA4 Measurement ID — override with NEXT_PUBLIC_GA_MEASUREMENT_ID if needed. */
const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-19XWBZXT88";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0f14",
};

export const metadata: Metadata = {
  metadataBase: getMetadataBaseUrl(),
  title: {
    default: "RankFlowHQ - AI SEO Automation Platform",
    template: `%s · RankFlowHQ - AI SEO Automation Platform`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "RankFlowHQ",
    "SEO article",
    "content SEO",
    "AI writing",
    "SERP research",
    "SEO outline",
    "Tavily",
    "Gemini",
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
    description: SITE_DESCRIPTION,
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
    description: SITE_DESCRIPTION,
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
        className={`${abril.variable} ${lora.variable} ${spaceMono.variable} page-grid`}
      >
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
          <div className="relative z-10 flex min-h-screen flex-col">
            <SiteHeader />
            <div className="flex-1">{children}</div>
            <SiteFooter />
            <SiteChatWidget />
            <ExitIntentPopup />
            <Link
              href="/seo-agent"
              className="fixed bottom-5 left-5 z-30 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 font-mono text-xs text-accent shadow-lg transition-colors hover:bg-accent/20"
            >
              Upgrade to full pipeline
            </Link>
            <Link
              href="/seo-agent"
              className="fixed bottom-5 right-5 z-30 rounded-full bg-accent px-4 py-2 font-mono text-xs text-background shadow-lg transition-opacity hover:opacity-90"
            >
              Generate SEO Article
            </Link>
          </div>
        </Providers>
      </body>
    </html>
  );
}
