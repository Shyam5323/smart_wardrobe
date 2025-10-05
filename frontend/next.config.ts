import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/uploads/**",
      },
      {
        protocol: "https",
        hostname: "smart-wardrobe-ub5x.onrender.com",
        pathname: "/uploads/**",
      },
      {
        protocol: "http",
        hostname: "smart-wardrobe-ub5x.onrender.com",
        pathname: "/uploads/**",
      },
    ],
  },
};

export default nextConfig;
