import type { OrderRecord } from '../lib/orders'
import { money } from '../lib/format'

export function OrdersView({ orders, onBrowse }: { orders: OrderRecord[]; onBrowse: () => void }) {
  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="mb-3 text-2xl font-extrabold tracking-tight">Your orders</h1>
      {orders.length === 0 ? (
        <div className="rounded-2xl border border-line bg-card p-6 text-center">
          <p className="mb-3 text-mute">No completed orders yet.</p>
          <button type="button" className="rounded-lg bg-acc px-4 py-2 font-semibold text-white" onClick={onBrowse}>
            Browse restaurants
          </button>
        </div>
      ) : (
        <ul className="grid gap-3">
          {orders.map((order) => (
            <li key={order.id} className="rounded-2xl border border-line bg-card p-3.5">
              <div className="flex items-center justify-between">
                <b>{order.restaurant}</b>
                <span className="tabular-nums">{money(order.total)}</span>
              </div>
              <div className="text-mute">{order.summary}</div>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                    order.outcome === 'delivered' ? 'bg-ok text-acc' : 'bg-line text-ink'
                  }`}
                >
                  {order.outcome === 'delivered' ? 'Delivered' : 'Cancelled and refunded'}
                </span>
                {order.outcome === 'delivered' && order.minutesLate > 0 && (
                  <span>
                    {order.minutesLate} min late, {money(order.credit)} credited to your wallet
                  </span>
                )}
                {order.outcome === 'delivered' && order.minutesLate === 0 && <span>On time</span>}
                <span className="text-mute">
                  {order.id}, {new Date(order.placedAt).toLocaleString()}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
