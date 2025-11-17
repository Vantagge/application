-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Activity logs per establishment
create table if not exists public.establishment_logs (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  actor_user_id uuid references public.users(id) on delete set null,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- Indexes
create index if not exists idx_est_logs_establishment on public.establishment_logs(establishment_id, created_at desc);
create index if not exists idx_est_logs_entity on public.establishment_logs(entity_type, entity_id);

-- Enable RLS
alter table public.establishment_logs enable row level security;

-- Policies: admin can read all; users can read logs of establishments they belong to
create policy if not exists "est_logs_select_admin"
  on public.establishment_logs for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy if not exists "est_logs_select_member"
  on public.establishment_logs for select
  using (
    establishment_id in (
      select establishment_id from public.establishment_users where user_id = auth.uid()
    )
  );

-- Insert policy for server actions (admins only)
create policy if not exists "est_logs_insert_admin"
  on public.establishment_logs for insert
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );
