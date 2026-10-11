import { credit, promisedAt, type SimState } from '../engine/simulation'

export interface OrderRecord {
  id: string
  restaurant: string
  summary: string
  total: number
  placedAt: number
  outcome: 'delivered' | 'cancelled'
  minutesLate: number
  credit: number
}

export const toRecord = (s: SimState): OrderRecord => ({
  id: s.order.id,
  restaurant: s.order.restaurant,
  summary: s.order.items.map((item) => `${item.qty} x ${item.name}`).join(', '),
  total: s.order.total,
  placedAt: s.order.placedAt,
  outcome: s.delivered ? 'delivered' : 'cancelled',
  minutesLate: s.delivered ? Math.max(0, Math.round(s.arrival - promisedAt(s))) : 0,
  credit: s.delivered ? credit(s) : 0,
})
