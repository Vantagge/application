-- Security definer function to create or link a customer to the caller's establishment
-- Bypasses RLS safely while attributing ownership to the authenticated user (auth.uid())

create or replace function public.setup_customer_with_loyalty(
  p_name text,
  p_whatsapp text,
  p_email text
)
returns public.customers
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_establishment_id uuid;
  v_customer public.customers;
begin
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  -- Find caller establishment
  select establishment_id into v_establishment_id
  from public.users
  where id = v_user_id;

  if v_establishment_id is null then
    raise exception 'Establishment not found for the current user';
  end if;

  -- Upsert/find customer by whatsapp
  insert into public.customers (name, whatsapp, email)
  values (p_name, p_whatsapp, p_email)
  on conflict (whatsapp) do update
    set
      name = excluded.name,
      email = coalesce(excluded.email, public.customers.email)
  returning * into v_customer;

  -- Ensure loyalty doesn't already exist for this establishment
  if exists (
    select 1 from public.customer_loyalty
    where customer_id = v_customer.id and establishment_id = v_establishment_id
  ) then
    raise exception 'Cliente já cadastrado neste estabelecimento';
  end if;

  -- Create loyalty record with zero balance
  insert into public.customer_loyalty (customer_id, establishment_id, balance)
  values (v_customer.id, v_establishment_id, 0);

  return v_customer;
end;
$$;

-- Restrict and grant execute
revoke all on function public.setup_customer_with_loyalty(text, text, text) from public;
grant execute on function public.setup_customer_with_loyalty(text, text, text) to authenticated;
