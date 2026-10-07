export type UsageSnapshot = {
  limits: { kind: string; percentUsed: number; resetsAt?: string }[]
  costUsd: number | null
}

export type TokenTotals = { input: number; output: number; cache: number }

declare module 'claude-code' {
  interface PluginState {
    'usage-band': { snapshot: UsageSnapshot | null; now: number; tokens: TokenTotals }
  }
}
