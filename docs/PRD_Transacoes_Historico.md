# PRD: Página de Histórico de Transações (Realizadas e Futuras)

## 1. Visão Geral
Criação de uma página completa e responsiva para listar, filtrar, analisar e exportar as transações do estabelecimento. A página terá duas abas:
- Realizadas: transações já concluídas (ou sem agendamento) e também agendadas no passado.
- Futuras: agendamentos futuros (transações com `scheduled_at` > agora). 

Permite filtros por período, tipo, profissional, cliente (nome/WhatsApp), status, serviço, valor mínimo/máximo. Suporta exportação para CSV/Excel e paginação.

Caminho: Menu → Transações
Público: Donos(as) de estabelecimentos

## 2. Responsividade
- Mobile (<640px):
  - Filtros em colapso (stack vertical), lista em cartões.
  - Ações principais (Filtrar, Exportar) visíveis no topo; paginação com botões anterior/próximo no rodapé fixo.
- Tablet (≥640px e <1024px):
  - Filtro em 2 colunas, lista em cards 2 colunas.
- Desktop (≥1024px):
  - Filtro em linha (grid 3–4 colunas), tabela com cabeçalhos e ações à direita.

## 3. Dados e Tabelas Envolvidas
- transactions: id, establishment_id, customer_id, professional_id, type (Compra/Ganho/Resgate/Ajuste), monetary_value, discount_amount, final_value, points_moved, description, balance_after, created_at, scheduled_at (novo), status (novo: completed/pending/cancelled).
- transaction_items: service_id, quantity, unit_price, subtotal, professional_id (ref), transaction_id.
- customers: name, whatsapp.
- professionals: name.
- services: name (através de transaction_items.service_id).

## 4. Funcionalidades
- Listagem paginada (20 por página) com total de registros.
- Filtros combináveis: período, tipo, profissional, status, cliente (nome/whatsapp), serviço, valor final mínimo/máximo.
- Ordenação: 
  - Realizadas por created_at desc (padrão);
  - Futuras por scheduled_at asc.
- Exportar CSV (compatível com Excel) respeitando filtros vigentes (limite técnico 5.000 linhas por export).
- Acesso rápido aos detalhes principais: cliente, profissional, serviços e totais.

## 5. Regras
- RLS respeitada por estabelecimento.
- “Futuras” exige `scheduled_at` > agora; “Realizadas” inclui `scheduled_at` nulo ou ≤ agora.
- Campo `status` informativo (default completed), podendo futuramente suportar cancelamentos.

## 6. UX Detalhes
- Filtros:
  - Período: dois inputs date (de/até).
  - Tipo: select.
  - Profissional: select.
  - Status: select (completed, pending, cancelled).
  - Cliente: input de busca (ilike em nome/whatsapp).
  - Serviço: select.
  - Valor: min/max.
- Botões: Aplicar, Limpar, Exportar.
- Loading overlay com backdrop em operações (buscar, exportar).
- Tabela (desktop) com colunas: Data/Agendamento, Cliente, Profissional, Tipo, Itens (qtd), Valor (subtotal, desconto, total), Pontos, Status.
- Cards (mobile) com mesmas informações em layout empilhado.

## 7. API/Backend
- Migration: adicionar `scheduled_at timestamptz` e `status text default 'completed'` em transactions (índice por estabelecimento+scheduled_at).
- Action: `getTransactionsPaged(filters, page, pageSize, future)` com joins em customers, professionals e itens; suporta filtros, paginação e contagem.
- API Export: GET `/api/transactions/export` — retorna CSV para download (até 5.000 linhas), aplicando mesmos filtros.

## 8. i18n
Adicionar chaves em `translations.transactionHistory` para: título, abas, filtros, rótulos de colunas, exportar, vazios, paginação.

## 9. Critérios de Aceitação
- [x] Abas Realizadas e Futuras com datasets corretos.
- [x] Filtros combináveis funcionando e responsivos.
- [x] Lista em cards (mobile) e tabela (desktop).
- [x] Exportação CSV refletindo filtros atuais.
- [x] Loading com backdrop nas ações.
- [x] Paginação com total e próximo/anterior.

## 10. Fora de Escopo
- Edição/cancelamento de agendamentos.
- Visualização detalhada de uma única transação.
