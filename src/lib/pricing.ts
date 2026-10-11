import type { Restaurant, MenuItem } from '../data/restaurants'

export interface CartLine {
  item: MenuItem
  qty: number
}

export interface Quote {
  subtotal: number
  delivery: number
  service: number
  discount: number
  total: number
}

const cents = (value: number): number => Math.round(value * 100) / 100

export const quote = (restaurant: Restaurant, lines: CartLine[], wallet: number, useWallet: boolean): Quote => {
  const subtotal = cents(lines.reduce((sum, line) => sum + line.item.price * line.qty, 0))
  const delivery = restaurant.deliveryFee
  const service = cents(subtotal * 0.05)
  const gross = cents(subtotal + delivery + service)
  const discount = useWallet ? cents(Math.min(wallet, gross)) : 0
  return { subtotal, delivery, service, discount, total: cents(gross - discount) }
}
