import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false, // don't advertise the framework
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
