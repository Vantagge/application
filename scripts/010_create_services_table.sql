-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.

-- Create services table
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name varchar(255) not null,
  description text,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer check (duration_minutes > 0),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_services_establishment on public.services(establishment_id);
create index if not exists idx_services_active on public.services(establishment_id, is_active);

-- Enable RLS
alter table public.services enable row level security;

-- Policies
create policy if not exists "services_select_own_establishment"
  on public.services for select
  using (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  );

create policy if not exists "services_insert_own_establishment"
  on public.services for insert
  with check (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  );

create policy if not exists "services_update_own_establishment"
  on public.services for update
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
