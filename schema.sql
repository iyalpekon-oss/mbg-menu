-- Jalankan seluruh file ini di Supabase SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.mbg_days (
 id uuid primary key default gen_random_uuid(),
 service_date date not null unique,
 title text not null default 'Menu MBG',
 energy_kcal numeric,
 protein_g numeric,
 fat_g numeric,
 carb_g numeric,
 energy_akg_pct numeric,
 protein_akg_pct numeric,
 fat_akg_pct numeric,
 carb_akg_pct numeric,
 benefits text,
 published boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create table if not exists public.mbg_items (
 id uuid primary key default gen_random_uuid(),
 day_id uuid not null references public.mbg_days(id) on delete cascade,
 name text not null,
 icon text default '🍽️',
 description text,
 sort_order integer not null default 0,
 image_url text,
 created_at timestamptz not null default now()
);

alter table public.mbg_days enable row level security;
alter table public.mbg_items enable row level security;

drop policy if exists "public can read published days" on public.mbg_days;
create policy "public can read published days" on public.mbg_days for select to anon,authenticated using (published=true);

drop policy if exists "public can read items of published days" on public.mbg_items;
create policy "public can read items of published days" on public.mbg_items for select to anon,authenticated using (exists(select 1 from public.mbg_days d where d.id=day_id and d.published=true));

-- Admin writes: authenticated users can manage the MBG tables.
drop policy if exists "authenticated manage days" on public.mbg_days;
create policy "authenticated manage days" on public.mbg_days for all to authenticated using (true) with check (true);

drop policy if exists "authenticated manage items" on public.mbg_items;
create policy "authenticated manage items" on public.mbg_items for all to authenticated using (true) with check (true);

create index if not exists mbg_days_service_date_idx on public.mbg_days(service_date desc);
create index if not exists mbg_items_day_idx on public.mbg_items(day_id,sort_order);
