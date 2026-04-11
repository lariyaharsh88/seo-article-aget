import type { Metadata, Viewport } from "next";
import { Abril_Fatface, Lora, Space_Mono } from "next/font/google";
import { SiteHeader } from "@/components/SiteHeader";
import { StructuredData } from "@/components/StructuredData";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/seo-site";
import { getSiteUrl } from "@/lib/site-url";
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c0f14",
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "SEO article",
    "content SEO",
    "AI writing",
    "SERP research",
    "SEO outline",
    "Tavily",
    "Gemini",
    "long-form article",
    "meta description",
    "education trends",
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
  },
  twitter: {
    card: "summary",
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
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
        <StructuredData />
        <div className="relative z-10">
          <SiteHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
