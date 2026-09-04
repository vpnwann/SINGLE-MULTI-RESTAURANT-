import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },

 {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
        {
        protocol: "https",
        hostname: "encrypted-tbn0.gstatic.com",
      },


    ],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;