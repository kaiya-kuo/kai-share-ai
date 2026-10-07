import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, SessionCost, SessionRateLimit } from 'claude-code'

import type { UsageSnapshot } from '../types'
import { bandAlt, bandSvg, fmtRemain, fmtTokens } from './render'

const snapshot = atom({ plugin: 'usage-band', key: 'snapshot' } as const, null)
const now = atom({ plugin: 'usage-band', key: 'now' } as const, 0)
const tokens = atom({ plugin: 'usage-band', key: 'tokens' } as const, { input: 0, output: 0, cache: 0 })

const ORDER = ['five_hour', 'seven_day']

export const toSnapshot = (rateLimits: SessionRateLimit[], cost?: SessionCost): UsageSnapshot => ({
  limits: rateLimits
    .filter(l => ORDER.includes(l.kind))
    .sort((a, b) => ORDER.indexOf(a.kind) - ORDER.indexOf(b.kind))
    .map(l => ({ kind: l.kind, percentUsed: l.percentUsed, resetsAt: l.resetsAt })),
  costUsd: cost?.usd ?? null,
})

const tick = async ($: EngineInterface) => {
  const t = await $.clock.now()
  await update($, now, () => t)
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const result = await next(e)
    const usage = await $.session.usage()
    await update($, snapshot, () => toSnapshot(usage.rateLimits, usage.cost))
    await tick($)
    // 每 30 秒刷新倒數時間
    $.clock.every(30_000, () => void tick($))
    return result
  })

  on('session.measure', async ($, e, next) => {
    await update($, snapshot, () => toSnapshot(e.rateLimits, e.cost))
    await tick($)
    return next(e)
  })

  on('turn.complete', async ($, e, next) => {
    const result = await next(e)
    const u = result.usage ?? e.usage
    if (u) {
      await update($, tokens, t => ({
        input: t.input + u.input_tokens,
        output: t.output + u.output_tokens,
        cache: t.cache + u.cache_read_input_tokens + u.cache_creation_input_tokens,
      }))
    }
    return result
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const snap = await read($, snapshot)
    if (e.props.hasSurvey || snap === null) return next(e)

    const nowMs = (await read($, now)) || (await $.clock.now())
    const tok = await read($, tokens)

    if (e.surface === 'desktop') {
      const { Svg } = $.ui.resolve(e)
      const { source, width, height } = bandSvg(snap, tok, nowMs)
      return <Svg source={source} alt={bandAlt(snap, tok, nowMs)} width={width} height={height} />
    }

    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box flexDirection="row" gap={2}>
        {snap.limits.map(l => (
          <Text key={l.kind}>
            <Text dimColor>{l.kind === 'seven_day' ? '7d ' : '5h '}</Text>
            <Text bold color={l.percentUsed >= 90 ? 'error' : l.percentUsed >= 70 ? 'warning' : 'success'}>
              {`${Math.round(l.percentUsed)}%`}
            </Text>
            <Text dimColor>{` ${fmtRemain(l.resetsAt, nowMs)}`}</Text>
          </Text>
        ))}
        <Text dimColor>{`↑${fmtTokens(tok.input)} ↓${fmtTokens(tok.output)} ≋${fmtTokens(tok.cache)}`}</Text>
        <Text bold>{snap.costUsd === null ? '$—' : `$${snap.costUsd.toFixed(2)}`}</Text>
      </Box>
    )
  })
}
