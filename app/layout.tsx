import type { Metadata } from "next";
import { Abril_Fatface, Lora, Space_Mono } from "next/font/google";
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

export const metadata: Metadata = {
  title: "SEO Article Agent",
  description:
    "Research, outline, and draft long-form SEO articles with Gemini, Tavily, and Serper.",
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
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
