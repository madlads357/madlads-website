"use client";

import Image from "next/image";
import { useState, type CSSProperties } from "react";
import type { LoreImage, LoreMedia, LoreTweet } from "@/data/lore";
import { Lightbox } from "@/components/beyond/Lightbox";

// The photos, screenshots and tweets of one Lore chapter, as a masonry wall.
// Photos open full screen (← → to browse the chapter, Esc to close).
export function ChapterMedia({ media, label }: { media: LoreMedia[]; label: string }) {
  const photos = media.filter((m): m is LoreImage => m.kind === "image");
  const [open, setOpen] = useState<number | null>(null);
  const close = () => setOpen(null);
  const step = (d: number) => setOpen((i) => (i === null ? i : (i + d + photos.length) % photos.length));

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {media.map((m, i) =>
          m.kind === "tweet" ? (
            <div key={i} className="reveal break-inside-avoid" style={{ "--i": i % 3 } as CSSProperties}>
              <TweetCard tweet={m} />
            </div>
          ) : (
            <figure key={m.src} className="reveal group break-inside-avoid" style={{ "--i": i % 3 } as CSSProperties}>
              <button
                type="button"
                onClick={() => setOpen(photos.indexOf(m))}
                aria-label={`Enlarge: ${m.caption}`}
                className="block w-full cursor-zoom-in overflow-hidden rounded-xl bg-sunken ring-1 ring-black/5"
              >
                <Image
                  src={m.src}
                  alt={m.alt}
                  width={m.w}
                  height={m.h}
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className="h-auto w-full transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </button>
              <figcaption className="mt-2 text-sm text-muted">{m.caption}</figcaption>
            </figure>
          ),
        )}
      </div>
      {open !== null && (
        <Lightbox
          photo={{ ...photos[open], where: label }}
          index={open}
          total={photos.length}
          onClose={close}
          onPrev={photos.length > 1 ? () => step(-1) : undefined}
          onNext={photos.length > 1 ? () => step(1) : undefined}
        />
      )}
    </>
  );
}

// A quoted post, styled like the site (no X embed script). Links to the original when known.
function TweetCard({ tweet }: { tweet: LoreTweet }) {
  const body = (
    <>
      <div className="flex items-center gap-3">
        {tweet.avatar ? (
          <Image src={tweet.avatar} alt="" width={40} height={40} className="size-10 shrink-0 rounded-full bg-sunken object-cover ring-1 ring-black/5" />
        ) : (
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white" aria-hidden>
            {tweet.name.charAt(0)}
          </span>
        )}
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate font-semibold">{tweet.name}</span>
          <span className="block truncate text-sm text-muted">@{tweet.handle}</span>
        </span>
        <XLogo className="size-4 shrink-0" />
      </div>
      <p className="mt-4 text-[17px] leading-snug whitespace-pre-line">{tweet.text}</p>
      {tweet.image && (
        <Image
          src={tweet.image.src}
          alt={tweet.image.alt}
          width={tweet.image.w}
          height={tweet.image.h}
          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 42vw, 90vw"
          className="mt-4 h-auto max-h-[420px] w-full rounded-lg object-cover ring-1 ring-black/5"
        />
      )}
      <p className="mt-4 flex items-center justify-between text-sm text-muted">
        <span>{tweet.date}</span>
        {tweet.url && <span className="font-semibold text-accent group-hover:underline">View post ↗</span>}
      </p>
    </>
  );
  const cls = "group block rounded-xl bg-surface p-5 ring-1 ring-line transition-shadow duration-300";
  return tweet.url ? (
    <a href={tweet.url} target="_blank" rel="noopener noreferrer" className={`${cls} hover:shadow-[0_18px_40px_-24px_rgba(17,17,17,0.45)] hover:ring-ink`}>
      {body}
    </a>
  ) : (
    <div className={cls}>{body}</div>
  );
}

const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
