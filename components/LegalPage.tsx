import type { ReactNode } from "react";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { SmoothScroll } from "@/components/SmoothScroll";

export type LegalSection = { id: string; title: string; body: ReactNode };

// Shared layout for the Terms and Privacy pages: title, short summary, a sticky contents list and the sections.
export function LegalPage({
  title,
  updated,
  summary,
  sections,
}: {
  title: string;
  updated: string;
  summary: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <SmoothScroll />
      <Nav />
      <main id="main" className="pt-[72px] md:pt-[88px]">
        <header className="border-b border-line px-4 pt-16 pb-12 md:px-page md:pt-24 md:pb-16">
          <p className="t-eyebrow text-accent">Legal</p>
          <h1 className="t-display-l mt-8">{title}</h1>
          <p className="mt-6 text-sm font-semibold text-muted">Last updated {updated}</p>
          <div className="t-body-l mt-8 max-w-[720px]">{summary}</div>
        </header>

        <div className="grid gap-12 px-4 py-16 md:px-page md:py-24 lg:grid-cols-[240px_1fr] lg:gap-20">
          <nav aria-label="On this page" className="lg:sticky lg:top-32 lg:self-start">
            <p className="t-eyebrow text-muted">On this page</p>
            <ol className="mt-4 flex flex-col gap-2.5 text-[15px]">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex gap-3 text-muted hover:text-ink">
                    <span className="w-5 shrink-0 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                    {s.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="flex max-w-[720px] flex-col gap-14">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-32">
                <p className="t-eyebrow text-accent">{String(i + 1).padStart(2, "0")}</p>
                <h2 className="mt-3 text-[clamp(1.5rem,2.4vw,2rem)] leading-tight font-bold tracking-[-0.03em]">{s.title}</h2>
                <div className="legal-prose mt-5">{s.body}</div>
              </section>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
