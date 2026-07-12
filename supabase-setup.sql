-- Run this once in Supabase: Project → SQL Editor → New query → paste → Run

create table if not exists kv_store (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

-- Enable realtime updates for live sync across devices
alter publication supabase_realtime add table kv_store;

-- Row Level Security: this app has no server-side login, so we allow the
-- public "anon" key to read and write. Anyone with your Supabase URL +
-- anon key could read/write this data — acceptable for an internal tool,
-- but do not share those keys publicly. Ask if you want a locked-down
-- version with real authenticated access instead.
alter table kv_store enable row level security;

create policy "Allow anon read" on kv_store
  for select using (true);

create policy "Allow anon write" on kv_store
  for insert with check (true);

create policy "Allow anon update" on kv_store
  for update using (true);
