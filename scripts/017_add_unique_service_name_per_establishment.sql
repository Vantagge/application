-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Add unique constraint/index for (establishment_id, name)
-- We prefer a unique index for compatibility with "if not exists"
create unique index if not exists unique_service_name_per_establishment_idx
  on public.services(establishment_id, lower(name));
