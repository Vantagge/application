-- Create users profile table that extends auth.users
-- This table stores additional user information and role-based access control

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('admin', 'lojista')),
  establishment_id uuid references public.establishments(id) on delete set null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.users enable row level security;

-- Policies for users table
-- Users can view their own profile
create policy "users_select_own"
  on public.users for select
  using (auth.uid() = id);

-- Users can update their own profile
create policy "users_update_own"
  on public.users for update
  using (auth.uid() = id);


-- Admins can view all users (avoid self-reference by using JWT claim)
create policy "users_select_admin"
  on public.users for select
  using (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Admins can insert new users (avoid self-reference by using JWT claim)
create policy "users_insert_admin"
  on public.users for insert
  with check (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Create index for faster lookups
create index if not exists users_establishment_id_idx on public.users(establishment_id);
create index if not exists users_role_idx on public.users(role);
