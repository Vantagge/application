Vantagge – Setup and Run Guide

This repository contains a Next.js 16 application that uses Supabase for authentication, database, and storage. This guide walks you through installing prerequisites, setting up the database, configuring environment variables, installing dependencies, and running the application locally and in production.

Contents
- Overview
- Prerequisites
- 1) Create and configure the Supabase project
- 2) Create the database schema (SQL)
- 3) Configure authentication redirect URLs
- 4) Configure environment variables (.env.local)
- 5) Install dependencies
- 6) Run the app (development & production)
- Troubleshooting

Overview
- Framework: Next.js 16 (App Router)
- UI: Tailwind CSS, Radix UI, shadcn components
- Auth/DB: Supabase
- Package manager: pnpm

Project scripts (package.json)
- pnpm dev – start the development server
- pnpm build – build for production
- pnpm start – start the built app
- pnpm lint – run ESLint

Prerequisites
- Node.js: v18.18+ (recommended v20 LTS)
- pnpm: v9+
  - Install: npm i -g pnpm
- Supabase account: https://supabase.com

1) Create and configure the Supabase project
1. Sign in to Supabase and create a new project.
2. In the project’s Settings → API, copy:
   - Project URL (SUPABASE_URL)
   - anon public key (SUPABASE_ANON_KEY)
3. In Settings → Auth → Providers → Email, ensure Email/Password is enabled.
4. (Optional, recommended) In Settings → Auth → Auth Policies, keep email confirmations ON for production. For local development, you may allow auto-confirm to ease testing.

2) Create the database schema (SQL)
Run the SQL below in the Supabase SQL Editor. It creates all tables referenced by the application along with a trigger that auto-inserts a row into the app users table whenever a new auth.user is created.

Note: If you already have some of these tables or types, adjust accordingly (DROP statements are omitted). The schema favors NOT NULL only where the code requires it; defaults are provided so inserts from the app will succeed.

-- 2.1 Optional: enums
-- You can use enums or keep simple text with constraints. Here we use enums for clarity.
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
  category text not null, -- stored as text; UI constrains values
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
  value_per_point numeric(12,2), -- nullable; used when program_type = 'Pontuacao'
  stamps_for_reward integer,      -- nullable; used when program_type = 'Carimbo'
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

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2.9 (Optional) Basic RLS – enable and add permissive policies as needed
-- For simplicity during development you can keep RLS off. For production, enable RLS and craft policies.
-- Example to enable RLS:
-- alter table public.users enable row level security;
-- alter table public.establishments enable row level security; -- etc.

3) Configure authentication redirect URLs
- In Supabase → Auth → URL Configuration, add the site URL used in development and production.
- For local development, the app uses NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL to override email redirect links when signing up.
  - Example: http://localhost:3000/painel/configuracao-inicial

4) Configure environment variables (.env.local)
Create a file named .env.local at the project root (same folder as package.json) with the following content:

# Server-side Supabase credentials
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_public_key

# Client-side (public) Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_public_key

# Optional: during local dev, where to redirect after email confirmations
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000/painel/configuracao-inicial

Notes
- The server-side variables are read in server components, actions, and middleware.
- The NEXT_PUBLIC_* variables are exposed to the browser and are required by the Supabase browser client.

5) Install dependencies
From the project root:
- pnpm install

If you prefer npm or yarn:
- npm install
- yarn install

6) Run the app
Development
- pnpm dev
- Open http://localhost:3000

Production (local)
- pnpm build
- pnpm start
- Open http://localhost:3000

Deploying
- Vercel is recommended for Next.js. Set the same environment variables in your hosting provider.
- Ensure that your Supabase Auth redirect URLs include your production domain.

Troubleshooting
- Error: Supabase credentials not found. Ensure all 4 env vars are set: SUPABASE_URL, SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY.
- After sign up, the app cannot find the user row in public.users: make sure you executed the trigger (2.8) and the users table exists. Alternatively, create the row manually for testing.
- Access is redirected to /auth/login repeatedly: verify that you are authenticated in Supabase and that cookies are set. The middleware enforces redirects for non-public routes.
- Database errors inserting establishment_configs or customer_loyalty: ensure columns defined as NOT NULL in code have defaults or you provide values. This README’s SQL includes defaults for tokens and numeric fields.

Directory reference (root)
- app/ – Next.js app directory
- lib/supabase – Supabase clients and middleware glue
- lib/actions – Server Actions using Supabase
- lib/db/setup.ts – Utility used to check if required tables exist
- public/ – Static assets
- styles/ – Tailwind and global styles

That’s it! After completing the steps, you should be able to create accounts, log in, register merchants (estabelecimentos) and customers, and operate the points/stamps logic within the panel.