import type { TokenTotals, UsageSnapshot } from '../types'

const WINDOW_MS: Record<string, number> = { five_hour: 5 * 3600_000, seven_day: 7 * 86400_000 }
const SHORT: Record<string, string> = { five_hour: '5h', seven_day: '7d' }

export const fmtTokens = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`

export const fmtRemain = (resetsAt: string | undefined, nowMs: number): string => {
  if (!resetsAt) return '—'
  const ms = Date.parse(resetsAt) - nowMs
  if (!Number.isFinite(ms)) return '—'
  if (ms <= 0) return '0m'
  const mins = Math.floor(ms / 60000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

/** 視窗已經過的比例（0–1），用來畫進度條上的時間刻度 */
export const elapsed = (kind: string, resetsAt: string | undefined, nowMs: number): number | null => {
  const win = WINDOW_MS[kind]
  if (!win || !resetsAt) return null
  const left = Date.parse(resetsAt) - nowMs
  if (!Number.isFinite(left)) return null
  return Math.max(0, Math.min(1, 1 - left / win))
}

// 以 12px 系統字型估算文字寬度
const textW = (s: string, bold = false): number => {
  let w = 0
  for (const ch of s) w += ch === '.' || ch === ' ' ? 3.4 : ch === '%' ? 10 : ch === 'm' ? 10.5 : /[A-Z]/.test(ch) ? 8 : 7
  return w * (bold ? 1.14 : 1.06)
}

const ICONS: Record<string, string> = {
  gauge: '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
  calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
  clock: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M12 7v5l4 2"/>',
  up: '<path d="M12 15V3"/><path d="m17 8-5-5-5 5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  down: '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>',
  layers:
    '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M14.8 9.2c-.4-.9-1.5-1.5-2.8-1.5-1.6 0-2.7.8-2.7 2 0 2.6 5.5 1.4 5.5 4.3 0 1.2-1.2 2-2.8 2-1.4 0-2.5-.6-2.9-1.6"/><path d="M12 5.8v1.9M12 16.3v1.9"/>',
}

const icon = (name: string, x: number, y: number, size: number) =>
  `<svg x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`

const STYLE = `
text{font:12px -apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif;font-variant-numeric:tabular-nums;dominant-baseline:central}
.wrap{fill:#f0efec}.t{fill:#2b2b2b}.b{font-weight:700}
.green{color:#3f7d4b}.green .bg{fill:#e1efe3}
.purple{color:#5a55a8}.purple .bg{fill:#ebeaf8}
.red{color:#b2463c}.red .bg{fill:#f8e2df}
.mint{color:#3f7d4b}.mint .bg{fill:#e1efe3}
.blue{color:#4a59b0}.blue .bg{fill:#e5e8f8}
.amber{color:#8a6a1e}.amber .bg{fill:#f6edd5}
.lbl{fill:currentColor;opacity:.85}
.track{fill:#d3d3cd}.ok{fill:#6aa870}.warn{fill:#d49a2a}.bad{fill:#cf5649}.mark{fill:#4a4a4a}
@media (prefers-color-scheme:dark){
.wrap{fill:#2a2a28}.t{fill:#ececea}
.green,.mint{color:#93d19e}.green .bg,.mint .bg{fill:#21352a}
.purple{color:#b6b2f0}.purple .bg{fill:#2b2942}
.red{color:#f1a49b}.red .bg{fill:#3e2422}
.blue{color:#a8b4f0}.blue .bg{fill:#242b44}
.amber{color:#e8c97a}.amber .bg{fill:#3a3220}
.track{fill:#4a4a46}.mark{fill:#d0d0cc}}`

const H = 28
const PAD = 14

type Piece = { w: number; svg: (x: number, y: number) => string }

const limitPill = (kind: string, pct: number, resetsAt: string | undefined, nowMs: number, tone: string, iconName: string): Piece => {
  const label = SHORT[kind] ?? kind
  const pctText = `${Math.round(pct)}%`
  const remain = fmtRemain(resetsAt, nowMs)
  const barW = 46
  const parts = [14, 7, textW(label), 10, barW, 10, textW(pctText, true), 14, 13, 5, textW(remain)]
  const w = PAD * 2 + parts.reduce((a, b) => a + b, 0)
  const fill = pct >= 90 ? 'bad' : pct >= 70 ? 'warn' : 'ok'
  const mark = elapsed(kind, resetsAt, nowMs)
  return {
    w,
    svg: (x, y) => {
      let cx = x + PAD
      const cy = y + H / 2
      const out: string[] = [`<g class="${tone}"><rect class="bg" x="${x}" y="${y}" width="${w}" height="${H}" rx="${H / 2}"/>`]
      out.push(icon(iconName, cx, cy - 7, 14)); cx += 14 + 7
      out.push(`<text class="lbl" x="${cx}" y="${cy}">${label}</text>`); cx += textW(label) + 10
      const filled = Math.max(0, Math.min(barW, (pct / 100) * barW))
      out.push(`<rect class="track" x="${cx}" y="${cy - 2}" width="${barW}" height="4" rx="2"/>`)
      if (filled > 0) out.push(`<rect class="${fill}" x="${cx}" y="${cy - 2}" width="${filled}" height="4" rx="2"/>`)
      if (mark !== null) out.push(`<rect class="mark" x="${cx + mark * barW - 0.75}" y="${cy - 6}" width="1.5" height="12" rx=".75"/>`)
      cx += barW + 10
      out.push(`<text class="t b" x="${cx}" y="${cy}">${pctText}</text>`); cx += textW(pctText, true) + 14
      out.push(icon('clock', cx, cy - 6.5, 13)); cx += 13 + 5
      out.push(`<text class="lbl" x="${cx}" y="${cy}">${remain}</text>`)
      out.push('</g>')
      return out.join('')
    },
  }
}

const statPill = (iconName: string, value: string, tone: string): Piece => {
  const w = PAD * 2 + 14 + 7 + textW(value)
  return {
    w,
    svg: (x, y) => {
      const cy = y + H / 2
      return `<g class="${tone}"><rect class="bg" x="${x}" y="${y}" width="${w}" height="${H}" rx="${H / 2}"/>${icon(iconName, x + PAD, cy - 7, 14)}<text class="lbl" x="${x + PAD + 21}" y="${cy}">${value}</text></g>`
    },
  }
}

export const bandSvg = (snap: UsageSnapshot, tokens: TokenTotals, nowMs: number): { source: string; width: number; height: number } => {
  const left: Piece[] = snap.limits.map(l =>
    l.kind === 'seven_day'
      ? limitPill(l.kind, l.percentUsed, l.resetsAt, nowMs, 'purple', 'calendar')
      : limitPill(l.kind, l.percentUsed, l.resetsAt, nowMs, 'green', 'gauge'),
  )
  const right: Piece[] = [
    statPill('up', fmtTokens(tokens.input), 'red'),
    statPill('down', fmtTokens(tokens.output), 'mint'),
    statPill('layers', fmtTokens(tokens.cache), 'blue'),
    statPill('coin', snap.costUsd === null ? '—' : `$${snap.costUsd.toFixed(2)}`, 'amber'),
  ]
  const OUT = 4
  const GAP = 14
  const GROUP_GAP = 36
  const sum = (ps: Piece[]) => ps.reduce((a, p) => a + p.w, 0) + Math.max(0, ps.length - 1) * GAP
  const width = Math.ceil(OUT * 2 + sum(left) + (left.length ? GROUP_GAP : 0) + sum(right))
  const height = H + OUT * 2
  const body: string[] = []
  let x = OUT
  left.forEach((p, i) => { body.push(p.svg(x, OUT)); x += p.w + (i < left.length - 1 ? GAP : GROUP_GAP) })
  right.forEach(p => { body.push(p.svg(x, OUT)); x += p.w + GAP })
  const source =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><style>${STYLE}</style>` +
    `<rect class="wrap" x="0" y="0" width="${width}" height="${height}" rx="12"/>${body.join('')}</svg>`
  return { source, width, height }
}

export const bandAlt = (snap: UsageSnapshot, tokens: TokenTotals, nowMs: number): string =>
  [
    ...snap.limits.map(l => `${SHORT[l.kind] ?? l.kind} ${Math.round(l.percentUsed)}%，${fmtRemain(l.resetsAt, nowMs)} 後重置`),
    `輸入 ${fmtTokens(tokens.input)}`,
    `輸出 ${fmtTokens(tokens.output)}`,
    `快取 ${fmtTokens(tokens.cache)}`,
    `花費 ${snap.costUsd === null ? '—' : `$${snap.costUsd.toFixed(2)}`}`,
  ].join('；')
