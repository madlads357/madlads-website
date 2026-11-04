import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SharedPassportView, sharedMetadata } from "@/components/passport/SharedPassportView";
import { readShareToken } from "@/lib/passport-share";

// A shared passport from a signed link (used when there is no database). See lib/passport-share.ts.
type Props = { params: Promise<{ token: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return sharedMetadata(readShareToken((await params).token));
}

export default async function SharedPassportPage({ params }: Props) {
  const p = readShareToken((await params).token);
  if (!p) notFound();
  return <SharedPassportView p={p} />;
}
