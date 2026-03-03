import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    domains: ["ipfs.io", "gateway.pinata.cloud"],
  },
};

export default nextConfig;
