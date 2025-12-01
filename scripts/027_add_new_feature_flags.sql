-- Add additional feature flags for services, transactions, and dashboard modules
-- This script is idempotent and safe to run multiple times.

insert into public.features (key, name, description, default_enabled) values
  ('module_services', 'Módulo de Serviços', 'Cadastro e gestão de serviços oferecidos', true),
  ('module_transactions', 'Tela de Transações', 'Histórico e gestão de transações', true),
  ('module_dashboard', 'Tela de Dashboard', 'Visão geral com métricas e atalhos', true)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  default_enabled = excluded.default_enabled;