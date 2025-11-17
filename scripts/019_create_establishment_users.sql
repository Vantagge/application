-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Join table for many-to-many relation between users and establishments
create table if not exists public.establishment_users (
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text default 'membro',
  is_active boolean default true,
  created_at timestamptz default now(),
  primary key (establishment_id, user_id)
);

-- Indexes
create index if not exists idx_establishment_users_user on public.establishment_users(user_id);
create index if not exists idx_establishment_users_establishment on public.establishment_users(establishment_id);

-- Enable RLS
alter table public.establishment_users enable row level security;

-- Policies: admin can see all, users can see their own memberships
create policy if not exists "est_users_select_admin"
  on public.establishment_users for select
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy if not exists "est_users_select_self"
  on public.establishment_users for select
  using (user_id = auth.uid());

create policy if not exists "est_users_insert_admin"
  on public.establishment_users for insert
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );

create policy if not exists "est_users_update_admin"
  on public.establishment_users for update
  using (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  )
  with check (
    exists (select 1 from public.users where id = auth.uid() and role = 'admin')
  );
