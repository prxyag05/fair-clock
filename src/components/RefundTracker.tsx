import { Check, Circle } from 'lucide-react'
import type { SimState } from '../engine/simulation'
import { Card } from './Card'

const STEPS = ['Requested', 'Approved', 'Sent to your bank', 'Credited']

export function RefundTracker({ state }: { state: SimState }) {
  return (
    <Card title="Refund tracker">
      <ol className="mb-2">
        {STEPS.map((step, index) => {
          const done = index < state.refundStep
          return (
            <li key={step} className={`flex items-center gap-2 py-1 ${done ? 'text-ink' : 'text-mute'}`}>
              {done ? <Check className="h-4 w-4 text-acc" aria-hidden /> : <Circle className="h-4 w-4" aria-hidden />}
              {step}
            </li>
          )
        })}
      </ol>
      <p className="text-xs text-mute">Simulated: real refunds would show a bank reference.</p>
    </Card>
  )
}
