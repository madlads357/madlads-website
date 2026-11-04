import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";
import { collection } from "@/lib/madlads-server";

// Served at /sitemap.xml. Add new pages here. Includes every Lad's page (/madlads/<id>).
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/madlads`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${siteUrl}/lore`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${siteUrl}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${siteUrl}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    ...collection().lads.map((l) => ({ url: `${siteUrl}/madlads/${l[0]}`, changeFrequency: "yearly" as const, priority: 0.5 })),
  ];
}
