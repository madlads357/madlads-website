import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Nav } from "@/components/Nav";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { ONE_OF_ONE_TYPES, originalImage } from "@/lib/madlads";
import { collection, ladTraits } from "@/lib/madlads-server";

// One Lad's own page: /madlads/4144. Built the first time it is visited, then served ready-made.
// Shareable (its own preview image) and findable ("Mad Lad 4144" in search results).
type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return []; // 9,971 pages: none at build time, each on its first visit
}

const fmt = (n: number) => n.toLocaleString("en-US");
const pct = (s: number) => `${(s * 100).toFixed(s < 0.01 ? 2 : 1)}%`;

function lad(raw: string) {
  const id = Number(raw);
  if (!/^\d{1,5}$/.test(raw) || !collection().byId.has(id)) return null;
  const traits = ladTraits(id)!;
  const type = traits.find((t) => t.name === "Type")?.value;
  const gender = traits.find((t) => t.name === "Gender")?.value;
  return { id, traits, type, gender };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const l = lad((await params).id);
  if (!l) return { title: "MAD LADS not found" };
  const title = `MAD LADS #${l.id}`;
  const key = l.traits
    .filter((t) => t.name !== "Type" && t.name !== "Gender")
    .slice(0, 3)
    .map((t) => `${t.name} ${t.value}`)
    .join(", ");
  const description = `MAD LADS #${l.id}: ${[l.type, l.gender].filter(Boolean).join(", ")}. ${key}. One of ${fmt(collection().lads.length)} MAD LADS on Solana.`;
  return {
    title,
    description,
    alternates: { canonical: `/madlads/${l.id}` },
    openGraph: { title, description },
    twitter: { card: "summary_large_image", site: "@MadLads", title, description },
  };
}

export default async function LadPage({ params }: Props) {
  const l = lad((await params).id);
  if (!l) notFound();
  const { byId, lads } = collection();
  const prev = byId.has(l.id - 1) ? l.id - 1 : null;
  const next = byId.has(l.id + 1) ? l.id + 1 : null;
  const badge = l.type === "Skull" ? "Skull" : l.type && ONE_OF_ONE_TYPES.includes(l.type) ? "1/1" : null;

  return (
    <>
      <Nav />
      <main id="main" className="pt-[72px] md:pt-[88px]">
        <div className="grid gap-10 px-4 py-10 md:px-page md:py-16 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-sunken ring-1 ring-black/5 lg:sticky lg:top-[112px] lg:self-start">
            <Image src={originalImage(l.id)} alt={`MAD LADS #${l.id}`} fill priority quality={75} sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            {badge && <span className="absolute top-4 right-4 rounded-full bg-ink/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-white uppercase backdrop-blur">{badge}</span>}
          </div>

          <div className="flex flex-col gap-8">
            <header className="flex flex-col gap-3">
              <Link href="/madlads" className="t-eyebrow text-accent hover:underline">
                ← All MAD LADS
              </Link>
              <h1 className="t-display-l tabular-nums">#{l.id}</h1>
              <p className="t-body-l text-muted">
                {[l.type, l.gender].filter(Boolean).join(" · ")} · one of {fmt(lads.length)} MAD LADS
              </p>
            </header>

            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {l.traits.map((t) => (
                <div key={t.name}>
                  <Link
                    href={`/madlads?${new URLSearchParams({ [t.name.toLowerCase()]: t.value })}`}
                    title={`See every LAD with ${t.name}: ${t.value}`}
                    className="flex h-full flex-col gap-1 rounded-xl bg-surface p-3 ring-1 ring-line transition-all hover:-translate-y-0.5 hover:ring-ink"
                  >
                    <dt className="t-eyebrow text-muted">{t.name}</dt>
                    <dd className="leading-tight font-semibold">{t.value}</dd>
                    <dd className="mt-auto pt-1">
                      <span className="block h-1 overflow-hidden rounded-full bg-sunken">
                        <span className="block h-full rounded-full bg-accent" style={{ width: `${Math.max(2, Math.min(100, t.share * 100))}%` }} />
                      </span>
                      <span className="mt-1 block text-[11px] text-muted">{t.count === 1 ? "1 of 1" : `${fmt(t.count)} LADS · ${pct(t.share)}`}</span>
                    </dd>
                  </Link>
                </div>
              ))}
            </dl>

            <div className="flex flex-wrap items-center gap-3">
              <Button href={`/madlads?id=${l.id}`}>Open in the explorer</Button>
              <Button href={originalImage(l.id)} variant="secondary" external>
                Full-resolution image ↗
              </Button>
            </div>

            <nav aria-label="Other LADS" className="flex justify-between border-t border-line pt-6 text-sm font-semibold">
              {prev ? (
                <Link href={`/madlads/${prev}`} className="hover:text-accent">
                  ← #{prev}
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link href={`/madlads/${next}`} className="hover:text-accent">
                  #{next} →
                </Link>
              )}
            </nav>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
