-- Mad Lads site database (Neon Postgres). Apply with: npm run db:setup
-- Safe to run again: everything is "if not exists".

-- Holder preferences and cached data, by holder id ("wallet:<address>", or the Matrica user id).
create table if not exists holder_settings (
  holder_id        text primary key,
  photo            integer,          -- the Lad chosen as passport photo
  since            date,             -- "Mad since", from the blockchain (lib/helius.ts)
  since_checked_at timestamptz,      -- when "since" was last worked out (re-checked after a week)
  updated_at       timestamptz not null default now()
);

-- Public passport links: madlads.com/p/<code>. One link per holder; sharing again refreshes it.
create table if not exists share_links (
  code        text primary key,      -- 8 random characters
  holder_id   text not null unique,
  passport    jsonb not null,        -- what the page shows (lib/passport-share.ts, SharedPassport)
  views       integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  deleted_at  timestamptz            -- set when the holder stops sharing: the link stops working
);

-- Wallet login, vault links: a vault wallet (cold, often a Ledger) lets a hot wallet log in for it.
-- The vault signed the link once (lib/auth/wallet.ts); logging in with the hot wallet then counts
-- the vault's LADS too. The holder removes a link in the holder area.
create table if not exists wallet_links (
  vault       text not null,         -- the wallet holding the LADS (signed the link)
  hot         text not null,         -- the wallet that logs in
  created_at  timestamptz not null default now(),
  primary key (vault, hot)
);
create index if not exists wallet_links_hot on wallet_links (hot);

-- Accounts a holder linked on the profile (Discord and X). One row per holder and provider;
-- an account can belong to one holder only (linking it again from another wallet moves it).
-- No tokens are kept: the account is read once when linked (or refreshed), then the token is revoked.
create table if not exists holder_accounts (
  holder_id   text not null,
  provider    text not null,         -- "discord" | "x"
  account_id  text not null,         -- the provider's user id
  name        text not null,         -- display name / handle
  roles       jsonb,                 -- Discord: the stamp roles held on the MAD LADS server
  linked_at   timestamptz not null default now(),
  primary key (holder_id, provider),
  unique (provider, account_id)
);

-- Wallet login proofs already used, so a signed proof can't be replayed within its 5 minutes
-- (lib/db.ts claimNonce). Rows are only needed until they expire and are cleaned up as new ones arrive.
create table if not exists used_nonces (
  nonce       text primary key,
  expires_at  timestamptz not null
);
