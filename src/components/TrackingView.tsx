import { useEffect, useState, type Dispatch } from 'react'
import { isFinished, isPaused, stageIndex, type PlatformAction, type SimState } from '../engine/simulation'
import { Card } from './Card'
import { CompensationClock } from './CompensationClock'
import { DelayCenter } from './DelayCenter'
import { DemoPanel } from './DemoPanel'
import { EtaPanel } from './EtaPanel'
import { Ledger } from './Ledger'
import { MapView } from './MapView'
import { RefundTracker } from './RefundTracker'

const STAGE_LABELS = ['Confirmed', 'Preparing', 'Picked up', 'On the way', 'Arrived']

interface TrackingViewProps {
  state: SimState
  dispatch: Dispatch<PlatformAction>
  onHome: () => void
  onOrders: () => void
}

export function TrackingView({ state, dispatch, onHome, onOrders }: TrackingViewProps) {
  const [demo, setDemo] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (event.key === 'd' && target.tagName !== 'INPUT') setDemo((value) => !value)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const delayed = state.delays > 0 && !state.cancelled
  const stage = stageIndex(state)
  const label = state.cancelled
    ? 'Order cancelled'
    : state.delivered
      ? 'Delivered'
      : `${isPaused(state) ? 'Rider making an extra stop' : STAGE_LABELS[stage]}${delayed ? ', delayed' : ''}`

  const finish = (action: () => void) => () => {
    dispatch({ type: 'close' })
    action()
  }

  return (
    <div className="lg:grid lg:h-[calc(100vh-3.5rem)] lg:grid-cols-[65%_35%]">
      <div className="sticky top-14 z-10 h-[34vh] lg:static lg:h-full">
        <MapView route={state.order.route} progress={state.progress} label={label} delayed={delayed} />
      </div>
      <aside className="relative -mt-3.5 rounded-t-2xl bg-bg p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.2)] lg:mt-0 lg:overflow-y-auto lg:rounded-none lg:shadow-none">
        <div className="mb-3 flex items-center justify-between gap-2">
          <div>
            <div className="text-base font-extrabold">{state.order.restaurant}</div>
            <small className="text-mute">Order {state.order.id}</small>
          </div>
          <button type="button" className="rounded-lg border border-line bg-card px-2.5 py-1.5" onClick={() => setDemo((value) => !value)}>
            Demo
          </button>
        </div>

        {isFinished(state) && (
          <Card tone="warning" title="This order is complete">
            <div className="flex flex-wrap gap-2">
              <button type="button" className="rounded-lg bg-acc px-3 py-2 font-semibold text-white" onClick={finish(onHome)}>
                Order again
              </button>
              <button type="button" className="rounded-lg border border-line bg-card px-3 py-2" onClick={finish(onOrders)}>
                View orders
              </button>
            </div>
          </Card>
        )}

        <EtaPanel state={state} />
        {delayed && <DelayCenter state={state} dispatch={dispatch} />}
        {state.cancelled ? <RefundTracker state={state} /> : <CompensationClock state={state} />}
        <Ledger state={state} />
      </aside>
      {demo && <DemoPanel state={state} dispatch={dispatch} />}
    </div>
  )
}
