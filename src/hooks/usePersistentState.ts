import { useEffect, useState } from 'react'
import { loadJson, saveJson } from '../lib/storage'

export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadJson(key, fallback))

  useEffect(() => {
    saveJson(key, value)
  }, [key, value])

  return [value, setValue] as const
}
