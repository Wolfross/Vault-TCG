-- Run this in your Supabase project under SQL Editor
-- One-time setup. Creates the collection table with all variant fields.

create table if not exists collection (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid,                        -- leave null for now, add auth later
  card_id        text not null,               -- pokemontcg.io ID e.g. "base1-4"
  name           text not null,
  set_name       text,
  set_id         text,
  number         text,
  image_url      text,
  icon           text,
  color          text,
  era            text,
  holo           boolean default false,
  rarity         text,

  -- Variant fields (the anti-Collectr stuff)
  print_variant  text,    -- '1st_edition' | 'shadowless' | 'unlimited' | 'unsure'
  language       text,    -- 'en' | 'jp' | 'other'
  card_variant   text,    -- 'sar' | 'reverse' | 'secret' etc for modern sets
  flagged        boolean default false,  -- true = variant not confirmed

  -- Condition
  condition      text,    -- 'NM' | 'LP' | 'MP' | 'HP' | 'D'
  grade          text,    -- 'Raw' | 'PSA 9' | 'PSA 10' | 'BGS 9.5' etc

  -- Value tracking
  current_price  numeric,
  purchase_price numeric,
  week_change    numeric, -- % change last 7 days

  quantity       integer default 1,
  notes          text,
  added_at       timestamptz default now(),
  updated_at     timestamptz default now()
);

-- Index for fast lookups
create index if not exists idx_collection_card_id on collection(card_id);
create index if not exists idx_collection_added   on collection(added_at desc);
create index if not exists idx_collection_flagged on collection(flagged) where flagged = true;

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger collection_updated_at
before update on collection
for each row execute function update_updated_at();

-- Allow public access for now (add auth later)
alter table collection enable row level security;
create policy "Allow all" on collection for all using (true);
