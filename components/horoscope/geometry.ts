// Where the curved pieces of the painted layers are, measured on the pictures themselves, so live text can follow them.
// A quadratic curve: start, control point, end. Coordinates are those of the picture file.

// The middle of the banner at the bottom of card-front.webp (484 x 805): it arches up in the middle.
export const BANNER = { p0: [60, 655.6], p1: [242, 601.4], p2: [424, 655.6] } as const;
export const BANNER_PATH = `M ${BANNER.p0.join(",")} Q ${BANNER.p1.join(",")} ${BANNER.p2.join(",")}`;

// The ribbon under the title in title.webp (870 x 399). Its band is nearly straight between x = 190 and x = 650 (the ends curl
// away), so this is not its middle line but an arch that stays inside the band: 315 in the middle, 336 at the ends.
export const RIBBON = { p0: [190, 336], p1: [420, 294], p2: [650, 336] } as const;
export const RIBBON_PATH = `M ${RIBBON.p0.join(",")} Q ${RIBBON.p1.join(",")} ${RIBBON.p2.join(",")}`;
