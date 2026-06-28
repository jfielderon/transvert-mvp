-- Transvert foundation schema for live testing

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  first_name text,
  full_name text,
  avatar_url text,
  provider text,
  preferred_language text default 'English',
  preferred_currency text default 'GBP',
  marketing_opt_in boolean default true,
  atm_data_opt_in boolean default true,
  joined_at timestamptz default now(),
  last_seen_at timestamptz default now()
);

create table if not exists public.scan_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  scan_id text,
  verdict text check (verdict in ('right','wrong')),
  mode text,
  original_text text,
  detected_price_count integer,
  created_at timestamptz default now()
);

create table if not exists public.atm_fee_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  atm_name text not null,
  atm_provider text,
  location_label text,
  latitude double precision,
  longitude double precision,
  fee_currency text default 'EUR',
  fee_amount numeric,
  fee_label text,
  card_country text default 'GB',
  card_provider text,
  was_free boolean,
  source text default 'user_report',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.scan_feedback enable row level security;
alter table public.atm_fee_reports enable row level security;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles insert own" on public.profiles;
create policy "profiles insert own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "scan feedback insert own" on public.scan_feedback;
create policy "scan feedback insert own" on public.scan_feedback
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "scan feedback read own" on public.scan_feedback;
create policy "scan feedback read own" on public.scan_feedback
  for select using (auth.uid() = user_id);

drop policy if exists "atm reports insert own or anonymous" on public.atm_fee_reports;
create policy "atm reports insert own or anonymous" on public.atm_fee_reports
  for insert with check (auth.uid() = user_id or user_id is null);

drop policy if exists "atm reports public read" on public.atm_fee_reports;
create policy "atm reports public read" on public.atm_fee_reports
  for select using (true);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name, full_name, avatar_url, provider)
  values (
    new.id,
    new.email,
    coalesce(split_part(new.raw_user_meta_data->>'full_name', ' ', 1), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_app_meta_data->>'provider'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    provider = coalesce(excluded.provider, profiles.provider),
    last_seen_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
