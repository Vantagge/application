-- Create establishment_configs table for loyalty program configuration (1:1 with establishments)

create table if not exists public.establishment_configs (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid unique not null references public.establishments(id) on delete cascade,
  program_type text not null check (program_type in ('Pontuacao', 'Carimbo')),
  value_per_point numeric(10,2),
  stamps_for_reward integer,
  b2c_access_token text unique not null default encode(gen_random_bytes(32), 'hex'),
  created_at timestamp with time zone default now(),
  
  -- Validation: if program_type is 'Pontuacao', value_per_point must be set
  constraint check_pontuacao_config check (
    (program_type = 'Pontuacao' and value_per_point is not null and value_per_point > 0) or
    program_type != 'Pontuacao'
  ),
  
  -- Validation: if program_type is 'Carimbo', stamps_for_reward must be set
  constraint check_carimbo_config check (
    (program_type = 'Carimbo' and stamps_for_reward is not null and stamps_for_reward > 0) or
    program_type != 'Carimbo'
  )
);

-- Enable RLS
alter table public.establishment_configs enable row level security;

-- Policies for establishment_configs table
-- Users can view their own establishment config
create policy "establishment_configs_select_own"
  on public.establishment_configs for select
  using (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Admins can view all configs
create policy "establishment_configs_select_admin"
  on public.establishment_configs for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can insert their own establishment config
create policy "establishment_configs_insert_own"
  on public.establishment_configs for insert
  with check (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Admins can insert configs
create policy "establishment_configs_insert_admin"
  on public.establishment_configs for insert
  with check (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can update their own establishment config
create policy "establishment_configs_update_own"
  on public.establishment_configs for update
  using (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Admins can update configs
create policy "establishment_configs_update_admin"
  on public.establishment_configs for update
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Create index for faster lookups
create index if not exists establishment_configs_establishment_id_idx on public.establishment_configs(establishment_id);
create index if not exists establishment_configs_b2c_token_idx on public.establishment_configs(b2c_access_token);
