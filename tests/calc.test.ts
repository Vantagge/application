import { describe, it, expect } from 'vitest'
import { calculatePointsEarned } from '../lib/utils/calc'

describe('calculatePointsEarned', () => {
  it('gives 1 for Carimbo regardless of value', () => {
    expect(
      calculatePointsEarned({ programType: 'Carimbo', valuePerPoint: null, monetaryBase: 0 })
    ).toBe(1)
    expect(
      calculatePointsEarned({ programType: 'Carimbo', valuePerPoint: 10, monetaryBase: 999 })
    ).toBe(1)
  })

  it('returns floor(monetaryBase/valuePerPoint) for Pontuacao', () => {
    expect(
      calculatePointsEarned({ programType: 'Pontuacao', valuePerPoint: 10, monetaryBase: 95 })
    ).toBe(9)
    expect(
      calculatePointsEarned({ programType: 'Pontuacao', valuePerPoint: 25, monetaryBase: 100 })
    ).toBe(4)
  })

  it('handles invalid or zero valuePerPoint as 0 points', () => {
    expect(
      calculatePointsEarned({ programType: 'Pontuacao', valuePerPoint: 0, monetaryBase: 100 })
    ).toBe(0)
    expect(
      calculatePointsEarned({ programType: 'Pontuacao', valuePerPoint: -5, monetaryBase: 100 })
    ).toBe(0)
    expect(
      calculatePointsEarned({ programType: 'Pontuacao', valuePerPoint: undefined, monetaryBase: 100 })
    ).toBe(0)
  })

  it('does not allow negative monetary base', () => {
    expect(
      calculatePointsEarned({ programType: 'Pontuacao', valuePerPoint: 10, monetaryBase: -100 })
    ).toBe(0)
  })
})
