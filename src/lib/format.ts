import type { Range } from '../engine/simulation'

const parts = (startAt: number, minutes: number) => {
  const total = startAt + Math.round(minutes)
  const hour24 = Math.floor(total / 60) % 24
  return {
    hour: hour24 % 12 === 0 ? 12 : hour24 % 12,
    minute: total % 60,
    suffix: hour24 >= 12 ? 'pm' : 'am',
  }
}

export const formatShort = (startAt: number, minutes: number): string => {
  const { hour, minute } = parts(startAt, minutes)
  return `${hour}:${String(minute).padStart(2, '0')}`
}

export const formatClock = (startAt: number, minutes: number): string =>
  `${formatShort(startAt, minutes)} ${parts(startAt, minutes).suffix}`

export const formatRange = (startAt: number, range: Range): string =>
  `${formatShort(startAt, range[0])}\u2013${formatClock(startAt, range[1])}`

const rupees = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const rupeesWhole = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export const money = (value: number): string => (Number.isInteger(value) ? rupeesWhole.format(value) : rupees.format(value))

export const toInputValue = (startAt: number, minutes: number): string => {
  const total = (startAt + Math.round(minutes)) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export const parseClock = (value: string, startAt: number): number | null => {
  const [hours, minutes] = value.split(':').map(Number)
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null
  const relative = hours * 60 + minutes - startAt
  return relative < -60 ? relative + 1440 : relative
}

export const currentMinuteOfDay = (): number => {
  const now = new Date()
  return now.getHours() * 60 + now.getMinutes()
}
