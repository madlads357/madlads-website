import { renderPassportOg, passportOgSize } from "@/lib/passport-og";
import { readShareLink } from "@/lib/passport-share";

// Link preview of a shared passport (short link). The image itself: lib/passport-og.tsx.
export const alt = "A holder's MAD LADS Passport";
export const size = passportOgSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ code: string }> }) {
  return renderPassportOg(await readShareLink((await params).code).catch(() => null));
}
