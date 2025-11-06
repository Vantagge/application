export type UserRole = "admin" | "lojista"

export type EstablishmentCategory = "Barbearia" | "Salão de Beleza" | "Estética" | "Outro"

export type EstablishmentStatus = "ativo" | "inativo" | "trial"

export type ProgramType = "Pontuacao" | "Carimbo"

export type TransactionType = "Compra" | "Ganho" | "Resgate" | "Ajuste"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  establishment_id: string | null
  created_at: string
}

export interface Establishment {
  id: string
  name: string
  category: EstablishmentCategory
  address: string | null
  responsible_name: string
  registration: string
  status: EstablishmentStatus
  created_at: string
}

export interface EstablishmentConfig {
  id: string
  establishment_id: string
  program_type: ProgramType
  value_per_point: number | null
  stamps_for_reward: number | null
  b2c_access_token: string
  created_at: string
}

export interface Customer {
  id: string
  whatsapp: string
  name: string
  email: string | null
  birth_date: string | null
  cpf: string | null
  created_at: string
}

export interface CustomerLoyalty {
  id: string
  customer_id: string
  establishment_id: string
  balance: number
  total_redeemed: number
  redemption_count: number
  b2c_token: string
  last_transaction_at: string | null
  created_at: string
}

export interface Transaction {
  id: string
  establishment_id: string
  customer_id: string
  type: TransactionType
  monetary_value: number | null
  points_moved: number
  description: string | null
  balance_after: number
  professional_id?: string | null
  discount_amount?: number | null
  final_value?: number | null
  created_at: string
}

export interface Service {
  id: string
  establishment_id: string
  name: string
  description: string | null
  price: number
  duration_minutes: number | null
  is_active: boolean
  created_at: string
}

export interface Professional {
  id: string
  establishment_id: string
  name: string
  email: string | null
  phone: string | null
  commission_percentage: number | null
  is_active: boolean
  created_at: string
}

export interface TransactionItem {
  id: string
  transaction_id: string
  service_id: string
  professional_id: string | null
  quantity: number
  unit_price: number
  subtotal: number
}

// Extended types with relations
export interface CustomerWithLoyalty extends Customer {
  loyalty?: CustomerLoyalty
}

export interface EstablishmentWithConfig extends Establishment {
  config?: EstablishmentConfig
}
