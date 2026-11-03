import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

// Served at /sitemap.xml. Add new pages here.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/madlads`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/lore`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
