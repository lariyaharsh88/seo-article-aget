/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["google-trends-api"],
  },
  async redirects() {
    return [
      { source: "/news", destination: "/archive/news", permanent: true },
      { source: "/news/:path*", destination: "/archive/news", permanent: true },
      {
        source: "/education-news",
        destination: "/archive/education",
        permanent: true,
      },
      {
        source: "/education-trends",
        destination: "/archive/education",
        permanent: true,
      },
      { source: "/education/:path*", destination: "/archive/education", permanent: true },
      { source: "/exam/:path*", destination: "/archive/education", permanent: true },
      { source: "/nda/:path*", destination: "/archive/education", permanent: true },
    ];
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
