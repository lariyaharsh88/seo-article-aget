/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["google-trends-api"],
  },
};

export default nextConfig;
