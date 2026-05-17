create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.modules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  module_name text not null,
  status text not null default 'active',
  version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, module_key)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  entry_type text not null,
  entry_date date not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists entries_user_date_idx on public.entries(user_id, entry_date desc);
create index if not exists entries_user_module_idx on public.entries(user_id, module_key, entry_type);
create index if not exists entries_payload_gin_idx on public.entries using gin(payload);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  routine_key text not null,
  routine_name text not null,
  schedule_rule text,
  is_active boolean not null default true,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, routine_key)
);

create table if not exists public.routine_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  routine_id uuid references public.routines(id) on delete cascade,
  completion_date date not null,
  status text not null default 'complete',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists routine_completions_user_date_idx on public.routine_completions(user_id, completion_date desc);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  name text not null,
  category text,
  status text not null default 'active',
  price numeric,
  where_to_buy text,
  estimated_duration_days int,
  opened_date date,
  next_reorder_date date,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_user_reorder_idx on public.products(user_id, next_reorder_date);

create table if not exists public.module_versions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module_key text not null,
  version_label text not null,
  source_name text,
  active_from date,
  active_to date,
  notes text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  setting_key text not null,
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(user_id, setting_key)
);

-- Profile creation trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Updated-at helper
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_modules_updated_at on public.modules;
create trigger set_modules_updated_at before update on public.modules for each row execute procedure public.set_updated_at();

drop trigger if exists set_entries_updated_at on public.entries;
create trigger set_entries_updated_at before update on public.entries for each row execute procedure public.set_updated_at();

drop trigger if exists set_routines_updated_at on public.routines;
create trigger set_routines_updated_at before update on public.routines for each row execute procedure public.set_updated_at();

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at before update on public.products for each row execute procedure public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.modules enable row level security;
alter table public.entries enable row level security;
alter table public.routines enable row level security;
alter table public.routine_completions enable row level security;
alter table public.products enable row level security;
alter table public.module_versions enable row level security;
alter table public.settings enable row level security;

-- Drop policies first for repeatable execution
do $$
declare r record;
begin
  for r in select schemaname, tablename, policyname from pg_policies where schemaname = 'public' loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "modules_all_own" on public.modules for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "entries_all_own" on public.entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routines_all_own" on public.routines for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "routine_completions_all_own" on public.routine_completions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "products_all_own" on public.products for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "module_versions_all_own" on public.module_versions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "settings_all_own" on public.settings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
