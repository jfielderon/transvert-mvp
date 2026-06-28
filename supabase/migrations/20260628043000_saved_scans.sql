create table if not exists public.saved_scans (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  mode text,
  source text,
  ocr_status text,
  fx_status text,
  original_text text,
  translated_text text,
  price_count integer default 0,
  estimated_total_gbp numeric,
  payload jsonb
);

alter table public.saved_scans enable row level security;

drop policy if exists "saved scans insert own or anonymous" on public.saved_scans;
create policy "saved scans insert own or anonymous" on public.saved_scans
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "saved scans read own" on public.saved_scans;
create policy "saved scans read own" on public.saved_scans
  for select using (auth.uid() = user_id or user_id is null);

drop policy if exists "saved scans update own" on public.saved_scans;
create policy "saved scans update own" on public.saved_scans
  for update using (auth.uid() = user_id or user_id is null) with check (auth.uid() = user_id or user_id is null);
