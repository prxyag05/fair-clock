import { formatRange, money } from '../lib/format'

export type Cause = 'confirmed' | 'kitchen' | 'batching' | 'weather' | 'direct' | 'choice' | 'cancelled' | 'delivered'

export type Range = readonly [number, number]

export type Point = readonly [number, number]

export interface OrderItem {
  name: string
  qty: number
  hold: number
}

export interface OrderInput {
  id: string
  restaurant: string
  items: OrderItem[]
  total: number
  baseArrival: number
  prepMinutes: number
  startAt: number
  placedAt: number
  route: Point[]
  demo: boolean
  lat: number | null
  lon: number | null
  rainAtOrder: boolean
}

export interface LedgerEntry {
  id: number
  at: number
  cause: Cause
  message: string
  from?: Range
  to?: Range
}

export interface SimState {
  order: OrderInput
  t: number
  prepEnd: number
  arrival: number
  progress: number
  delays: number
  pauseUntil: number
  kitchenFired: boolean
  batchingFired: boolean
  weatherFired: boolean
  delivered: boolean
  cancelled: boolean
  direct: boolean
  kept: boolean
  speed: number
  cause: Cause | null
  refundStep: number
  nextId: number
  ledger: LedgerEntry[]
}

export type Action =
  | { type: 'tick'; dt: number }
  | { type: 'kitchen'; minutes: number }
  | { type: 'batching'; minutes: number }
  | { type: 'weather' }
  | { type: 'direct' }
  | { type: 'keep' }
  | { type: 'cancel' }
  | { type: 'refund' }
  | { type: 'speed'; value: number }
  | { type: 'reset' }

export type PlatformAction = Action | { type: 'place'; order: OrderInput } | { type: 'close' }

export const CONFIG = {
  rate: 0.01,
  cap: 0.25,
  realSpeed: 1 / 60,
  weatherDelay: 6,
  kitchenTriggerShare: 0.7,
  handoff: 4,
  pickupLag: 1.5,
  directSaving: 5,
  refundSteps: 4,
} as const

export const promisedAt = (s: SimState): number => s.order.baseArrival + 2

export const creditCap = (s: SimState): number => s.order.total * CONFIG.cap

export const firstRange = (s: SimState): Range => [s.order.baseArrival - 2, s.order.baseArrival + 2]

export const etaRange = (s: SimState): Range => [s.arrival - 2, s.arrival + 2 + 2 * s.delays]

export const credit = (s: SimState): number =>
  Math.min(creditCap(s), s.order.total * CONFIG.rate * Math.max(0, Math.min(s.t, s.arrival) - promisedAt(s)))

export const confidence = (s: SimState): number => Math.max(55, 88 - 12 * s.delays)

export const dishQuality = (s: SimState, hold: number): number =>
  Math.max(0, 1 - Math.max(0, s.t - s.prepEnd) / hold)

export const stageIndex = (s: SimState): number => {
  if (s.cancelled) return -1
  if (s.t < 1) return 0
  if (s.t < s.prepEnd) return 1
  if (s.t < s.prepEnd + CONFIG.pickupLag) return 2
  return s.delivered ? 4 : 3
}

export const isFinished = (s: SimState): boolean => s.delivered || s.cancelled

export const isPaused = (s: SimState): boolean => s.t < s.pauseUntil && !isFinished(s)

export const canGoDirect = (s: SimState): boolean => !s.direct && !isFinished(s) && s.t <= s.arrival - 6

export const canKitchenDelay = (s: SimState): boolean => !isFinished(s) && s.t < s.prepEnd

export const canBatchingDelay = (s: SimState): boolean =>
  !isFinished(s) && s.t >= s.prepEnd + CONFIG.pickupLag && s.t <= s.arrival - 6

const addEntry = (s: SimState, cause: Cause, message: string, from?: Range, to?: Range): SimState => ({
  ...s,
  nextId: s.nextId + 1,
  ledger: [...s.ledger, { id: s.nextId, at: s.t, cause, message, from, to }],
})

