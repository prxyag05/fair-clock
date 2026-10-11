import { useCallback, useRef, useState } from 'react'
import { SAMPLE_RESTAURANTS, type Restaurant } from '../data/restaurants'
import { fetchNearbyRestaurants, geocode, locate, type Place } from '../lib/geo'
import { usePersistentState } from './usePersistentState'

export type NearbyStatus = 'idle' | 'locating' | 'loading' | 'ready' | 'error'

interface NearbyData {
  place: Place | null
  restaurants: Restaurant[]
}

export function useNearby() {
  const [data, setData] = usePersistentState<NearbyData>('fair-clock:nearby-v3', { place: null, restaurants: [] })
  const [status, setStatus] = useState<NearbyStatus>(data.restaurants.length > 0 ? 'ready' : 'idle')
  const [message, setMessage] = useState('')
  const last = useRef<(() => Promise<Place>) | null>(null)

  const load = useCallback(
    async (resolve: () => Promise<Place>) => {
      last.current = resolve
      setMessage('')
      setStatus('locating')
      try {
        const place = await resolve()
        setStatus('loading')
        const restaurants = await fetchNearbyRestaurants(place)
        setData({ place, restaurants })
        if (restaurants.length === 0) {
          setMessage('No restaurants found within 2.5 km. Try another area or use the sample restaurants.')
          setStatus('error')
          return
        }
        setStatus('ready')
      } catch (error) {
        setMessage(error instanceof Error ? error.message : 'Could not load nearby restaurants.')
        setStatus('error')
      }
    },
    [setData],
  )

  const useMyLocation = useCallback(() => load(locate), [load])
  const searchArea = useCallback((query: string) => load(() => geocode(query)), [load])

  const retry = useCallback(() => {
    if (last.current) load(last.current)
  }, [load])

  const useSamples = useCallback(() => {
    setData({ place: null, restaurants: SAMPLE_RESTAURANTS })
    setMessage('')
    setStatus('ready')
  }, [setData])

  return { place: data.place, restaurants: data.restaurants, status, message, useMyLocation, searchArea, useSamples, retry }
}
