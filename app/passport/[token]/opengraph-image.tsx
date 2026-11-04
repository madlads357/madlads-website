import { renderPassportOg, passportOgSize } from "@/lib/passport-og";
import { readShareToken } from "@/lib/passport-share";

// Link preview of a shared passport (signed link). The image itself: lib/passport-og.tsx.
export const alt = "A Mad Lads holder's Lads Passport";
export const size = passportOgSize;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ token: string }> }) {
  return renderPassportOg(readShareToken((await params).token));
}
