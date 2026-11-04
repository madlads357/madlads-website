"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CloseIcon } from "@/components/Icons";
import { useDialogFocus } from "@/lib/useDialogFocus";
import { Passport, type PassportData } from "./Passport";

// The passport window: everything fits on one screen, nothing to scroll.
//   top    title, Passport / Video switch (once the video exists), close
//   middle the passport (sized to the space left) or the video
//   bottom share. In the background: the public link (/passport/<token>) as soon as it opens, then,
//          once the stamps have landed, the image (last frame) and the video (made in the browser).
type Media = { file: File; url: string };
type Video = { step: "waiting" } | { step: "making"; progress: number } | ({ step: "ready" } & Media) | { step: "failed" };

const asMedia = (blob: Blob, name: string): Media => ({ file: new File([blob], name, { type: blob.type }), url: URL.createObjectURL(blob) });

export function PassportWindow({ data, onClose }: { data: PassportData; onClose: () => void }) {
  const root = useRef<HTMLDivElement>(null);
  const passport = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<"passport" | "video">("passport");
  const [link, setLink] = useState<string | null>(null);
  const [image, setImage] = useState<Media | null>(null);
  const [video, setVideo] = useState<Video>({ step: "waiting" });
  const [note, setNote] = useState<string | null>(null);
  const [menu, setMenu] = useState(false);
  useDialogFocus(root);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // The public link to this passport, made on the server from the session.
  useEffect(() => {
    fetch("/api/passport/share", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo: data.photo }) })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { url?: string } | null) => j?.url && setLink(j.url))
      .catch(() => {});
  }, [data.photo]);

  // Image and video, once the passport has opened and its stamps have landed (keeps the animation smooth).
  useEffect(() => {
    let cancelled = false;
    const urls: string[] = [];
    const t = setTimeout(async () => {
      const el = passport.current?.querySelector<HTMLElement>(".pp");
      if (!el) return;
      setVideo({ step: "making", progress: 0 });
      try {
        const { makePassportMedia } = await import("./video"); // loaded only here
        const blob = await makePassportMedia(
          el,
          data,
          (png) => {
            if (cancelled) return;
            const m = asMedia(png, "lads-passport.png");
            urls.push(m.url);
            setImage(m);
          },
          (progress) => !cancelled && setVideo({ step: "making", progress }),
        );
        if (cancelled) return;
        const m = asMedia(blob, "lads-passport.mp4");
        urls.push(m.url);
        setVideo({ step: "ready", ...m });
      } catch {
        if (!cancelled) setVideo({ step: "failed" });
      }
    }, 3200);
    return () => {
      cancelled = true;
      clearTimeout(t);
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
    // made once per window: the passport doesn't change while it is open
  }, []);

  const days = data.since ? Math.floor((Date.now() - new Date(data.since).getTime()) / 86_400_000) : null;
  const message = `My Lads Passport.${days ? ` ${days.toLocaleString("en-US")} days Mad.` : ""} Fock it.`;
  const url = link ?? window.location.origin;
  const say = (text: string) => {
    setNote(text);
    window.setTimeout(() => setNote((n) => (n === text ? null : n)), 3500);
  };

  const save = (m: Media) => {
    const a = document.createElement("a");
    a.href = m.url;
    a.download = m.file.name;
    a.click();
  };
  const shareFile = video.step === "ready" ? video.file : image?.file;
  const canShare = !!shareFile && typeof navigator.canShare === "function" && navigator.canShare({ files: [shareFile] });
  const share = async () => {
    if (!shareFile) return;
    try {
      await navigator.share({ files: [shareFile], text: `${message} ${url}`, title: "My Lads Passport" });
    } catch {
      /* closed the share sheet: nothing to do */
    }
  };
  // The link shows the passport card on X. X can't receive a video through a link, so say how to add it.
  const postOnX = () => {
    window.open(`https://x.com/intent/post?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
    if (video.step === "ready") say("Want the video in your post? Download it and add it on X.");
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      say("Link copied.");
    } catch {
      say("Couldn’t copy the link.");
    }
  };
  const copyImage = async () => {
    if (!image) return;
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": image.file })]);
      say("Image copied: paste it anywhere.");
    } catch {
      say("This browser can’t copy images. Use Download instead.");
    }
  };

  const pill = "rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-default disabled:opacity-50 md:px-5";
  const primary = `${pill} bg-white text-ink hover:bg-red hover:text-white`;
  const secondary = `${pill} bg-white/10 ring-1 ring-white/25 hover:bg-white/20`;

  return (
    <div ref={root} className="fixed inset-0 z-[80] flex flex-col bg-[#1a0508]/90 text-white backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Your Lads Passport" data-lenis-prevent>
      <header className="flex items-center justify-between gap-4 px-4 pt-[max(12px,env(safe-area-inset-top))] pb-3 md:px-6">
        <p className="t-eyebrow text-white/60">Your Lads Passport</p>
        {video.step === "ready" && (
          <div className="flex rounded-full bg-white/10 p-1 text-sm font-semibold" role="tablist" aria-label="Show">
            {(["passport", "video"] as const).map((v) => (
              <button
                key={v}
                type="button"
                role="tab"
                aria-selected={view === v}
                onClick={() => setView(v)}
                className={`rounded-full px-4 py-1.5 capitalize transition-colors ${view === v ? "bg-white text-ink" : "text-white/70 hover:text-white"}`}
              >
                {v}
              </button>
            ))}
          </div>
        )}
        <button type="button" onClick={onClose} data-autofocus aria-label="Close" className="grid size-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 transition-colors hover:bg-white/20">
          <CloseIcon className="size-5" />
        </button>
      </header>

      {/* The space left: the passport sizes itself to it (--pp-avail-h, in this container's height units) */}
      <main className="relative min-h-0 flex-1 px-4 [container-type:size]">
        <div ref={passport} className={`flex h-full flex-col justify-center ${view === "video" ? "hidden" : ""}`} style={{ "--pp-avail-h": "calc(100cqh - 44px)" } as CSSProperties}>
          <Passport autoOpen onDark data={data} />
        </div>
        {view === "video" && video.step === "ready" && (
          <div className="grid h-full place-items-center">
            <video src={video.url} autoPlay loop playsInline controls className="aspect-square w-[min(100cqh,100cqw)] rounded-xl shadow-2xl ring-1 ring-white/20" />
          </div>
        )}
      </main>

      <footer className="flex flex-col items-center gap-2 px-4 pt-3 pb-[max(16px,env(safe-area-inset-bottom))]">
        {image ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {canShare && (
              <button type="button" onClick={share} className={primary}>
                Share
              </button>
            )}
            <button type="button" onClick={postOnX} className={canShare ? secondary : primary}>
              Post on X
            </button>
            <button type="button" onClick={copyLink} disabled={!link} className={secondary}>
              Copy link
            </button>
            <button type="button" onClick={copyImage} className={`${secondary} max-sm:hidden`}>
              Copy image
            </button>
            <div className="relative">
              <button type="button" onClick={() => setMenu((m) => !m)} aria-expanded={menu} aria-haspopup="menu" className={secondary}>
                Download ▾
              </button>
              {menu && (
                <div role="menu" className="absolute right-0 bottom-full mb-2 w-44 animate-[pop_160ms_ease-out] rounded-xl bg-surface p-1.5 text-ink shadow-xl">
                  <button
                    type="button"
                    role="menuitem"
                    disabled={video.step !== "ready"}
                    onClick={() => {
                      if (video.step === "ready") save(video);
                      setMenu(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-sunken disabled:text-muted"
                  >
                    Video (MP4){video.step === "making" ? ` · ${Math.round(video.progress * 100)}%` : ""}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      save(image);
                      setMenu(false);
                    }}
                    className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-medium hover:bg-sunken"
                  >
                    Image (PNG)
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : video.step === "failed" ? (
          <p className="text-sm text-white/70">Sharing isn’t available in this browser. Try Chrome, Edge or Safari.</p>
        ) : (
          <p className="flex h-[42px] items-center gap-3 text-sm font-semibold text-white/70" role="status">
            <span className="h-1.5 w-32 overflow-hidden rounded-full bg-white/15">
              <span className="block h-full w-1/3 animate-pulse rounded-full bg-white/80" />
            </span>
            Preparing your passport to share…
          </p>
        )}
        <p className="h-4 text-xs text-white/60" role="status" aria-live="polite">
          {note}
        </p>
      </footer>
    </div>
  );
}