export const createState = (order: OrderInput): SimState => {
  const base: SimState = {
    order,
    t: 0,
    prepEnd: order.prepMinutes,
    arrival: order.baseArrival,
    progress: 0,
    delays: 0,
    pauseUntil: 0,
    kitchenFired: !order.demo,
    batchingFired: !order.demo,
    weatherFired: false,
    delivered: false,
    cancelled: false,
    direct: false,
    kept: false,
    speed: order.demo ? 1 : CONFIG.realSpeed,
    cause: null,
    refundStep: 0,
    nextId: 1,
    ledger: [],
  }
  return addEntry(base, 'confirmed', `Order confirmed. First estimate ${formatRange(order.startAt, firstRange(base))}`)
}

const applyChange = (s: SimState, cause: Cause, delta: number, message: string): SimState => {
  const from = etaRange(s)
  const next: SimState = {
    ...s,
    arrival: s.arrival + delta,
    delays: delta > 0 ? s.delays + 1 : s.delays,
    cause,
  }
  return addEntry(next, cause, message, from, etaRange(next))
}

const kitchenDelay = (s: SimState, minutes: number): SimState =>
  applyChange(
    { ...s, prepEnd: s.prepEnd + minutes, kitchenFired: true },
    'kitchen',
    minutes,
    `Restaurant backlog: food will be ready ${minutes} min later`,
  )

const weatherDelay = (s: SimState): SimState =>
  applyChange(
    { ...s, weatherFired: true },
    'weather',
    CONFIG.weatherDelay,
    'Rain started on your route, so riders are moving slower',
  )

const batchingDelay = (s: SimState, minutes: number): SimState =>
  applyChange({ ...s, pauseUntil: s.t + 4, batchingFired: true }, 'batching', minutes, 'Rider added a nearby stop before yours')

const advance = (s: SimState, dt: number): SimState => {
  let next: SimState = { ...s, t: s.t + dt * s.speed }
  const kitchenTrigger = Math.round(next.order.prepMinutes * CONFIG.kitchenTriggerShare)

  if (!next.kitchenFired && next.t >= kitchenTrigger && next.t < next.prepEnd) next = kitchenDelay(next, 9)
  if (!next.batchingFired && next.t >= next.prepEnd + 6 && next.t < next.arrival - 6) next = batchingDelay(next, 7)

  if (next.t >= next.prepEnd + CONFIG.pickupLag && next.t >= next.pauseUntil) {
    const remaining = Math.max(next.arrival - CONFIG.handoff - next.t, 0.8)
    const step = ((1 - next.progress) * dt * next.speed) / remaining
    next = { ...next, progress: Math.min(0.98, next.progress + step) }
  }

  if (next.t >= next.arrival) {
    next = { ...next, t: next.arrival, delivered: true, progress: 1 }
    const earned = credit(next)
    const message = earned > 0 ? `Delivered. ${money(earned)} credit added to your wallet` : 'Delivered on time'
    next = addEntry(next, 'delivered', message)
  }

  return next
}

export const reducer = (s: SimState, action: Action): SimState => {
  switch (action.type) {
    case 'tick':
      return isFinished(s) ? s : advance(s, action.dt)
    case 'kitchen':
      return canKitchenDelay(s) ? kitchenDelay(s, action.minutes) : s
    case 'batching':
      return canBatchingDelay(s) ? batchingDelay(s, action.minutes) : s
    case 'weather':
      return s.weatherFired || isFinished(s) || s.arrival - s.t < 8 ? s : weatherDelay(s)
    case 'direct': {
      const saving = Math.min(CONFIG.directSaving, s.arrival - s.t - 5)
      if (!canGoDirect(s) || saving <= 0) return s
      return applyChange({ ...s, direct: true }, 'direct', -saving, 'Direct delivery: rider skips remaining stops')
    }
    case 'keep':
      return s.kept ? s : addEntry({ ...s, kept: true }, 'choice', 'You chose to keep the order and earn credit')
    case 'cancel':
      if (isFinished(s)) return s
      return addEntry({ ...s, cancelled: true }, 'cancelled', `Order cancelled. Full ${money(s.order.total)} refund, no fee`)
    case 'refund':
      return s.cancelled ? { ...s, refundStep: Math.min(CONFIG.refundSteps, s.refundStep + 1) } : s
    case 'speed':
      return { ...s, speed: action.value }
    case 'reset':
      return createState(s.order)
    default:
      return s
  }
}

export const platformReducer = (s: SimState | null, action: PlatformAction): SimState | null => {
  if (action.type === 'place') return createState(action.order)
  if (action.type === 'close') return null
  return s ? reducer(s, action) : s
}
