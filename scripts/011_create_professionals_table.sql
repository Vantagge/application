-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.

-- Create professionals table
create table if not exists public.professionals (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  name varchar(255) not null,
  email varchar(255),
  phone varchar(20),
  commission_percentage numeric(5,2) check (commission_percentage >= 0 and commission_percentage <= 100),
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_professionals_establishment on public.professionals(establishment_id);

-- Enable RLS
alter table public.professionals enable row level security;

-- Policies
create policy if not exists "professionals_select_own_establishment"
  on public.professionals for select
  using (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  );

create policy if not exists "professionals_insert_own_establishment"
  on public.professionals for insert
  with check (
    establishment_id in (
      select establishment_id from public.users where id = auth.uid()
    )
  );

create policy if not exists "professionals_update_own_establishment"
  on public.professionals for update
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
