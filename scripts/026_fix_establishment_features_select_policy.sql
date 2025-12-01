-- Adjust SELECT RLS policy for establishment_features to validate admin via public.users instead of JWT claim
-- This script is idempotent and safe to run multiple times.

-- Ensure table exists (no-op if already present)
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

-- Replace old SELECT policy that used auth.jwt()->>'role' = 'admin'
-- Drop legacy policy if it exists
DROP POLICY IF EXISTS "est_features_select_member_or_admin" ON public.establishment_features;

-- Create new SELECT policy validating admin via public.users table role, or member via establishment_id
CREATE POLICY IF NOT EXISTS "est_features_select_member_or_admin"
  ON public.establishment_features FOR SELECT
  USING (
    -- Admins (via users table)
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.role = 'admin'
    )
    OR
    -- Members of the establishment
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.establishment_id = establishment_id
    )
  );
