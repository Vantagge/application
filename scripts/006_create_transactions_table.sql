-- Create transactions table for transaction history per establishment

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  establishment_id uuid not null references public.establishments(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  type text not null check (type in ('Compra', 'Ganho', 'Resgate', 'Ajuste')),
  monetary_value numeric(10,2),
  points_moved numeric(10,2) not null,
  description text,
  balance_after numeric(10,2) not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.transactions enable row level security;

-- Policies for transactions table
-- Users can view transactions for their establishment
create policy "transactions_select_own_establishment"
  on public.transactions for select
  using (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Admins can view all transactions
create policy "transactions_select_admin"
  on public.transactions for select
  using (
    exists (
      select 1 from public.users
      where id = auth.uid() and role = 'admin'
    )
  );

-- Users can insert transactions for their establishment
create policy "transactions_insert_own_establishment"
  on public.transactions for insert
  with check (
    establishment_id in (
      select establishment_id from public.users
      where id = auth.uid()
    )
  );

-- Create indexes for faster lookups
create index if not exists transactions_establishment_id_idx on public.transactions(establishment_id);
create index if not exists transactions_customer_id_idx on public.transactions(customer_id);
create index if not exists transactions_created_at_idx on public.transactions(created_at desc);
create index if not exists transactions_type_idx on public.transactions(type);
