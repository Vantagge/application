-- Add logo_url column to establishments table
-- DO NOT CHANGE EXISTING MIGRATIONS. CREATE NEW ONES ONLY.

alter table if exists public.establishments
  add column if not exists logo_url text;

-- No changes to RLS are required since column uses existing table policies.
