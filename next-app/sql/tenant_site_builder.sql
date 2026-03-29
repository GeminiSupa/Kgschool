-- Multi-tenant website/page-builder minimal schema (Postgres + Supabase RLS)
-- Apply this in your Supabase SQL editor.

create table if not exists public.kita_sites (
  kita_id uuid primary key references public.kitas(id) on delete cascade,
  slug text unique not null,
  published boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.kita_sites enable row level security;

-- Admins of a kita can manage that kita's site config.
create policy if not exists "kita_sites_admin_manage"
on public.kita_sites
for all
using (
  exists (
    select 1
    from public.organization_members om
    join public.profiles p on p.id = om.profile_id
    where om.profile_id = auth.uid()
      and om.kita_id = kita_sites.kita_id
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.organization_members om
    join public.profiles p on p.id = om.profile_id
    where om.profile_id = auth.uid()
      and om.kita_id = kita_sites.kita_id
      and p.role = 'admin'
  )
);

-- Public can read published sites by slug.
create policy if not exists "kita_sites_public_read_published"
on public.kita_sites
for select
using (published = true);

