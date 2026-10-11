import { Moon, ReceiptText, ShoppingBag, Store, Sun, Timer, Wallet } from 'lucide-react'
import { money } from '../lib/format'

export type View = 'home' | 'menu' | 'checkout' | 'tracking' | 'orders'

interface TopBarProps {
  view: View
  cartCount: number
  wallet: number
  tracking: boolean
  dark: boolean
  onNavigate: (view: View) => void
  onCart: () => void
  onToggleTheme: () => void
}

const button = 'flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-sm transition-colors'

export function TopBar({ view, cartCount, wallet, tracking, dark, onNavigate, onCart, onToggleTheme }: TopBarProps) {
  const style = (active: boolean) => `${button} ${active ? 'border-acc bg-ok text-ink' : 'border-line bg-card text-ink hover:border-acc'}`

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-line bg-bg/95 px-3 backdrop-blur sm:px-4">
      <button type="button" className="flex items-center gap-1.5 text-lg font-extrabold" onClick={() => onNavigate('home')}>
        <Timer className="h-5 w-5 text-acc" aria-hidden />
        Fair Clock
      </button>
      <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="Main">
        <button type="button" className={style(view === 'home' || view === 'menu')} onClick={() => onNavigate('home')} aria-label="Restaurants">
          <Store className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Restaurants</span>
        </button>
        {tracking && (
          <button type="button" className={style(view === 'tracking')} onClick={() => onNavigate('tracking')} aria-label="Track order">
            <span className="h-2 w-2 animate-pulse rounded-full bg-acc" />
            <span className="hidden sm:inline">Track order</span>
          </button>
        )}
        <button type="button" className={style(view === 'orders')} onClick={() => onNavigate('orders')} aria-label="Orders">
          <ReceiptText className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Orders</span>
        </button>
        <button type="button" className={style(view === 'checkout')} onClick={onCart} aria-label="Cart">
          <ShoppingBag className="h-4 w-4" aria-hidden />
          {cartCount}
        </button>
        <span className={`${button} border-line bg-card`} title="Wallet credit">
          <Wallet className="h-4 w-4 text-acc" aria-hidden />
          {money(wallet)}
        </span>
        <button type="button" className={`${button} border-line bg-card`} onClick={onToggleTheme} aria-label="Toggle theme">
          {dark ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
        </button>
      </nav>
    </header>
  )
}
