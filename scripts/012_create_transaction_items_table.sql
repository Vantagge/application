-- Create transaction_items table
create table if not exists public.transaction_items (
  id uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  service_id uuid not null references public.services(id),
  professional_id uuid references public.professionals(id),
  quantity integer not null default 1 check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0),
  subtotal numeric(10,2) not null check (subtotal >= 0)
);

create index if not exists idx_transaction_items_transaction on public.transaction_items(transaction_id);
create index if not exists idx_transaction_items_service on public.transaction_items(service_id);

-- Enable RLS
alter table public.transaction_items enable row level security;

-- Policies: allow select/insert restricted by parent transaction establishment via join
create policy if not exists "transaction_items_select_own_establishment"
  on public.transaction_items for select
  using (
    exists (
      select 1 from public.transactions t
      join public.users u on u.establishment_id = t.establishment_id
      where t.id = transaction_id and u.id = auth.uid()
    )
  );

create policy if not exists "transaction_items_insert_own_establishment"
  on public.transaction_items for insert
  with check (
    exists (
      select 1 from public.transactions t
      join public.users u on u.establishment_id = t.establishment_id
      where t.id = transaction_id and u.id = auth.uid()
    )
  );
