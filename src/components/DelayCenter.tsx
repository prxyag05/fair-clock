import { motion } from 'framer-motion'
import { useCallback, useState, type ButtonHTMLAttributes, type Dispatch, type ReactNode } from 'react'
import { useHold } from '../hooks/useHold'
import {
  CONFIG,
  canGoDirect,
  credit,
  creditCap,
  dishQuality,
  etaRange,
  firstRange,
  promisedAt,
  type PlatformAction,
  type SimState,
} from '../engine/simulation'
import { formatClock, formatRange, money, parseClock, toInputValue } from '../lib/format'
import { Card } from './Card'

const CAUSE_COPY: Record<string, string> = {
  kitchen: 'The restaurant has a backlog. This one is on the kitchen, not your rider.',
  batching:
    'Your rider is making one extra stop first. That routing was our call, so the delay is on us and the clock below is paying you.',
  weather: 'Rain has started along your rider\'s route. Live weather data triggered this delay, and the clock below is paying you.',
  direct: 'Your rider is heading straight to you with no more stops.',
}

const HOLD_MS = 1200
const DEFAULT_PREVIEW = 'Hover or focus an option to preview its outcome.'

const tone = (quality: number): string => (quality < 0.25 ? 'bg-danger' : quality < 0.5 ? 'bg-amb' : 'bg-acc')

function Tile({ label, value, valueClass = '', children }: { label: string; value: string; valueClass?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-line bg-card p-2.5">
      <b className="block text-xs text-mute">{label}</b>
      <strong className={`block text-base tabular-nums ${valueClass}`}>{value}</strong>
      {children}
    </div>
  )
}

function ImpactStrip({ state }: { state: SimState }) {
  const { startAt, baseArrival, items } = state.order
  const [needBy, setNeedBy] = useState(() => toInputValue(startAt, baseArrival + 6))
  const [, high] = etaRange(state)
  const target = parseClock(needBy, startAt)
  const difference = target === null ? null : (state.delivered ? state.arrival : high) - target
  const qualities = items.map((item) => ({ name: item.name, value: dishQuality(state, item.hold) }))
  const worst = qualities.reduce((a, b) => (b.value < a.value ? b : a))
  const earned = credit(state)

  const planLabel =
    difference === null
      ? 'Set a time'
      : difference > 0
        ? `${state.delivered ? 'Missed' : 'Misses'} by ${difference} min`
        : 'On track'

  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2">
      <Tile label="Time" value={`+${Math.round(state.arrival - baseArrival)} min`}>
        <small className="text-mute">first ETA was {formatRange(startAt, firstRange(state))}</small>
      </Tile>
      <Tile label="Food" value={worst.value < 0.25 ? `${worst.name} past its best` : 'Holding well'}>
        {qualities.map((dish) => (
          <div key={dish.name}>
            <small className="text-mute">{dish.name}</small>
            <div className="mb-1 h-1 rounded-full bg-line">
              <div className={`h-full rounded-full transition-[width] ${tone(dish.value)}`} style={{ width: `${dish.value * 100}%` }} />
            </div>
          </div>
        ))}
      </Tile>
      <Tile label="Money" value={money(earned)}>
        <small className="text-mute">
          {state.delivered
            ? 'added to your wallet'
            : state.t < promisedAt(state)
              ? `starts at ${formatClock(startAt, promisedAt(state))}`
              : `ticking, capped at ${money(creditCap(state))}`}
        </small>
      </Tile>
      <Tile label="Your plan" value={planLabel} valueClass={difference !== null && difference > 0 ? 'text-danger' : ''}>
        <label className="text-mute">
          <small>Need it by </small>
          <input
            type="time"
            value={needBy}
            onChange={(event) => setNeedBy(event.target.value)}
            className="rounded-md border border-line bg-bg px-1 text-ink"
          />
        </label>
      </Tile>
    </div>
  )
}

interface OptionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  title: string
  detail: string
  selected?: boolean
}

function Option({ title, detail, selected = false, children, className = '', ...rest }: OptionProps) {
  return (
    <button
      type="button"
      className={`relative w-full touch-none select-none overflow-hidden rounded-xl border-[1.5px] p-3 text-left transition-colors enabled:hover:border-acc disabled:opacity-50 ${
        selected ? 'border-acc bg-ok' : 'border-line bg-card'
      } ${className}`}
      {...rest}
    >
      <b className="block">{title}</b>
      <small className="block text-mute">{detail}</small>
      {children}
    </button>
  )
}

export function DelayCenter({ state, dispatch }: { state: SimState; dispatch: Dispatch<PlatformAction> }) {
  const [preview, setPreview] = useState(DEFAULT_PREVIEW)
  const confirmCancel = useCallback(() => dispatch({ type: 'cancel' }), [dispatch])
  const { holding, handlers } = useHold(confirmCancel, HOLD_MS)
  const range = etaRange(state)
  const { startAt, baseArrival, total } = state.order
  const cap = creditCap(state)
  const directArrival = formatClock(startAt, Math.max(state.arrival - CONFIG.directSaving, state.t + 5))

  const previews = {
    keep: `Keep it: arrive ${formatRange(startAt, range)}. Credit grows to ${money(cap)} at most.`,
    direct: `Direct: arrive about ${directArrival} at no extra cost.`,
    cancel: `Cancel: ${money(total)} returns to your original payment method. Hold for 1.2 seconds to confirm.`,
  }

  const bindPreview = (text: string) => ({
    onMouseEnter: () => setPreview(text),
    onFocus: () => setPreview(text),
    onMouseLeave: () => setPreview(DEFAULT_PREVIEW),
    onBlur: () => setPreview(DEFAULT_PREVIEW),
  })

  const headline = state.delivered
    ? `Arrived ${Math.round(state.arrival - baseArrival)} min after the first estimate`
    : `About ${Math.round(state.arrival - baseArrival)} min behind the first estimate`

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <Card title="Your order is delayed" tone="warning">
          <strong className="text-lg">{headline}</strong>
          {state.cause && CAUSE_COPY[state.cause] && <p className="mt-1">{CAUSE_COPY[state.cause]}</p>}
          <ImpactStrip state={state} />
        </Card>
      </motion.div>

      {!state.delivered && (
        <Card title="What would you like to do?">
          <div className="grid gap-2">
            <Option
              title="Keep and earn credit"
              detail={`Arrive ${formatRange(startAt, range)}, earn up to ${money(cap)}`}
              selected={state.kept}
              onClick={() => dispatch({ type: 'keep' })}
              {...bindPreview(previews.keep)}
            />
            <Option
              title="Direct delivery"
              detail={
                state.direct
                  ? 'Requested: rider is heading straight to you'
                  : 'Skips remaining stops, about 5 min sooner, free'
              }
              disabled={!canGoDirect(state)}
              onClick={() => dispatch({ type: 'direct' })}
              {...bindPreview(previews.direct)}
            />
            <Option
              title="Cancel (press and hold)"
              detail={`Full ${money(total)} back, no fee. The delay is on us.`}
              {...bindPreview(previews.cancel)}
              {...handlers}
              onBlur={() => {
                handlers.onBlur()
                setPreview(DEFAULT_PREVIEW)
              }}
            >
              <motion.span
                className="absolute bottom-0 left-0 h-1 bg-danger"
                initial={false}
                animate={{ width: holding ? '100%' : '0%' }}
                transition={{ duration: holding ? HOLD_MS / 1000 : 0.2, ease: 'linear' }}
              />
            </Option>
          </div>
          <p className="mt-2 text-xs text-mute">{preview}</p>
        </Card>
      )}
    </>
  )
}
