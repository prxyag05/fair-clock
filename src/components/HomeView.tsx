import { Clock, LocateFixed, Search, ShieldCheck, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { useNearby } from '../hooks/useNearby'
import { money } from '../lib/format'
import { CATEGORY_META } from '../lib/menus'

type Nearby = ReturnType<typeof useNearby>

export function HomeView({ nearby, onOpen }: { nearby: Nearby; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState('')
  const [area, setArea] = useState('')
  const [cuisine, setCuisine] = useState('All')
  const busy = nearby.status === 'locating' || nearby.status === 'loading'
  const cuisines = ['All', ...Array.from(new Set(nearby.restaurants.map((restaurant) => restaurant.cuisine)))]

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase()
    return nearby.restaurants.filter(
      (restaurant) =>
        (cuisine === 'All' || restaurant.cuisine === cuisine) &&
        (term === '' || restaurant.name.toLowerCase().includes(term) || restaurant.menu.some((item) => item.name.toLowerCase().includes(term))),
    )
  }, [nearby.restaurants, query, cuisine])

  const submitArea = () => {
    if (area.trim() !== '') nearby.searchArea(area.trim())
  }

  return (
    <div className="mx-auto max-w-6xl p-4">
      <h1 className="text-2xl font-extrabold tracking-tight">Order food you can trust to arrive</h1>
      <p className="mb-4 text-mute">Restaurants near you, with delivery estimates from the real road route and a clear promise on every order.</p>

      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-line bg-card p-3">
        <button
          type="button"
          disabled={busy}
          onClick={nearby.useMyLocation}
          className="flex items-center gap-1.5 rounded-lg bg-acc px-3 py-2 font-semibold text-white disabled:opacity-60"
        >
          <LocateFixed className="h-4 w-4" aria-hidden />
          Use my location
        </button>
        <form
          className="flex min-w-[220px] flex-1 gap-2"
          onSubmit={(event) => {
            event.preventDefault()
            submitArea()
          }}
        >
          <input
            value={area}
            onChange={(event) => setArea(event.target.value)}
            placeholder="Or search an area or address"
            aria-label="Search an area or address"
            className="w-full rounded-lg border border-line bg-bg px-3 py-2"
          />
          <button type="submit" disabled={busy} className="rounded-lg border border-line bg-card px-3 py-2 disabled:opacity-60">
            Search
          </button>
        </form>
        <button type="button" className="rounded-lg border border-line bg-card px-3 py-2" onClick={nearby.useSamples}>
          Use sample restaurants
        </button>
        <div className="w-full text-sm text-mute" role="status">
          {nearby.status === 'locating' && 'Finding your location...'}
          {nearby.status === 'loading' && 'Loading restaurants near you...'}
          {nearby.status === 'error' && (
            <span className="text-danger">
              {nearby.message}{' '}
              <button type="button" className="font-semibold underline" onClick={nearby.retry}>
                Try again
              </button>
            </span>
          )}
          {nearby.status === 'ready' && nearby.place && `Showing restaurants near ${nearby.place.label}`}
          {nearby.status === 'ready' && !nearby.place && 'Showing sample restaurants'}
          {nearby.status === 'idle' && 'Share your location to see real restaurants around you.'}
        </div>
      </div>

      {nearby.restaurants.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <label className="flex min-w-[220px] flex-1 items-center gap-2 rounded-xl border border-line bg-card px-3 py-2">
            <Search className="h-4 w-4 text-mute" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search restaurants or dishes"
              className="w-full bg-transparent outline-none"
              aria-label="Search restaurants or dishes"
            />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {cuisines.slice(0, 10).map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setCuisine(name)}
                className={`rounded-full border px-3 py-1.5 text-sm capitalize ${cuisine === name ? 'border-acc bg-ok' : 'border-line bg-card hover:border-acc'}`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      )}

      {nearby.restaurants.length > 0 && visible.length === 0 && <p className="text-mute">No restaurants match your search.</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((restaurant) => {
          const { icon: Icon, hue } = CATEGORY_META[restaurant.category]
          return (
            <button
              key={restaurant.id}
              type="button"
              onClick={() => onOpen(restaurant.id)}
              className="overflow-hidden rounded-2xl border border-line bg-card text-left transition-shadow hover:shadow-lg"
            >
              <div
                className="flex h-24 items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, hsl(${hue} 70% 45%), hsl(${hue + 30} 70% 32%))` }}
              >
                <Icon className="h-10 w-10" aria-hidden />
              </div>
              <div className="p-3.5">
                <div className="flex items-center justify-between gap-2">
                  <b className="truncate text-base">{restaurant.name}</b>
                  {restaurant.rating !== null && (
                    <span className="flex items-center gap-1 text-sm">
                      <Star className="h-3.5 w-3.5 text-amb" aria-hidden />
                      {restaurant.rating}
                    </span>
                  )}
                </div>
                <div className="capitalize text-mute">
                  {restaurant.cuisine}, delivery {money(restaurant.deliveryFee)}
                  {restaurant.distanceKm !== null && `, ${restaurant.distanceKm.toFixed(1)} km`}
                </div>
                <div className="mt-2 flex items-center gap-1.5 text-sm">
                  <Clock className="h-4 w-4 text-mute" aria-hidden />
                  {restaurant.baseArrival - 2}-{restaurant.baseArrival + 2} min
                </div>
                {restaurant.onTime !== null && (
                  <div className="mt-1 flex items-center gap-1.5 text-sm text-acc">
                    <ShieldCheck className="h-4 w-4" aria-hidden />
                    {restaurant.onTime}% on time (sample data)
                  </div>
                )}
                {restaurant.hours && <div className="mt-1 truncate text-xs text-mute">Hours: {restaurant.hours}</div>}
              </div>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-xs text-mute">
        Real restaurants come from OpenStreetMap. Menus are sample menus by cuisine. Orders are demonstrations: no restaurant is contacted and no payment is taken.
      </p>
    </div>
  )
}
