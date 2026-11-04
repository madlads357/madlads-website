// The Dressing Room accessories, moved from the Culture Hub (madlads-hub.xyz/dressing-room).
// Each one is an image the size of a Lad (2048×2560, transparent) laid over it:
//   public/dressing-room/layouts/<id>.webp     for Lads
//   public/dressing-room/layouts/<id>_w.webp   for Lassies (when `lassie` is true)
//   public/dressing-room/icons/<icon>.webp     the button picture
// Order = stacking order (first is drawn first, under the others), as on the hub.
// `grey`: the Lad itself turns black and white under this accessory.
export type Accessory = { id: string; label: string; icon: string; lassie: boolean; grey?: true };

export const accessories: Accessory[] = [
  { id: "laser", label: "Laser Eyes", icon: "laser", lassie: true },
  { id: "pit", label: "Pit ViperZ", icon: "pit", lassie: true },
  { id: "flames", label: "Flames", icon: "flames", lassie: true },
  { id: "albert", label: "Albert", icon: "albert", lassie: true },
  { id: "monad", label: "NadLads", icon: "monad", lassie: true },
  { id: "monad2", label: "NadLads 2", icon: "monad2", lassie: true },
  { id: "minichog", label: "Chog", icon: "minichog", lassie: true },
  { id: "lyraffe", label: "Lyraffe", icon: "lyraffe", lassie: true },
  { id: "luffy", label: "Luffy’s Hat", icon: "luffy", lassie: true },
  { id: "pew", label: "Pew", icon: "pewpew", lassie: true },
  { id: "dealwit", label: "Deal w it 420", icon: "dealwitcig", lassie: true },
  { id: "dealwitnocig", label: "Deal w it", icon: "dealwit", lassie: true },
  { id: "pyth", label: "Pyth", icon: "pyth", lassie: true },
  { id: "santa", label: "Santa", icon: "santa", lassie: true },
  { id: "apple", label: "Apple", icon: "apple", lassie: false, grey: true },
];

export const layoutSrc = (a: Accessory, lassie: boolean) => `/dressing-room/layouts/${a.id}${lassie && a.lassie ? "_w" : ""}.webp`;
export const iconSrc = (a: Accessory) => `/dressing-room/icons/${a.icon}.webp`;
