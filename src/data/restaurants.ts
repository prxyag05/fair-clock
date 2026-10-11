import { menuFor, type Category } from '../lib/menus'

export interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  hold: number
  veg: boolean
}

export interface Restaurant {
  id: string
  name: string
  cuisine: string
  category: Category
  source: 'osm' | 'sample'
  lat: number | null
  lon: number | null
  distanceKm: number | null
  hours: string | null
  rating: number | null
  baseArrival: number
  deliveryFee: number
  onTime: number | null
  typicalDelay: number | null
  menu: MenuItem[]
}

const sample = (
  id: string,
  name: string,
  cuisine: string,
  category: Category,
  rating: number,
  baseArrival: number,
  deliveryFee: number,
  onTime: number,
  typicalDelay: number,
): Restaurant => ({
  id,
  name,
  cuisine,
  category,
  source: 'sample',
  lat: null,
  lon: null,
  distanceKm: null,
  hours: null,
  rating,
  baseArrival,
  deliveryFee,
  onTime,
  typicalDelay,
  menu: menuFor(category, id),
})

export const SAMPLE_RESTAURANTS: Restaurant[] = [
  sample('spice-route', 'Spice Route', 'North Indian', 'indian', 4.5, 38, 35, 84, 6),
  sample('saffron-slice', 'Saffron & Slice', 'Pizza', 'pizza', 4.6, 36, 30, 82, 6),
  sample('burger-forge', 'Burger Forge', 'Burgers', 'burger', 4.5, 32, 25, 76, 8),
  sample('noodle-lane', 'Noodle Lane', 'Chinese', 'chinese', 4.3, 34, 30, 85, 5),
  sample('harbor-sushi', 'Harbor Sushi', 'Japanese', 'japanese', 4.7, 40, 45, 88, 4),
  sample('green-bowl', 'Green Bowl', 'Healthy', 'healthy', 4.4, 30, 25, 91, 3),
]
