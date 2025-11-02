-- Security definer function to create an establishment and its config atomically
-- Bypasses RLS for the necessary tables while still attributing ownership to the caller (auth.uid())

create or replace function public.setup_establishment_with_config(
  p_name text,
  p_category text,
  p_address text,
  p_responsible_name text,
  p_program_type text,
  p_value_per_point numeric,
  p_stamps_for_reward integer
)
returns public.establishments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_est public.establishments;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Create establishment
  insert into public.establishments(name, category, address, responsible_name, status)
  values (p_name, p_category, p_address, p_responsible_name, 'ativo')
  returning * into v_est;

  -- Link user to establishment
  update public.users
    set establishment_id = v_est.id
  where id = v_user_id;

  -- Create config
  insert into public.establishment_configs(
    establishment_id,
    program_type,
    value_per_point,
    stamps_for_reward
  ) values (
    v_est.id,
    p_program_type,
    case when p_program_type = 'Pontuacao' then coalesce(p_value_per_point, 0) else null end,
    case when p_program_type = 'Carimbo' then coalesce(p_stamps_for_reward, 0) else null end
  );

  return v_est;
end;
$$;

-- Ensure only authenticated users can execute it
revoke all on function public.setup_establishment_with_config(text, text, text, text, text, numeric, integer) from public;
grant execute on function public.setup_establishment_with_config(text, text, text, text, text, numeric, integer) to authenticated;