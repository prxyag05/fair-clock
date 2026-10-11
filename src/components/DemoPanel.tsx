import type { Dispatch } from 'react'
import { CONFIG, canBatchingDelay, canKitchenDelay, type PlatformAction, type SimState } from '../engine/simulation'

const SPEEDS = [CONFIG.realSpeed, 1, 3, 8]

const speedLabel = (speed: number): string => (speed === CONFIG.realSpeed ? 'Real time' : `x${speed}`)

export function DemoPanel({ state, dispatch }: { state: SimState; dispatch: Dispatch<PlatformAction> }) {
  const index = SPEEDS.indexOf(state.speed)
  const nextSpeed = SPEEDS[(index + 1) % SPEEDS.length]
  const button =
    'rounded-lg border border-line bg-card px-2.5 py-1.5 text-ink enabled:hover:border-acc disabled:opacity-45'

  return (
    <div
      className="fixed left-3 z-20 flex max-w-[360px] flex-wrap gap-1.5 rounded-xl border border-line bg-card p-2 shadow-2xl"
      style={{ bottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <button type="button" className={button} disabled={!canKitchenDelay(state)} onClick={() => dispatch({ type: 'kitchen', minutes: 8 })}>
        Kitchen delay
      </button>
      <button type="button" className={button} disabled={!canBatchingDelay(state)} onClick={() => dispatch({ type: 'batching', minutes: 6 })}>
        Rider batching
      </button>
      <button type="button" className={button} disabled={state.weatherFired} onClick={() => dispatch({ type: 'weather' })}>
        Rain delay
      </button>
      <button type="button" className={button} onClick={() => dispatch({ type: 'speed', value: nextSpeed })}>
        Speed: {speedLabel(state.speed)}
      </button>
      <button type="button" className={button} onClick={() => dispatch({ type: 'reset' })}>
        Restart
      </button>
    </div>
  )
}
