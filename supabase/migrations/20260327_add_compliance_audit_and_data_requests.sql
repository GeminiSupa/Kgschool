-- Compliance schema for municipal/public-sector readiness.
-- Adds:
-- 1) consent event logging
-- 2) immutable-style audit/security event log
-- 3) data subject rights request tracking (DSR)

create extension if not exists pgcrypto;

create table if not exists public.compliance_consent_events (
  id uuid primary key default gen_random_uuid(),
  kita_id uuid null,
  subject_profile_id uuid null references public.profiles(id) on delete set null,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  consent_type text not null,
  legal_basis text null,
  status text not null check (status in ('granted', 'withdrawn', 'expired')),
  source text not null default 'web',
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_compliance_consent_events_kita_id
  on public.compliance_consent_events (kita_id);
create index if not exists idx_compliance_consent_events_subject
  on public.compliance_consent_events (subject_profile_id);
create index if not exists idx_compliance_consent_events_type_status
  on public.compliance_consent_events (consent_type, status);

create table if not exists public.compliance_audit_events (
  id uuid primary key default gen_random_uuid(),
  kita_id uuid null,
  actor_profile_id uuid null references public.profiles(id) on delete set null,
  actor_role text null,
  event_type text not null,
  resource_type text null,
  resource_id text null,
  severity text not null default 'info' check (severity in ('info', 'warning', 'critical')),
  message text null,
  ip_address text null,
  user_agent text null,
  event_data jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_compliance_audit_events_kita_id
  on public.compliance_audit_events (kita_id);
create index if not exists idx_compliance_audit_events_type
  on public.compliance_audit_events (event_type);
create index if not exists idx_compliance_audit_events_occurred_at
  on public.compliance_audit_events (occurred_at desc);
create index if not exists idx_compliance_audit_events_severity
  on public.compliance_audit_events (severity);

create table if not exists public.compliance_data_subject_requests (
  id uuid primary key default gen_random_uuid(),
  kita_id uuid null,
  requester_profile_id uuid null references public.profiles(id) on delete set null,
  request_type text not null check (request_type in ('access', 'rectification', 'erasure', 'restriction', 'portability', 'objection')),
  status text not null default 'new' check (status in ('new', 'in_review', 'completed', 'rejected')),
  request_channel text not null default 'portal',
  details text null,
  due_date date null,
  resolved_at timestamptz null,
  resolved_by_profile_id uuid null references public.profiles(id) on delete set null,
  resolution_notes text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_compliance_dsr_kita_id
  on public.compliance_data_subject_requests (kita_id);
create index if not exists idx_compliance_dsr_requester
  on public.compliance_data_subject_requests (requester_profile_id);
create index if not exists idx_compliance_dsr_status
  on public.compliance_data_subject_requests (status);
create index if not exists idx_compliance_dsr_due_date
  on public.compliance_data_subject_requests (due_date);

create or replace function public.set_compliance_dsr_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_compliance_dsr_updated_at on public.compliance_data_subject_requests;
create trigger trg_compliance_dsr_updated_at
before update on public.compliance_data_subject_requests
for each row
execute function public.set_compliance_dsr_updated_at();

alter table public.compliance_consent_events enable row level security;
alter table public.compliance_audit_events enable row level security;
alter table public.compliance_data_subject_requests enable row level security;

drop policy if exists "consent_admin_all" on public.compliance_consent_events;
create policy "consent_admin_all"
on public.compliance_consent_events
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "consent_subject_read_own" on public.compliance_consent_events;
create policy "consent_subject_read_own"
on public.compliance_consent_events
for select
to authenticated
using (subject_profile_id = auth.uid());

drop policy if exists "consent_authenticated_insert" on public.compliance_consent_events;
create policy "consent_authenticated_insert"
on public.compliance_consent_events
for insert
to authenticated
with check (true);

drop policy if exists "audit_admin_read" on public.compliance_audit_events;
create policy "audit_admin_read"
on public.compliance_audit_events
for select
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "audit_authenticated_insert" on public.compliance_audit_events;
create policy "audit_authenticated_insert"
on public.compliance_audit_events
for insert
to authenticated
with check (actor_profile_id is null or actor_profile_id = auth.uid());

drop policy if exists "dsr_admin_all" on public.compliance_data_subject_requests;
create policy "dsr_admin_all"
on public.compliance_data_subject_requests
for all
to authenticated
using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'))
with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'));

drop policy if exists "dsr_requester_read_own" on public.compliance_data_subject_requests;
create policy "dsr_requester_read_own"
on public.compliance_data_subject_requests
for select
to authenticated
using (requester_profile_id = auth.uid());

drop policy if exists "dsr_requester_insert_own" on public.compliance_data_subject_requests;
create policy "dsr_requester_insert_own"
on public.compliance_data_subject_requests
for insert
to authenticated
with check (requester_profile_id = auth.uid());

