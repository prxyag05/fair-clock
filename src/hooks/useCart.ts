import { usePersistentState } from './usePersistentState'

interface Cart {
  restaurantId: string | null
  lines: Record<string, number>
}

const EMPTY: Cart = { restaurantId: null, lines: {} }

const without = (lines: Record<string, number>, itemId: string): Record<string, number> =>
  Object.fromEntries(Object.entries(lines).filter(([id]) => id !== itemId))

export function useCart() {
  const [cart, setCart] = usePersistentState<Cart>('fair-clock:cart-v2', EMPTY)

  const add = (restaurantId: string, itemId: string) =>
    setCart((current) => {
      const lines = current.restaurantId === restaurantId ? current.lines : {}
      return { restaurantId, lines: { ...lines, [itemId]: (lines[itemId] ?? 0) + 1 } }
    })

  const remove = (itemId: string) =>
    setCart((current) => {
      const qty = (current.lines[itemId] ?? 0) - 1
      const lines = qty > 0 ? { ...current.lines, [itemId]: qty } : without(current.lines, itemId)
      return Object.keys(lines).length === 0 ? EMPTY : { ...current, lines }
    })

  const clear = () => setCart(EMPTY)
  const count = Object.values(cart.lines).reduce((sum, qty) => sum + qty, 0)

  return { cart, add, remove, clear, count }
}
