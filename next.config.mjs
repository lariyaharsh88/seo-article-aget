/**
 * Fail production deploys loudly when required env is missing, instead of shipping a site
 * whose sitemap, auth or crons silently break (Prisma errors are swallowed at build time).
 */
if (process.env.VERCEL_ENV === "production") {
  const missing = ["DATABASE_URL", "NEXTAUTH_SECRET", "CRON_SECRET"].filter(
    (k) => !process.env[k]?.trim(),
  );
  if (missing.length) {
    throw new Error(`Missing required production env: ${missing.join(", ")}`);
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/article-agent",
        destination: "/seo-agent",
        permanent: true,
      },
      {
        source: "/bulk-article-generate-agent",
        destination: "/bulk-article-creating-agent",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ["google-trends-api"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.rankflowhq.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.public.blob.vercel-storage.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
