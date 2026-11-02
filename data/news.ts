// Latest Mad News issues (news.madlads.com). Static for now.
// TODO: fetch from the Substack archive API (https://news.madlads.com/api/v1/archive) at build time.

export type NewsItem = { date: string; title: string; href: string; image: string };

export const news: NewsItem[] = [
  {
    date: "Jun 22, 2026",
    title: "Mad News: June 2026 — Backpack Token, SpaceX, lot of fun",
    href: "https://news.madlads.com/p/mad-news-june-2026",
    image: "/lads/3982.jpg",
  },
  {
    date: "May 24, 2026",
    title: "Mad News: May 2026 — Sell in May and go away?",
    href: "https://news.madlads.com/p/mad-news-may-2026",
    image: "/lads/1742.jpg",
  },
  {
    date: "Apr 21, 2026",
    title: "Mad News: April 2026 — The aftermath; 3 years anniversary",
    href: "https://news.madlads.com/p/mad-news-april-2026",
    image: "/lads/7278.jpg",
  },
];
