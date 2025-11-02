-- Vantagge database schema
-- Copy/paste into Supabase SQL Editor and run

-- 2.1 Optional: enums
create type public.user_role as enum ('admin', 'lojista');
create type public.establishment_status as enum ('ativo', 'inativo', 'trial');
create type public.program_type as enum ('Pontuacao', 'Carimbo');
create type public.transaction_type as enum ('Compra', 'Ganho', 'Resgate', 'Ajuste');

-- 2.2 users table (links to auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  name text,
  role public.user_role not null default 'lojista',
  establishment_id uuid null,
  created_at timestamp with time zone not null default now()
);

-- 2.3 establishments
create table if not exists public.establishments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null,
  address text,
  responsible_name text not null,
  registration text not null unique default lpad(((floor(random() * 1000000))::int)::text, 6, '0'),
  status public.establishment_status not null default 'ativo',
  created_at timestamp with time zone not null default now(),
  constraint registration_format check (registration ~ '^[0-9]{6}$')
);
create index if not exists establishments_registration_idx on public.establishments(registration);

-- 2.4 establishment_configs
create table if not exists public.establishment_configs (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  program_type public.program_type not null,
  value_per_point numeric(12,2),
  stamps_for_reward integer,
  b2c_access_token text not null default '',
  created_at timestamp with time zone not null default now()
);
create unique index if not exists establishment_configs_establishment_id_key on public.establishment_configs(establishment_id);

-- 2.5 customers
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  whatsapp text not null unique,
  name text not null,
  email text,
  birth_date date,
  cpf text,
  created_at timestamp with time zone not null default now()
);

-- 2.6 customer_loyalty
create table if not exists public.customer_loyalty (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  balance integer not null default 0,
  total_redeemed integer not null default 0,
  redemption_count integer not null default 0,
  b2c_token text not null default '',
  last_transaction_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  unique(customer_id, establishment_id)
);

-- 2.7 transactions
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type public.transaction_type not null,
  monetary_value numeric(14,2),
  points_moved integer not null default 0,
  description text,
  balance_after integer not null default 0,
  created_at timestamp with time zone not null default now()
);
create index if not exists transactions_establishment_id_idx on public.transactions(establishment_id);
create index if not exists transactions_customer_id_idx on public.transactions(customer_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);

-- 2.8 Trigger to auto-create public.users row on new auth.user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', ''), coalesce((new.raw_user_meta_data->>'role')::public.user_role, 'lojista'))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger if not exists on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
