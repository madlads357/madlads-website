// Fallback news, used only if the Mad News Substack can't be reached at build time.
// The live list comes from lib/news.ts (news.madlads.com archive API).

export type NewsItem = { date: string; title: string; subtitle?: string; href: string; image: string };

export const news: NewsItem[] = [
  {
    date: "Jun 22, 2026",
    title: "MAD News: June 2026",
    subtitle: "Backpack Token, SpaceX, lot of fun",
    href: "https://news.madlads.com/p/mad-news-june-2026",
    image: "/lads/3982.jpg",
  },
  {
    date: "May 24, 2026",
    title: "MAD News: May 2026",
    subtitle: "Sell in May and go away?",
    href: "https://news.madlads.com/p/mad-news-may-2026",
    image: "/lads/1742.jpg",
  },
  {
    date: "Apr 21, 2026",
    title: "MAD News: April 2026",
    subtitle: "The aftermath; 3 years anniversary",
    href: "https://news.madlads.com/p/mad-news-april-2026",
    image: "/lads/7278.jpg",
  },
];
