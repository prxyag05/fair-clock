import type { ReactNode } from 'react'

interface CardProps {
  title?: string
  tone?: 'default' | 'warning'
  className?: string
  children: ReactNode
}

export function Card({ title, tone = 'default', className = '', children }: CardProps) {
  const palette = tone === 'warning' ? 'border-amb bg-ambbg' : 'border-line bg-card'
  return (
    <section className={`mb-3 rounded-2xl border p-3.5 ${palette} ${className}`}>
      {title && <h2 className="mb-2 text-[13px] font-bold text-mute">{title}</h2>}
      {children}
    </section>
  )
}
