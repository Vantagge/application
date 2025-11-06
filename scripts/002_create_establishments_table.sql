-- Create establishments table for business data (B2B)
-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.

create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('Barbearia', 'Salão de Beleza', 'Estética', 'Outro')),
  address text,
  responsible_name text not null,
  registration text not null unique default lpad(((floor(random() * 1000000))::int)::text, 6, '0'),
  status text not null default 'ativo' check (status in ('ativo', 'inativo', 'trial')),
  created_at timestamp with time zone default now(),
  constraint registration_format check (registration ~ '^[0-9]{6}$')
);

-- Ensure uniqueness index exists for registration
create index if not exists establishments_registration_idx on public.establishments(registration);

-- Enable RLS
alter table public.establishments enable row level security;

-- Policies for establishments table
-- Users can view their own establishment
create policy "establishments_select_own"
  on public.establishments for select
  using (
    id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Admins can view all establishments
create policy "establishments_select_admin"
  on public.establishments for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can insert establishments
create policy "establishments_insert_admin"
  on public.establishments for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Admins can update establishments
create policy "establishments_update_admin"
  on public.establishments for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can update their own establishment
create policy "establishments_update_own"
  on public.establishments for update
  using (
    id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Create index for faster lookups
create index if not exists establishments_status_idx on public.establishments(status);
