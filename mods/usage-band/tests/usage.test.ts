import { expect, test } from 'claude-code/testing'

import { toSnapshot } from '../hooks/register'
import { bandSvg, elapsed, fmtRemain, fmtTokens } from '../hooks/render'

const base = Date.parse('2026-10-07T00:00:00Z')

test('formats remaining time like the design', async () => {
  expect(fmtRemain('2026-10-07T02:40:00Z', base)).toBe('2h 40m')
  expect(fmtRemain('2026-10-08T07:00:00Z', base)).toBe('1d 7h')
  expect(fmtRemain(undefined, base)).toBe('—')
})

test('formats token counts', async () => {
  expect(fmtTokens(15600)).toBe('15.6k')
  expect(fmtTokens(954200)).toBe('954.2k')
  expect(fmtTokens(2_500_000)).toBe('2.5M')
})

test('elapsed marker for 5h window', async () => {
  expect(elapsed('five_hour', '2026-10-07T02:30:00Z', base)).toBe(0.5)
})

test('snapshot keeps 5h then 7d and the svg has every pill', async () => {
  const s = toSnapshot(
    [
      { kind: 'seven_day', percentUsed: 58, resetsAt: '2026-10-08T07:00:00Z' },
      { kind: 'five_hour', percentUsed: 20, resetsAt: '2026-10-07T02:40:00Z' },
    ],
    { usd: 4.32 },
  )
  expect(s.limits[0]?.kind).toBe('five_hour')
  const { source } = bandSvg(s, { input: 15600, output: 3000, cache: 954200 }, base)
  for (const t of ['20%', '58%', '2h 40m', '1d 7h', '15.6k', '3.0k', '954.2k', '$4.32']) {
    expect(source.includes(t)).toBe(true)
  }
})
