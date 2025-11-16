-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Adiciona campos para gerenciar recompensas e validade
ALTER TABLE public.customer_loyalty
ADD COLUMN IF NOT EXISTS reward_ready boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS reward_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS last_card_image_url text;

-- Índice para buscar recompensas próximas da expiração
CREATE INDEX IF NOT EXISTS customer_loyalty_reward_expires_idx 
  ON public.customer_loyalty(reward_expires_at) 
  WHERE reward_ready = true;

COMMENT ON COLUMN public.customer_loyalty.reward_ready IS 
  'Indica se o cliente atingiu o número de carimbos necessário e está pronto para resgatar';

COMMENT ON COLUMN public.customer_loyalty.reward_expires_at IS 
  'Data de expiração da recompensa. Configurável por estabelecimento';

COMMENT ON COLUMN public.customer_loyalty.last_card_image_url IS 
  'URL da última imagem de cartão fidelidade gerada (Supabase Storage)';
