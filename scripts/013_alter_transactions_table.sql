-- Alter transactions table to add professional and discount fields
alter table if exists public.transactions 
  add column if not exists professional_id uuid references public.professionals(id),
  add column if not exists discount_amount numeric(10,2) default 0 check (discount_amount >= 0),
  add column if not exists final_value numeric(10,2);

create index if not exists idx_transactions_professional on public.transactions(professional_id);
