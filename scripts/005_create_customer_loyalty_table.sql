-- Create customer_loyalty table (N:N junction table between customers and establishments)
-- This table stores the loyalty balance for each customer at each establishment

create table if not exists public.customer_loyalty (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  balance numeric(10,2) not null default 0,
  total_redeemed numeric(10,2) not null default 0,
  redemption_count integer not null default 0,
  b2c_token text unique not null default encode(gen_random_bytes(32), 'hex'),
  last_transaction_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  
  -- Ensure one loyalty record per customer per establishment
  unique(customer_id, establishment_id),
  
  -- Validation: balance cannot be negative
  constraint check_balance_non_negative check (balance >= 0)
);

-- Enable RLS
alter table public.customer_loyalty enable row level security;

-- Policies for customer_loyalty table
-- Users can view loyalty records for their establishment
create policy "customer_loyalty_select_own_establishment"
  on public.customer_loyalty for select
  using (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Public access via b2c_token (for B2C status page)
create policy "customer_loyalty_select_by_token"
  on public.customer_loyalty for select
  using (true);

-- Admins can view all loyalty records
create policy "customer_loyalty_select_admin"
  on public.customer_loyalty for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can insert loyalty records for their establishment
create policy "customer_loyalty_insert_own_establishment"
  on public.customer_loyalty for insert
  with check (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Users can update loyalty records for their establishment
create policy "customer_loyalty_update_own_establishment"
  on public.customer_loyalty for update
  using (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Create indexes for faster lookups
create index if not exists customer_loyalty_customer_id_idx on public.customer_loyalty(customer_id);
create index if not exists customer_loyalty_establishment_id_idx on public.customer_loyalty(establishment_id);
create index if not exists customer_loyalty_b2c_token_idx on public.customer_loyalty(b2c_token);
