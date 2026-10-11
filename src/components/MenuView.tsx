import { ArrowLeft, Clock, Minus, Plus } from 'lucide-react'
import { useState } from 'react'
import type { Restaurant } from '../data/restaurants'
import { money } from '../lib/format'
import { VegMark } from './VegMark'

type Diet = 'all' | 'veg' | 'nonveg'

const DIETS: { id: Diet; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'veg', label: 'Veg' },
  { id: 'nonveg', label: 'Non-veg' },
]

interface MenuViewProps {
  restaurant: Restaurant
  quantities: Record<string, number>
  onAdd: (itemId: string) => void
  onRemove: (itemId: string) => void
  onCheckout: () => void
  onBack: () => void
}

export function MenuView({ restaurant, quantities, onAdd, onRemove, onCheckout, onBack }: MenuViewProps) {
  const [diet, setDiet] = useState<Diet>('all')
  const items = restaurant.menu.filter((item) => diet === 'all' || (diet === 'veg') === item.veg)
  const lines = restaurant.menu.filter((item) => (quantities[item.id] ?? 0) > 0)
  const count = lines.reduce((sum, item) => sum + (quantities[item.id] ?? 0), 0)
  const subtotal = lines.reduce((sum, item) => sum + item.price * (quantities[item.id] ?? 0), 0)

  return (
    <div className="mx-auto max-w-6xl p-4 pb-28 lg:pb-4">
      <button type="button" className="mb-3 flex items-center gap-1.5 text-mute hover:text-ink" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        All restaurants
      </button>
      <div className="lg:grid lg:grid-cols-[1fr_320px] lg:gap-6">
        <section>
          <h1 className="text-2xl font-extrabold tracking-tight">{restaurant.name}</h1>
          <p className="mb-4 capitalize text-mute">
            {restaurant.cuisine}, {restaurant.baseArrival - 2}-{restaurant.baseArrival + 2} min
            {restaurant.distanceKm !== null && `, ${restaurant.distanceKm.toFixed(1)} km away`}
            {restaurant.onTime !== null && `, ${restaurant.onTime}% on time (sample data)`}
          </p>
          <div className="mb-3 flex gap-1.5" role="group" aria-label="Diet filter">
            {DIETS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setDiet(option.id)}
                aria-pressed={diet === option.id}
                className={`rounded-full border px-3 py-1.5 text-sm ${diet === option.id ? 'border-acc bg-ok' : 'border-line bg-card hover:border-acc'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          <ul className="grid gap-3">
            {items.map((item) => {
              const qty = quantities[item.id] ?? 0
              return (
                <li key={item.id} className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-card p-3.5">
                  <div className="min-w-0">
                    <b className="flex items-center gap-1.5">
                      <VegMark veg={item.veg} />
                      {item.name}
                    </b>
                    <span className="block text-mute">{item.description}</span>
                    <span className="mt-1 flex items-center gap-1 text-xs text-mute">
                      <Clock className="h-3.5 w-3.5" aria-hidden />
                      Best eaten within {item.hold} min
                    </span>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <b className="tabular-nums">{money(item.price)}</b>
                    {qty === 0 ? (
                      <button type="button" className="rounded-lg bg-acc px-3 py-1.5 font-semibold text-white" onClick={() => onAdd(item.id)}>
                        Add
                      </button>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg border border-line px-1.5 py-1">
                        <button type="button" aria-label={`Remove one ${item.name}`} onClick={() => onRemove(item.id)}>
                          <Minus className="h-4 w-4" aria-hidden />
                        </button>
                        <span className="w-4 text-center tabular-nums">{qty}</span>
                        <button type="button" aria-label={`Add one ${item.name}`} onClick={() => onAdd(item.id)}>
                          <Plus className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        </section>

        <aside className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg p-3 lg:static lg:self-start lg:rounded-2xl lg:border lg:bg-card lg:p-4">
          <h2 className="mb-2 hidden font-bold lg:block">Your cart</h2>
          <ul className="mb-3 hidden gap-1 lg:grid">
            {lines.length === 0 && <li className="text-mute">Your cart is empty.</li>}
            {lines.map((item) => (
              <li key={item.id} className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  <VegMark veg={item.veg} />
                  {quantities[item.id]} x {item.name}
                </span>
                <span className="tabular-nums">{money(item.price * (quantities[item.id] ?? 0))}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            disabled={count === 0}
            onClick={onCheckout}
            className="flex w-full items-center justify-between rounded-xl bg-acc px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            <span>{count === 0 ? 'Add items to continue' : `Checkout (${count})`}</span>
            <span className="tabular-nums">{money(subtotal)}</span>
          </button>
        </aside>
      </div>
    </div>
  )
}
