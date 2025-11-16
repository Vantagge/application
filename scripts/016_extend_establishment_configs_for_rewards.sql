-- DO NOT CHANGE THIS FILE. CREATE A NEW FILE FOR CHANGES.
-- Adiciona configurações específicas de recompensa
ALTER TABLE public.establishment_configs
ADD COLUMN IF NOT EXISTS reward_validity_days integer DEFAULT 30,
ADD COLUMN IF NOT EXISTS establishment_logo_url text,
ADD COLUMN IF NOT EXISTS card_primary_color varchar(7) DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS whatsapp_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS whatsapp_api_key text,
ADD COLUMN IF NOT EXISTS whatsapp_sender_number text;

COMMENT ON COLUMN public.establishment_configs.reward_validity_days IS
  'Número de dias que o cliente tem para resgatar após completar os carimbos (padrão: 30)';

COMMENT ON COLUMN public.establishment_configs.establishment_logo_url IS
  'URL do logo armazenado no Supabase Storage';

COMMENT ON COLUMN public.establishment_configs.card_primary_color IS
  'Cor primária do cartão em formato HEX (padrão: roxo #8B5CF6)';
