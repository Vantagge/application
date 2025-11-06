-- Create customers table for B2C customer data
-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  whatsapp text unique not null,
  name text not null,
  email text,
  birth_date date,
  cpf text,
  created_at timestamp with time zone default now(),
  
  -- Validation: WhatsApp format +55DDNNNNNNNNN
  constraint check_whatsapp_format check (whatsapp ~ '^\+55[0-9]{10,11}$')
);

-- Enable RLS
alter table public.customers enable row level security;

-- Policies for customers table
-- Users can view customers associated with their establishment (via customer_loyalty)
create policy "customers_select_own_establishment"
  on public.customers for select
  using (
    id in (
      select customer_id from public.customer_loyalty
      where establishment_id in (
        select establishment_id from public.users
        where id = auth.uid()
      )
    )
  );

-- Admins can view all customers
create policy "customers_select_admin"
  on public.customers for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can insert customers (will be associated via customer_loyalty)
create policy "customers_insert_authenticated"
  on public.customers for insert
  with check (auth.uid() is not null);

-- Users can update customers associated with their establishment
create policy "customers_update_own_establishment"
  on public.customers for update
  using (
    id in (
      select customer_id from public.customer_loyalty
      where establishment_id in (
        select establishment_id from public.users
        where id = auth.uid()
      )
    )
  );

-- Create indexes for faster lookups
create index if not exists customers_whatsapp_idx on public.customers(whatsapp);
create index if not exists customers_cpf_idx on public.customers(cpf);
