import { ChevronDown } from 'lucide-react'
import type { Cause, SimState } from '../engine/simulation'
import { formatClock, formatRange } from '../lib/format'

const LABELS: Record<Cause, string> = {
  confirmed: 'Confirmed',
  kitchen: 'Kitchen queue',
  batching: 'Rider batching',
  weather: 'Weather',
  direct: 'Direct',
  choice: 'Your choice',
  cancelled: 'Cancelled',
  delivered: 'Delivered',
}

const BADGES: Record<Cause, string> = {
  confirmed: 'bg-line text-ink',
  kitchen: 'bg-ambbg text-amb',
  batching: 'bg-ambbg text-amb',
  weather: 'bg-ambbg text-amb',
  direct: 'bg-ok text-acc',
  choice: 'bg-line text-ink',
  cancelled: 'bg-line text-ink',
  delivered: 'bg-ok text-acc',
}

export function Ledger({ state }: { state: SimState }) {
  const { startAt } = state.order
  const changes = state.ledger.filter((entry) => entry.to).length

  return (
    <details className="group mb-3 rounded-2xl border border-line bg-card p-3.5">
      <summary className="flex cursor-pointer list-none items-center justify-between font-semibold">
        Why did the ETA change? ({changes} {changes === 1 ? 'change' : 'changes'})
        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <ul className="mt-2">
        {[...state.ledger].reverse().map((entry) => (
          <li key={entry.id} className="flex gap-2 border-t border-line py-2">
            <span className={`h-fit whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11px] font-bold ${BADGES[entry.cause]}`}>
              {LABELS[entry.cause]}
            </span>
            <div>
              <b>{formatClock(startAt, entry.at)}</b> {entry.message}
              {entry.from && entry.to && (
                <div className="text-xs text-mute">
                  {formatRange(startAt, entry.from)} to {formatRange(startAt, entry.to)}
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>
    </details>
  )
}
