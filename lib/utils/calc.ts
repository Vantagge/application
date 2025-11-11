// Pure helper for calculating loyalty points/stamps earned for a service transaction
// This mirrors the business logic used in recordServiceTransaction but keeps it testable.

export type ProgramType = "Pontuacao" | "Carimbo"

export function calculatePointsEarned(params: {
  programType: ProgramType
  valuePerPoint?: number | null
  monetaryBase: number // subtotal - discount
}): number {
  const { programType, valuePerPoint, monetaryBase } = params
  if (programType === "Carimbo") {
    return 1
  }
  // Pontuacao
  const vpp = Number(valuePerPoint || 0)
  if (!isFinite(vpp) || vpp <= 0) return 0
  const base = Math.max(0, Number.isFinite(monetaryBase) ? monetaryBase : 0)
  return Math.floor(base / vpp)
}
