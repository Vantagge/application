-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Create appointments table and related enum. Keep previous files immutable.

-- Status enum
do $$ begin
  create type public.appointment_status as enum ('PENDING', 'COMPLETED', 'CANCELED');
exception when duplicate_object then null; end $$;

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  client_id uuid not null references public.customers(id) on delete restrict,
  professional_id uuid not null references public.professionals(id) on delete restrict,
  service_ids uuid[] not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status public.appointment_status not null default 'PENDING',
  google_event_id text,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_appointments_establishment on public.appointments(establishment_id);
create index if not exists idx_appointments_professional_time on public.appointments(professional_id, start_at, end_at);
create index if not exists idx_appointments_status_start on public.appointments(status, start_at);

-- RLS
alter table public.appointments enable row level security;

-- Policies: scope by user's establishment
create policy if not exists "appointments_select_own_establishment"
  on public.appointments for select
  using (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  );

create policy if not exists "appointments_insert_own_establishment"
  on public.appointments for insert
  with check (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  );

create policy if not exists "appointments_update_own_establishment"
  on public.appointments for update
  using (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  )
  with check (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  );