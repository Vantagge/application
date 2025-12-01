-- Fix RLS policies for establishment_features to allow admins based on public.users.role
-- This script is additive and should not modify previous migration files.

-- Ensure table exists
create table if not exists public.establishment_features (
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  feature_key text not null references public.features(key) on delete cascade,
  is_enabled boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  primary key (establishment_id, feature_key)
);

-- Enable RLS (idempotent)
alter table public.establishment_features enable row level security;

-- Drop the old broad policy if it exists (was checking JWT role claim only)
drop policy if exists "est_features_write_admin" on public.establishment_features;

-- Create explicit INSERT policy for admins validated via public.users table
create policy if not exists "est_features_insert_admin_via_users"
  on public.establishment_features for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Create explicit UPDATE policy for admins validated via public.users table
create policy if not exists "est_features_update_admin_via_users"
  on public.establishment_features for update
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Optional: allow DELETE by admins as well (useful for cleanup)
create policy if not exists "est_features_delete_admin_via_users"
  on public.establishment_features for delete
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

-- Keep existing SELECT policy as defined previously; no changes here.
