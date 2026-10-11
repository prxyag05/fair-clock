import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { CheckoutView } from './components/CheckoutView'
import { HomeView } from './components/HomeView'
import { MenuView } from './components/MenuView'
import { OrdersView } from './components/OrdersView'
import { TopBar, type View } from './components/TopBar'
import { TrackingView } from './components/TrackingView'
import { credit, isFinished, type OrderInput } from './engine/simulation'
import { useCart } from './hooks/useCart'
import { useNearby } from './hooks/useNearby'
import { usePersistentState } from './hooks/usePersistentState'
import { useSimulation } from './hooks/useSimulation'
import { useTheme } from './hooks/useTheme'
import type { CartLine } from './lib/pricing'
import { toRecord, type OrderRecord } from './lib/orders'

export default function App() {
  const { state, dispatch } = useSimulation()
  const { dark, toggle } = useTheme()
  const cart = useCart()
  const nearby = useNearby()
  const [orders, setOrders] = usePersistentState<OrderRecord[]>('fair-clock:orders-v2', [])
  const [wallet, setWallet] = usePersistentState<number>('fair-clock:wallet-v2', 0)
  const [view, setView] = useState<View>(() => (state && !isFinished(state) ? 'tracking' : 'home'))
  const [restaurantId, setRestaurantId] = useState<string | null>(cart.cart.restaurantId)
  const recorded = useRef(new Set(orders.map((order) => order.id)))

  useEffect(() => {
    if (!state || !isFinished(state) || recorded.current.has(state.order.id)) return
    recorded.current.add(state.order.id)
    setOrders((previous) => [toRecord(state), ...previous])
    const earned = state.delivered ? credit(state) : 0
    if (earned > 0) setWallet((current) => Math.round((current + earned) * 100) / 100)
  }, [state, setOrders, setWallet])

  const menuRestaurant = nearby.restaurants.find((restaurant) => restaurant.id === restaurantId)
  const cartRestaurant = nearby.restaurants.find((restaurant) => restaurant.id === cart.cart.restaurantId)
  const lines: CartLine[] = cartRestaurant
    ? cartRestaurant.menu
        .filter((item) => (cart.cart.lines[item.id] ?? 0) > 0)
        .map((item) => ({ item, qty: cart.cart.lines[item.id] ?? 0 }))
    : []

  const open = (id: string) => {
    setRestaurantId(id)
    setView('menu')
  }

  const place = (order: OrderInput, walletUsed: number) => {
    dispatch({ type: 'place', order })
    cart.clear()
    if (walletUsed > 0) setWallet((current) => Math.max(0, Math.round((current - walletUsed) * 100) / 100))
    setView('tracking')
  }

  const goCart = () => {
    if (cartRestaurant && lines.length > 0) setView('checkout')
    else setView('home')
  }

  const page = (() => {
    if (view === 'tracking' && state) {
      return <TrackingView state={state} dispatch={dispatch} onHome={() => setView('home')} onOrders={() => setView('orders')} />
    }
    if (view === 'menu' && menuRestaurant) {
      const quantities = cart.cart.restaurantId === menuRestaurant.id ? cart.cart.lines : {}
      return (
        <MenuView
          restaurant={menuRestaurant}
          quantities={quantities}
          onAdd={(itemId) => cart.add(menuRestaurant.id, itemId)}
          onRemove={cart.remove}
          onCheckout={() => setView('checkout')}
          onBack={() => setView('home')}
        />
      )
    }
    if (view === 'checkout' && cartRestaurant && lines.length > 0) {
      return (
        <CheckoutView
          restaurant={cartRestaurant}
          lines={lines}
          place={nearby.place}
          wallet={wallet}
          blocked={state !== null && !isFinished(state)}
          onPlace={place}
          onBack={() => open(cartRestaurant.id)}
        />
      )
    }
    if (view === 'orders') return <OrdersView orders={orders} onBrowse={() => setView('home')} />
    return <HomeView nearby={nearby} onOpen={open} />
  })()

  return (
    <>
      <TopBar
        view={view}
        cartCount={cart.count}
        wallet={wallet}
        tracking={state !== null}
        dark={dark}
        onNavigate={setView}
        onCart={goCart}
        onToggleTheme={toggle}
      />
      <motion.main key={view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
        {page}
      </motion.main>
    </>
  )
}
