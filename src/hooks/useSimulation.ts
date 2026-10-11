import { useEffect, useReducer, useRef } from 'react'
import { CONFIG, isFinished, platformReducer, reducer, type SimState } from '../engine/simulation'
import { fetchWeather } from '../lib/geo'
import { loadJson, saveJson } from '../lib/storage'

const TICK_MS = 100
const SIM_MINUTES_PER_SECOND = 1
const SAVE_MS = 2000
const WEATHER_POLL_MS = 120000
const STORAGE_KEY = 'fair-clock:active-v3'

interface Saved {
  state: SimState | null
  savedAt: number
}

const restore = (): SimState | null => {
  const saved = loadJson<Saved | null>(STORAGE_KEY, null)
  if (!saved || !saved.state) return null
  if (isFinished(saved.state)) return saved.state
  return reducer(saved.state, { type: 'tick', dt: ((Date.now() - saved.savedAt) / 1000) * SIM_MINUTES_PER_SECOND })
}

export function useSimulation() {
  const [state, dispatch] = useReducer(platformReducer, null, restore)
  const latest = useRef(state)
  latest.current = state

  const running = state !== null && !isFinished(state)
  const cancelled = state?.cancelled ?? false
  const orderId = state?.order.id ?? ''
  const lat = state?.order.lat ?? null
  const lon = state?.order.lon ?? null
  const watchWeather = running && !state.order.demo && lat !== null && lon !== null && !state.order.rainAtOrder && !state.weatherFired

  useEffect(() => {
    if (!running) return undefined
    let last = Date.now()
    const id = window.setInterval(() => {
      const now = Date.now()
      dispatch({ type: 'tick', dt: ((now - last) / 1000) * SIM_MINUTES_PER_SECOND })
      last = now
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [running])

  useEffect(() => {
    if (!cancelled) return undefined
    const ids = Array.from({ length: CONFIG.refundSteps }, (_, i) =>
      window.setTimeout(() => dispatch({ type: 'refund' }), 800 + i * 1800),
    )
    return () => ids.forEach((id) => window.clearTimeout(id))
  }, [cancelled, orderId])

  useEffect(() => {
    if (!watchWeather || lat === null || lon === null) return undefined
    let active = true
    const id = window.setInterval(async () => {
      try {
        const weather = await fetchWeather({ lat, lon })
        if (active && weather.raining) dispatch({ type: 'weather' })
      } catch {
        return
      }
    }, WEATHER_POLL_MS)
    return () => {
      active = false
      window.clearInterval(id)
    }
  }, [watchWeather, orderId, lat, lon])

  useEffect(() => {
    const save = () => saveJson(STORAGE_KEY, { state: latest.current, savedAt: Date.now() })
    save()
    const id = window.setInterval(save, SAVE_MS)
    window.addEventListener('pagehide', save)
    return () => {
      window.clearInterval(id)
      window.removeEventListener('pagehide', save)
    }
  }, [])

  useEffect(() => {
    saveJson(STORAGE_KEY, { state: latest.current, savedAt: Date.now() })
  }, [orderId, running, cancelled])

  return { state, dispatch }
}
