import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "localhost",
      "cdn.vectorstock.com",  // ✅ Add this for mystery box images
      "placehold.co",         // ✅ If you use placeholder images
      "images.unsplash.com",  // ✅ Optional: for future image needs
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.vectorstock.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      // Add more patterns as needed
    ],
  },
};

export default nextConfig;