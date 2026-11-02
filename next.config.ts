import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
    // Mad Lads art is loaded on demand by number — never bundled with the site.
    remotePatterns: [
      { protocol: "https", hostname: "prod-image-cdn.tensor.trade", pathname: "/images/**" },
      { protocol: "https", hostname: "madlads.s3.us-west-2.amazonaws.com", pathname: "/images/**" },
      { protocol: "https", hostname: "madlads.s3.us-west-2.amazonaws.com", pathname: "/honoraries/**" },
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // Lads never change: cache optimized images for 30 days
  },
};

export default nextConfig;
