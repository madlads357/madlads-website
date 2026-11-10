// Latest Mad News issues, fetched from the Substack archive API at build time and refreshed
// in the background every 6 hours (ISR). Falls back to the static list in data/news.ts if
// Substack is unreachable, so the homepage always builds.
import { news as fallback, type NewsItem } from "@/data/news";

// No `offset` param: Substack now rejects it with a 400 (pagination moved to a cursor).
const ARCHIVE = "https://news.madlads.com/api/v1/archive?sort=new&limit=12";
export const NEWS_REVALIDATE = 60 * 60 * 6;

type SubstackPost = {
  title?: string;
  subtitle?: string | null;
  post_date?: string;
  canonical_url?: string;
  cover_image?: string | null;
  audience?: string;
  type?: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

export async function getLatestNews(limit = 3): Promise<NewsItem[]> {
  try {
    const res = await fetch(ARCHIVE, { next: { revalidate: NEWS_REVALIDATE }, headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    // The API now wraps the list as { posts, nextCursor }; it used to return a bare array.
    const body = (await res.json()) as SubstackPost[] | { posts?: SubstackPost[] };
    const posts = Array.isArray(body) ? body : (body.posts ?? []);
    const items = posts
      .filter((p) => p.title && p.canonical_url && p.post_date && p.audience !== "only_paid")
      .slice(0, limit)
      .map((p) => ({
        date: fmtDate(p.post_date!),
        title: p.title!.replace(/\bMad News\b/gi, "MAD News").replace(/\bMad Lads\b/gi, "MAD LADS"), // the site's spelling
        subtitle: p.subtitle || undefined,
        href: p.canonical_url!,
        image: p.cover_image || fallback[0].image,
      }));
    return items.length ? items : fallback.slice(0, limit);
  } catch (e) {
    console.warn("[news] Falling back to static news:", (e as Error).message);
    return fallback.slice(0, limit);
  }
}
