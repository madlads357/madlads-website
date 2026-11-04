-- Mad Lads site database (Neon Postgres). Apply with: npm run db:setup
-- Safe to run again: everything is "if not exists".

-- Holder preferences and cached data, by Matrica user id.
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
