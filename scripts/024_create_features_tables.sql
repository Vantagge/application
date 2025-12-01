-- Create features and establishment_features tables for feature flags
-- Keep previous scripts immutable; create new migration file.

-- 1) Master features catalog
create table if not exists public.features (
  key text primary key,
  name text not null,
  description text,
  default_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

-- Basic read access. This catalog is safe to read by authenticated users.
alter table public.features enable row level security;
create policy if not exists "features_select_all_auth"
  on public.features for select
  to authenticated
  using (true);

-- 2) Establishment feature overrides
create table if not exists public.establishment_features (
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  feature_key text not null references public.features(key) on delete cascade,
  is_enabled boolean not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id),
  primary key (establishment_id, feature_key)
);

create index if not exists establishment_features_est_idx on public.establishment_features(establishment_id);
create index if not exists establishment_features_key_idx on public.establishment_features(feature_key);

alter table public.establishment_features enable row level security;

-- Allow members of the establishment to read their flags; admins can read all
create policy if not exists "est_features_select_member_or_admin"
  on public.establishment_features for select
  using (
    -- admin via JWT claim
    (auth.jwt()->> 'role') = 'admin'
    or
    -- member: match their establishment_id via users table
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.establishment_id = establishment_id
    )
  );

-- Only admins can insert/update overrides through the app
create policy if not exists "est_features_write_admin"
  on public.establishment_features for all
  using ((auth.jwt()->> 'role') = 'admin')
  with check ((auth.jwt()->> 'role') = 'admin');

-- Seed initial features
insert into public.features (key, name, description, default_enabled) values
  ('module_scheduling', 'Módulo de Agendamento', 'Agenda e criação de horários', false),
  ('module_loyalty', 'Cartão Fidelidade', 'Pontos/carimbos e prêmios', true),
  ('module_financial', 'Relatórios Financeiros', 'Relatórios e métricas financeiras', false),
  ('custom_branding', 'Branding Personalizado', 'Upload de logo e personalização', false),
  ('multi_professional', 'Múltiplos Profissionais', 'Cadastro de vários profissionais', true)
  on conflict (key) do update set
    name = excluded.name,
    description = excluded.description,
    default_enabled = excluded.default_enabled;
