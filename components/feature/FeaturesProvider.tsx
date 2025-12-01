"use client"
import React from "react"

export type FeaturesContextValue = {
  features: Map<string, boolean>
  loading: boolean
  hasFeature: (key: string) => boolean
}

const FeaturesContext = React.createContext<FeaturesContextValue | undefined>(undefined)

export function FeaturesProvider({ initial, children }: { initial?: Record<string, boolean>; children: React.ReactNode }) {
  const [features] = React.useState<Map<string, boolean>>(
    () => new Map(Object.entries(initial || {}))
  )

  const value = React.useMemo<FeaturesContextValue>(() => ({
    features,
    loading: false,
    hasFeature: (key: string) => features.get(key) ?? false,
  }), [features])

  return <FeaturesContext.Provider value={value}>{children}</FeaturesContext.Provider>
}

export function useFeatures(): FeaturesContextValue {
  const ctx = React.useContext(FeaturesContext)
  if (!ctx) {
    // Provide a safe default to avoid crashes; all features disabled
    const empty = new Map<string, boolean>()
    return { features: empty, loading: true, hasFeature: () => false }
  }
  return ctx
}
