-- Ensure admins can update any user profile (needed when not using service role)
-- Safe to run multiple times

alter table if not exists public.users enable row level security;

-- Replace existing policy if present
drop policy if exists users_update_admin on public.users;
create policy users_update_admin
  on public.users for update
  using (auth.jwt() ->> 'role' = 'admin')
  with check (auth.jwt() ->> 'role' = 'admin');
