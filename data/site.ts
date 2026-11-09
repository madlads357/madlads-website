// Site-wide links and navigation. Placeholder URLs are marked TODO.

export const nav = [
  { label: "Lore", href: "/lore" },
  { label: "Art", href: "/#art" },
  { label: "MAD LADS", href: "/madlads" },
  { label: "Holders", href: "/#holders" },
];

export const links = {
  // Login buttons: the holder area (Login with Backpack) once NEXT_PUBLIC_HOLDERS_LIVE=1, the homepage
  // Holders section until then. (With Matrica, /api/auth/login goes there and back to /holders.)
  login: process.env.NEXT_PUBLIC_HOLDERS_LIVE === "1" ? "/holders" : "/#holders",
  newsletter: "https://news.madlads.com/",
  playlist: "https://open.spotify.com/playlist/21MkOHQncB1NmB2pCp9wss", // the MAD LADS mix (holder area, backpack)
  backpack: "https://backpack.exchange/",
  x: "https://x.com/MadLads",
  discord: "https://discord.gg/madlads",
  magicEden: "https://magiceden.io/marketplace/mad_lads",
  tensor: "https://www.tensor.trade/trade/madlads",
  foxySwap: "https://famousfoxes.com/foxyswap", // Famous Fox Federation — the only P2P trading tool we point people to
  pressKit: "https://drive.google.com/drive/folders/1gTZ2RnkWtsUG_QNn2NUuY3ILzSvIzgeV",
  pressEmail: "mailto:press@madlads.com", // TODO: confirm the real press contact
  legalEmail: "mailto:legal@madlads.com", // TODO: confirm the real legal/privacy contact
};

// Spotify's player for the playlist (components/holder/Playlist.tsx).
export const spotifyEmbed = links.playlist.replace("open.spotify.com/", "open.spotify.com/embed/");
