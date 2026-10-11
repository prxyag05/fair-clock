import { ArrowLeft, CloudRain, ShieldCheck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import type { Restaurant } from '../data/restaurants'
import { CONFIG, type OrderInput, type Point } from '../engine/simulation'
import { currentMinuteOfDay, formatClock, formatRange, money } from '../lib/format'
import { DEFAULT_ROUTE, fallbackRoute, fetchRoute, fetchWeather, projectRoute, type Place } from '../lib/geo'
import { quote, type CartLine } from '../lib/pricing'
import { Card } from './Card'
import { VegMark } from './VegMark'

interface Plan {
  ready: boolean
  route: Point[]
  travelMinutes: number
  km: number | null
  raining: boolean
  note: string
}

interface CheckoutViewProps {
  restaurant: Restaurant
  lines: CartLine[]
  place: Place | null
  wallet: number
  blocked: boolean
  onPlace: (order: OrderInput, walletUsed: number) => void
  onBack: () => void
}

const PAYMENTS = ['Card ending 4417', 'UPI', 'Cash on delivery']

const SAMPLE_PLAN: Plan = { ready: true, route: DEFAULT_ROUTE, travelMinutes: 0, km: null, raining: false, note: '' }

export function CheckoutView({ restaurant, lines, place, wallet, blocked, onPlace, onBack }: CheckoutViewProps) {
  const live = restaurant.source === 'osm' && place !== null && restaurant.lat !== null && restaurant.lon !== null
  const [address, setAddress] = useState(place ? place.label : '12 Linking Road, Flat 4')
  const [payment, setPayment] = useState(PAYMENTS[0])
  const [useWallet, setUseWallet] = useState(wallet > 0)
  const [demo, setDemo] = useState(!live)
  const [plan, setPlan] = useState<Plan>(live ? { ...SAMPLE_PLAN, ready: false } : SAMPLE_PLAN)
  const startAt = useMemo(currentMinuteOfDay, [])
  const prices = quote(restaurant, lines, wallet, useWallet)
  const quantity = lines.reduce((sum, line) => sum + line.qty, 0)
  const prepMinutes = live ? Math.round(Math.min(25, Math.max(12, 10 + quantity * 1.5))) : Math.round(restaurant.baseArrival * 0.4)
  const baseArrival = live
    ? Math.round(prepMinutes + CONFIG.pickupLag + plan.travelMinutes * 1.25 + CONFIG.handoff)
    : restaurant.baseArrival
  const first = [baseArrival - 2, baseArrival + 2] as const
  const promised = baseArrival + 2

  useEffect(() => {
    if (!live || place === null || restaurant.lat === null || restaurant.lon === null) return undefined
    let active = true
    const from = { lat: restaurant.lat, lon: restaurant.lon }
    const to = { lat: place.lat, lon: place.lon }
    const load = async () => {
      const [route, weather] = await Promise.all([
        fetchRoute(from, to).then((info) => ({ info, note: '' })).catch(() => ({ info: fallbackRoute(from, to), note: 'Routing service unavailable, so the distance is estimated.' })),
        fetchWeather(to).catch(() => ({ raining: false, summary: '' })),
      ])
      if (!active) return
      setPlan({
        ready: true,
        route: projectRoute(route.info.points),
        travelMinutes: route.info.minutes,
        km: route.info.km,
        raining: weather.raining,
        note: route.note,
      })
    }
    load()
    return () => {
      active = false
    }
  }, [live, place, restaurant.lat, restaurant.lon])

  const place_ = () => {
    const placedAt = Date.now()
    onPlace(
      {
        id: `FC-${String(placedAt).slice(-5)}`,
        restaurant: restaurant.name,
        items: lines.map(({ item, qty }) => ({ name: item.name, qty, hold: item.hold })),
        total: prices.total,
        baseArrival,
        prepMinutes,
        startAt: currentMinuteOfDay(),
        placedAt,
        route: plan.route,
        demo,
        lat: live && place ? place.lat : null,
        lon: live && place ? place.lon : null,
        rainAtOrder: plan.raining,
      },
      prices.discount,
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <button type="button" className="mb-3 flex items-center gap-1.5 text-mute hover:text-ink" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to menu
      </button>
      <h1 className="mb-3 text-2xl font-extrabold tracking-tight">Checkout from {restaurant.name}</h1>

      <Card tone="warning" title="Our promise on this order">
        <div className="flex items-start gap-2">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-acc" aria-hidden />
          <div>
            {plan.ready ? (
              <>
                <p>
                  Expected {formatRange(startAt, first)}. Promised by <b>{formatClock(startAt, promised)}</b>.
                  {plan.km !== null && ` Route: ${plan.km.toFixed(1)} km by road.`}
                </p>
                <p className="mt-1">
                  After that time you earn 1% of your order per minute, up to {money(prices.total * CONFIG.cap)}, paid to your wallet automatically. If we are late you can
                  cancel for a full refund with no fee.
                </p>
              </>
            ) : (
              <p>Calculating your route and live conditions...</p>
            )}
            {plan.raining && (
              <p className="mt-1 flex items-center gap-1.5 text-amb">
                <CloudRain className="h-4 w-4" aria-hidden />
                Rain detected near you. The estimate already allows for it.
              </p>
            )}
            {plan.note && <p className="mt-1 text-xs text-mute">{plan.note}</p>}
          </div>
        </div>
      </Card>

      <Card title="Your order">
        <ul className="grid gap-1">
          {lines.map(({ item, qty }) => (
            <li key={item.id} className="flex justify-between">
              <span className="flex items-center gap-1.5">
                <VegMark veg={item.veg} />
                {qty} x {item.name}
              </span>
              <span className="tabular-nums">{money(item.price * qty)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 grid gap-1 border-t border-line pt-3">
          <div className="flex justify-between">
            <dt className="text-mute">Subtotal</dt>
            <dd className="tabular-nums">{money(prices.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mute">Delivery fee</dt>
            <dd className="tabular-nums">{money(prices.delivery)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-mute">Platform fee (5%)</dt>
            <dd className="tabular-nums">{money(prices.service)}</dd>
          </div>
          {prices.discount > 0 && (
            <div className="flex justify-between text-acc">
              <dt>Wallet credit</dt>
              <dd className="tabular-nums">-{money(prices.discount)}</dd>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <dt>Total</dt>
            <dd className="tabular-nums">{money(prices.total)}</dd>
          </div>
        </dl>
      </Card>

      <Card title="Delivery and payment">
        <label className="mb-3 block">
          <span className="mb-1 block text-mute">Delivery address</span>
          <input value={address} onChange={(event) => setAddress(event.target.value)} className="w-full rounded-lg border border-line bg-bg px-3 py-2" />
        </label>
        <fieldset className="grid gap-1.5">
          <legend className="mb-1 text-mute">Pay with (simulated, no payment is taken)</legend>
          {PAYMENTS.map((option) => (
            <label key={option} className="flex items-center gap-2">
              <input type="radio" name="payment" checked={payment === option} onChange={() => setPayment(option)} />
              {option}
            </label>
          ))}
        </fieldset>
        {wallet > 0 && (
          <label className="mt-3 flex items-center gap-2">
            <input type="checkbox" checked={useWallet} onChange={(event) => setUseWallet(event.target.checked)} />
            Use wallet credit ({money(wallet)} available)
          </label>
        )}
        <label className="mt-3 flex items-start gap-2">
          <input type="checkbox" className="mt-1" checked={demo} disabled={!live} onChange={(event) => setDemo(event.target.checked)} />
          <span>
            Demo mode: fast clock (1 second = 1 minute) with scripted delays.
            <span className="block text-xs text-mute">
              {live
                ? 'Leave off for a real-time order that follows the actual route duration. Delays then come from live weather checks.'
                : 'Sample restaurants always run in demo mode.'}
            </span>
          </span>
        </label>
      </Card>

      {blocked && <p className="mb-2 text-amb">You already have an order in progress. Wait for it to finish before placing another.</p>}
      <button
        type="button"
        disabled={blocked || address.trim() === '' || !plan.ready}
        onClick={place_}
        className="w-full rounded-xl bg-acc px-4 py-3.5 text-base font-bold text-white disabled:opacity-50"
      >
        Place order for {money(prices.total)}
      </button>
    </div>
  )
}
