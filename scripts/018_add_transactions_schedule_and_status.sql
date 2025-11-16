-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Add scheduling support and status to transactions
alter table if exists public.transactions
  add column if not exists scheduled_at timestamptz,
  add column if not exists status text default 'completed';

-- Helpful index for future appointments lookups
create index if not exists idx_transactions_establishment_scheduled on public.transactions(establishment_id, scheduled_at);
