import { motion } from 'framer-motion'
import { Bike, MapPin, UtensilsCrossed } from 'lucide-react'
import { useLayoutEffect, useRef, useState } from 'react'
import type { Point } from '../engine/simulation'

interface MapViewProps {
  route: Point[]
  progress: number
  label: string
  delayed: boolean
}

const GRID = Array.from({ length: 14 }, (_, index) => index * 60 - 60)

export function MapView({ route, progress, label, delayed }: MapViewProps) {
  const path = useRef<SVGPathElement>(null)
  const [point, setPoint] = useState({ x: route[0][0], y: route[0][1] })
  const d = route.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join('')
  const start = route[0]
  const end = route[route.length - 1]

  useLayoutEffect(() => {
    const element = path.current
    if (!element) return
    const { x, y } = element.getPointAtLength(element.getTotalLength() * progress)
    setPoint({ x, y })
  }, [progress, d])

  return (
    <div className="relative h-full overflow-hidden bg-map">
      <svg
        className="block h-full w-full"
        viewBox="0 0 700 500"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        aria-label="Map showing the rider route from the restaurant to you"
      >
        <rect x="-300" y="-300" width="1300" height="1100" className="fill-map" />
        <g className="stroke-road" strokeWidth="10" fill="none">
          {GRID.map((value) => (
            <path key={value} d={`M-100 ${value}H800M${value} -100V700`} />
          ))}
        </g>
        <path ref={path} d={d} fill="none" className="stroke-mute/40" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
        <motion.path
          d={d}
          fill="none"
          className="stroke-acc"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: progress }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
        <UtensilsCrossed x={start[0] - 16} y={start[1] - 40} size={32} className="text-ink" />
        <MapPin x={end[0] - 16} y={end[1] - 40} size={32} className="text-danger" />
        <motion.g initial={false} animate={{ x: point.x, y: point.y }} transition={{ duration: 0.1, ease: 'linear' }}>
          <motion.circle r={16} className="fill-acc/30" animate={{ r: [12, 22, 12] }} transition={{ duration: 1.8, repeat: Infinity }} />
          <circle r={13} className="fill-acc" />
          <Bike x={-8} y={-8} size={16} className="text-white" />
        </motion.g>
      </svg>
      <div
        role="status"
        aria-live="polite"
        className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-card px-3.5 py-2 text-sm font-semibold shadow-lg"
      >
        <span className={`h-2.5 w-2.5 rounded-full ${delayed ? 'bg-amb' : 'bg-acc'}`} />
        {label}
      </div>
    </div>
  )
}
