-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Set default duration for existing records where null, then enforce NOT NULL
-- Keep previous files immutable.

-- Backfill null durations with a sane default (30 minutes)
update public.services set duration_minutes = 30 where duration_minutes is null;

-- Add constraint to ensure positive integer already exists in 010; enforce NOT NULL
alter table public.services alter column duration_minutes set not null;