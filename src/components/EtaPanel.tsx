import { motion } from 'framer-motion'
import { confidence, etaRange, promisedAt, stageIndex, type SimState } from '../engine/simulation'
import { formatClock, formatRange } from '../lib/format'
import { Card } from './Card'

const STAGES = ['Confirmed', 'Preparing', 'Picked up', 'On the way', 'Arrived']

export function EtaPanel({ state }: { state: SimState }) {
  const { startAt, baseArrival } = state.order
  const range = etaRange(state)
  const stage = stageIndex(state)
  const promised = promisedAt(state)
  const position = (minutes: number): number => Math.min(100, Math.max(0, (minutes - (baseArrival - 16)) * 2))
  const left = position(range[0])
  const width = position(range[1]) - left

  const headline = state.cancelled
    ? 'Cancelled'
    : state.delivered
      ? `Delivered ${formatClock(startAt, state.arrival)}`
      : formatRange(startAt, range)

  const note = state.cancelled
    ? ''
    : state.delivered
      ? state.arrival > promised
        ? `Arrived ${Math.round(state.arrival - promised)} min after the promised ${formatClock(startAt, promised)}.`
        : `Arrived by the promised ${formatClock(startAt, promised)}.`
      : `${confidence(state)}% chance within this window. Promised by ${formatClock(startAt, promised)} (black marker).`

  return (
    <Card title="Estimated arrival">
      <div className="text-[28px] font-extrabold leading-tight tracking-tight tabular-nums">{headline}</div>
      <div className="relative my-3 h-2.5 rounded-full bg-line">
        <motion.i
          className="absolute top-0 h-full rounded-full bg-acc"
          initial={false}
          animate={{ left: `${left}%`, width: `${width}%` }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        />
        <span className="absolute -top-1 h-[18px] w-0.5 bg-ink" style={{ left: `${position(promised)}%` }} title="Promised by" />
      </div>
      <p className="min-h-[1.25rem] text-mute">{note}</p>
      <ol className="mt-3 flex gap-1">
        {STAGES.map((name, index) => (
          <li
            key={name}
            className={`flex-1 border-t-[3px] pt-1 text-[11px] ${
              index <= stage ? 'border-acc text-ink' : 'border-line text-mute'
            } ${index === stage ? 'font-bold' : ''}`}
          >
            {name}
          </li>
        ))}
      </ol>
    </Card>
  )
}
