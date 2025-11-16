-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Tabela para rastrear histórico detalhado de resgates
CREATE TABLE IF NOT EXISTS public.reward_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL REFERENCES public.establishments(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  stamps_redeemed integer NOT NULL DEFAULT 10,
  redeemed_at timestamp with time zone DEFAULT now(),
  expired boolean DEFAULT false,
  expired_at timestamp with time zone,
  
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_redemptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY IF NOT EXISTS "reward_redemptions_select_own_establishment"
  ON public.reward_redemptions FOR SELECT
  USING (
    establishment_id IN (
      SELECT establishment_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "reward_redemptions_insert_own_establishment"
  ON public.reward_redemptions FOR INSERT
  WITH CHECK (
    establishment_id IN (
      SELECT establishment_id FROM public.users WHERE id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS reward_redemptions_customer_idx 
  ON public.reward_redemptions(customer_id);
CREATE INDEX IF NOT EXISTS reward_redemptions_establishment_idx 
  ON public.reward_redemptions(establishment_id);
CREATE INDEX IF NOT EXISTS reward_redemptions_redeemed_at_idx 
  ON public.reward_redemptions(redeemed_at);
