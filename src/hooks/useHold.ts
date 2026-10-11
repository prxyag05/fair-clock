import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'

export function useHold(onComplete: () => void, duration: number) {
  const [holding, setHolding] = useState(false)
  const timer = useRef(0)

  const stop = useCallback(() => {
    window.clearTimeout(timer.current)
    setHolding(false)
  }, [])

  const start = useCallback(() => {
    setHolding(true)
    timer.current = window.setTimeout(() => {
      setHolding(false)
      onComplete()
    }, duration)
  }, [onComplete, duration])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
      event.preventDefault()
      start()
    }
  }

  return {
    holding,
    handlers: {
      onPointerDown: start,
      onPointerUp: stop,
      onPointerLeave: stop,
      onPointerCancel: stop,
      onBlur: stop,
      onKeyDown,
      onKeyUp: stop,
    },
  }
}
