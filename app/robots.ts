import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Served at /robots.txt. Everything is public; points crawlers to the sitemap.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
