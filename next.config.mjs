/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/article-agent",
        destination: "/seo-agent",
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
