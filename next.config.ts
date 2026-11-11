import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework
  // Browser code (the passport prints the site address, lib/site-url.ts) only sees NEXT_PUBLIC_ values, so hand it
  // Vercel's production domain too when NEXT_PUBLIC_SITE_URL is not set.
  env: process.env.NEXT_PUBLIC_SITE_URL || !process.env.VERCEL_PROJECT_PRODUCTION_URL ? {} : { NEXT_PUBLIC_SITE_URL: `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` },
  // Basic security headers on every page. No Content-Security-Policy yet: the site uses inline
  // scripts (intro, structured data) and YouTube embeds, so a CSP needs its own careful pass.
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "Strict-Transport-Security", value: "max-age=63072000" }, // HTTPS only, this domain (subdomains are not ours to decide)
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "X-Frame-Options", value: "SAMEORIGIN" }, // no embedding the site in other sites' frames (clickjacking)
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
      ],
    },
  ],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75],
    // Mad Lads art is loaded on demand by number — never bundled with the site.
    remotePatterns: [
      { protocol: "https", hostname: "prod-image-cdn.tensor.trade", pathname: "/images/**" },
      { protocol: "https", hostname: "madlads.s3.us-west-2.amazonaws.com", pathname: "/images/**" },
      { protocol: "https", hostname: "madlads.s3.us-west-2.amazonaws.com", pathname: "/honoraries/**" },
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" }, // YouTube thumbnails (meetup videos)
      { protocol: "https", hostname: "substackcdn.com", pathname: "/image/**" }, // Mad News covers
    ],
    minimumCacheTTL: 60 * 60 * 24 * 30, // Lads never change: cache optimized images for 30 days
  },
};

export default nextConfig;
