import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { SharedPassportView, sharedMetadata } from "@/components/passport/SharedPassportView";
import { isBot, readShareLink } from "@/lib/passport-share";

// A shared passport from a short link (madlads.com/p/<code>, stored in the database).
// Each visit by a person adds a view; link previews (X, Discord…) don't. See lib/passport-share.ts.
type Props = { params: Promise<{ code: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return sharedMetadata(await readShareLink((await params).code).catch(() => null));
}

export default async function ShortLinkPage({ params }: Props) {
  const count = !isBot((await headers()).get("user-agent"));
  const p = await readShareLink((await params).code, count).catch(() => null);
  if (!p) notFound();
  return <SharedPassportView p={p} />;
}
