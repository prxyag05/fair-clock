import { motion } from 'framer-motion'
import { credit, creditCap, promisedAt, type SimState } from '../engine/simulation'
import { formatClock, money } from '../lib/format'
import { Card } from './Card'

export function CompensationClock({ state }: { state: SimState }) {
  const earned = credit(state)
  const promised = promisedAt(state)

  const note = state.delivered
    ? earned > 0
      ? `${money(earned)} credited to your wallet automatically.`
      : 'Delivered within the promise, so no credit is due.'
    : state.t < promised
      ? `Starts after ${formatClock(state.order.startAt, promised)}: 1% of your order per minute, capped at 25%.`
      : 'Credit grows every minute until arrival. No claim needed.'

  return (
    <Card title="Compensation clock">
      <div className="text-[32px] font-extrabold tabular-nums text-acc">{money(earned)}</div>
      <div className="my-1 h-1 rounded-full bg-line">
        <motion.div
          className="h-full rounded-full bg-acc"
          initial={false}
          animate={{ width: `${(earned / creditCap(state)) * 100}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>
      <p className="text-mute">{note}</p>
    </Card>
  )
}
