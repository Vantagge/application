-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Function to log establishment actions bypassing RLS via SECURITY DEFINER
-- This allows non-admin authenticated users to write logs safely.

create or replace function public.log_establishment_action(
  p_establishment_id uuid,
  p_action text,
  p_entity_type text default null,
  p_entity_id uuid default null,
  p_metadata jsonb default null,
  p_actor_user_id uuid default null
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.establishment_logs (
    establishment_id,
    actor_user_id,
    action,
    entity_type,
    entity_id,
    metadata
  ) values (
    p_establishment_id,
    coalesce(p_actor_user_id, auth.uid()),
    p_action,
    p_entity_type,
    p_entity_id,
    p_metadata
  );
end;
$$;

revoke all on function public.log_establishment_action(uuid, text, text, uuid, jsonb, uuid) from public;
grant execute on function public.log_establishment_action(uuid, text, text, uuid, jsonb, uuid) to authenticated;
