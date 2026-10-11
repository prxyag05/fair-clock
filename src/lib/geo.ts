import { SAMPLE_RESTAURANTS, type Restaurant } from '../data/restaurants'
import type { Point } from '../engine/simulation'
import { detectCategory, menuFor } from './menus'

export interface Coordinates {
  lat: number
  lon: number
}

export interface Place extends Coordinates {
  label: string
}

export interface RouteInfo {
  minutes: number
  km: number
  points: Point[]
}

export interface Weather {
  raining: boolean
  summary: string
}

export const DEFAULT_ROUTE: Point[] = [
  [130, 380],
  [330, 380],
  [330, 250],
  [560, 250],
  [560, 110],
]

const BOX = { x: 110, y: 70, w: 480, h: 360 }
const RAIN_CODES = new Set([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99])

export const haversineKm = (a: Coordinates, b: Coordinates): number => {
  const rad = Math.PI / 180
  const dLat = (b.lat - a.lat) * rad
  const dLon = (b.lon - a.lon) * rad
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2
  return 2 * 6371 * Math.asin(Math.sqrt(h))
}

const thin = (points: Point[], max: number): Point[] => {
  if (points.length <= max) return points
  const step = Math.ceil(points.length / max)
  return points.filter((_, index) => index % step === 0 || index === points.length - 1)
}

export const projectRoute = (coordinates: Point[]): Point[] => {
  const points = thin(coordinates, 120)
  const meanLat = points.reduce((sum, point) => sum + point[1], 0) / points.length
  const kx = Math.cos((meanLat * Math.PI) / 180)
  const xs = points.map((point) => point[0] * kx)
  const ys = points.map((point) => -point[1])
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const spanX = Math.max(Math.max(...xs) - minX, 1e-6)
  const spanY = Math.max(Math.max(...ys) - minY, 1e-6)
  const scale = Math.min(BOX.w / spanX, BOX.h / spanY)
  const offX = BOX.x + (BOX.w - spanX * scale) / 2
  const offY = BOX.y + (BOX.h - spanY * scale) / 2
  return points.map((_, index): Point => [offX + (xs[index] - minX) * scale, offY + (ys[index] - minY) * scale])
}

export const locate = (): Promise<Place> =>
  new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('This browser cannot share your location. Search for an area instead.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ lat: position.coords.latitude, lon: position.coords.longitude, label: 'Your current location' }),
      () => reject(new Error('Location permission was denied. Search for an area instead.')),
      { timeout: 12000, maximumAge: 60000 },
    )
  })

export const geocode = async (query: string): Promise<Place> => {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Address search is unavailable right now.')
  const results = (await response.json()) as { lat: string; lon: string; display_name: string }[]
  if (results.length === 0) throw new Error('No place found for that search.')
  return { lat: Number(results[0].lat), lon: Number(results[0].lon), label: results[0].display_name.split(',').slice(0, 2).join(',') }
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lon?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

export const estimateMinutes = (km: number): number => Math.round(14 + (km / 18) * 60 * 1.25 + 5)

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
]

const queryOverpass = async (endpoint: string, query: string): Promise<{ elements: OverpassElement[] }> => {
  const response = await fetch(endpoint, {
    method: 'POST',
    body: new URLSearchParams({ data: query }),
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Overpass responded with ${response.status}`)
  return (await response.json()) as { elements: OverpassElement[] }
}

export const fetchNearbyRestaurants = async (origin: Coordinates, radius = 2500): Promise<Restaurant[]> => {
  const query = `[out:json][timeout:12];nwr["amenity"~"^(restaurant|fast_food|cafe)$"]["name"](around:${radius},${origin.lat},${origin.lon});out center 60;`
  const data = await Promise.any(OVERPASS_ENDPOINTS.map((endpoint) => queryOverpass(endpoint, query))).catch(() => {
    throw new Error('The restaurant data servers are busy right now. Press Try again, or use the sample restaurants.')
  })

  return data.elements
    .flatMap((element): Restaurant[] => {
      const lat = element.lat ?? element.center?.lat
      const lon = element.lon ?? element.center?.lon
      const tags = element.tags ?? {}
      if (lat === undefined || lon === undefined || !tags.name) return []
      const km = haversineKm(origin, { lat, lon })
      const category = detectCategory(tags.cuisine, tags.name)
      const id = `osm-${element.type}-${element.id}`
      return [
        {
          id,
          name: tags.name,
          cuisine: (tags.cuisine ?? tags.amenity ?? 'restaurant').split(';')[0].replace(/_/g, ' '),
          category,
          source: 'osm',
          lat,
          lon,
          distanceKm: km,
          hours: tags.opening_hours ?? null,
          rating: null,
          baseArrival: estimateMinutes(km),
          deliveryFee: Math.round((25 + km * 8) / 5) * 5,
          onTime: null,
          typicalDelay: null,
          menu: menuFor(category, id),
        },
      ]
    })
    .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
    .slice(0, 24)
}

export const fallbackRoute = (from: Coordinates, to: Coordinates): RouteInfo => {
  const km = haversineKm(from, to) * 1.3
  return {
    minutes: (km / 18) * 60,
    km,
    points: [
      [from.lon, from.lat],
      [to.lon, from.lat],
      [to.lon, to.lat],
    ],
  }
}

export const fetchRoute = async (from: Coordinates, to: Coordinates): Promise<RouteInfo> => {
  const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson`
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Routing service unavailable')
  const data = (await response.json()) as {
    routes?: { duration: number; distance: number; geometry: { coordinates: [number, number][] } }[]
  }
  const route = data.routes?.[0]
  if (!route) throw new Error('No route found')
  return {
    minutes: route.duration / 60,
    km: route.distance / 1000,
    points: route.geometry.coordinates.map(([lon, lat]): Point => [lon, lat]),
  }
}

export const fetchWeather = async (at: Coordinates): Promise<Weather> => {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${at.lat}&longitude=${at.lon}&current=precipitation,weather_code`
  const response = await fetch(url, { signal: AbortSignal.timeout(10000) })
  if (!response.ok) throw new Error('Weather service unavailable')
  const data = (await response.json()) as { current?: { precipitation: number; weather_code: number } }
  const current = data.current
  const raining = current !== undefined && (current.precipitation >= 0.2 || RAIN_CODES.has(current.weather_code))
  return { raining, summary: raining ? 'Rain detected near you' : 'No rain detected' }
}

export const samples = (): Restaurant[] => SAMPLE_RESTAURANTS
