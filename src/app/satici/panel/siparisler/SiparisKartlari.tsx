'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { kargoGuncelleAction, fulfillmentGuncelleAction } from './siparis-actions'

interface Profile { full_name?: string | null }
interface OrderInfo {
  order_number: string
  payment_status: string
  paid_at: string | null
  address_snapshot: Record<string, string>
  user_id: string
  profiles?: Profile | null
}
interface OrderItem {
  id: string
  order_id: string
  product_id: string | null
  product_snapshot: { name?: string; image?: string }
  quantity: number
  unit_price: number
  line_total: number
  vendor_payout: number
  fulfillment_status: string
  tracking_number: string | null
  tracking_carrier: string | null
  shipped_at: string | null
  created_at: string
  orders: OrderInfo
}

const CARRIERS = ['Yurtiçi Kargo', 'Aras Kargo', 'MNG Kargo', 'PTT Kargo', 'Sürat Kargo', 'HepsiJet', 'Diğer']

export default function SiparisKartlari({ items }: { items: OrderItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [trackingDrafts, setTrackingDrafts] = useState<Record<string, { no: string; carrier: string }>>({})

  function setDraft(id: string, field: 'no' | 'carrier', value: string) {
    setTrackingDrafts(p => ({
      ...p,
      [id]: { ...p[id], [field]: value },
    }))
  }

  function handleStatus(itemId: string, status: 'preparing' | 'delivered' | 'cancelled') {
    startTransition(async () => {
      await fulfillmentGuncelleAction(itemId, status)
      router.refresh()
    })
  }

  function handleKargo(itemId: string) {
    const draft = trackingDrafts[itemId]
    if (!draft?.no?.trim()) return
    startTransition(async () => {
      await kargoGuncelleAction(itemId, draft.no.trim(), draft.carrier || 'Diğer')
      router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      {items.map(item => {
        const snap = item.product_snapshot
        const addr = item.orders.address_snapshot
        const customerName = item.orders.profiles?.full_name ?? addr?.full_name ?? 'Müşteri'
        const expanded = expandedId === item.id

        return (
          <div key={item.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <div className="p-5">
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700">
                  {snap?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={snap.image} alt={snap.name ?? ''} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">📦</div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-white font-bold">{snap?.name ?? 'Ürün'}</p>
                    <StatusBadge status={item.fulfillment_status} />
                  </div>
                  <div className="text-slate-500 text-xs">
                    {item.quantity} adet · ₺{Number(item.unit_price).toLocaleString('tr-TR')} birim
                  </div>
                  <div className="text-slate-400 text-sm mt-2">
                    {item.orders.order_number} · {customerName}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-slate-500 text-xs">Net Kazanç</p>
                  <p className="text-emerald-400 font-black text-lg">₺{Number(item.vendor_payout).toLocaleString('tr-TR')}</p>
                </div>
              </div>

              <button onClick={() => setExpandedId(expanded ? null : item.id)}
                className="mt-4 text-xs text-violet-400 hover:text-violet-300 transition-colors">
                {expanded ? '− Küçült' : '+ Detay & İşlemler'}
              </button>
            </div>

            {expanded && (
              <div className="px-5 pb-5 pt-0 border-t border-slate-700/50 space-y-4">
                {/* Teslim adresi */}
                <div className="bg-slate-900/50 rounded-xl p-4 text-sm">
                  <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Teslimat Adresi</p>
                  <p className="text-white font-medium">{addr?.full_name}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{addr?.phone}</p>
                  <p className="text-slate-300 mt-2">
                    {addr?.address_line}, {addr?.neighborhood && `${addr.neighborhood}, `}
                    {addr?.district} / {addr?.city}
                    {addr?.postal_code && ` · ${addr.postal_code}`}
                  </p>
                </div>

                {/* Aksiyon butonları */}
                {item.fulfillment_status === 'pending' && (
                  <button onClick={() => handleStatus(item.id, 'preparing')}
                    disabled={isPending}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm transition-all">
                    📦 Hazırlamaya Başla
                  </button>
                )}

                {item.fulfillment_status === 'preparing' && (
                  <div className="space-y-3">
                    <p className="text-white font-bold text-sm">Kargo Bilgisi Gir</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={trackingDrafts[item.id]?.carrier ?? 'Yurtiçi Kargo'}
                        onChange={e => setDraft(item.id, 'carrier', e.target.value)}
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500">
                        {CARRIERS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <input type="text"
                        value={trackingDrafts[item.id]?.no ?? ''}
                        onChange={e => setDraft(item.id, 'no', e.target.value)}
                        placeholder="Takip numarası"
                        className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
                    </div>
                    <button onClick={() => handleKargo(item.id)}
                      disabled={isPending || !trackingDrafts[item.id]?.no?.trim()}
                      className="w-full py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm">
                      🚚 Kargoya Verdim
                    </button>
                  </div>
                )}

                {item.fulfillment_status === 'shipped' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-violet-500/10 border border-violet-500/30 rounded-xl">
                      <p className="text-violet-300 text-sm font-medium">Kargoda</p>
                      <p className="text-slate-400 text-xs mt-1">
                        {item.tracking_carrier} · <span className="font-mono">{item.tracking_number}</span>
                      </p>
                    </div>
                    <button onClick={() => handleStatus(item.id, 'delivered')}
                      disabled={isPending}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-semibold rounded-xl text-sm">
                      ✓ Teslim Edildi
                    </button>
                  </div>
                )}

                {item.fulfillment_status === 'delivered' && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm text-center">
                    ✓ Teslim edildi
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:    { label: 'Bekliyor',   cls: 'bg-amber-500/20 text-amber-400' },
    preparing:  { label: 'Hazırlanıyor', cls: 'bg-blue-500/20 text-blue-400' },
    shipped:    { label: 'Kargoda',    cls: 'bg-violet-500/20 text-violet-400' },
    delivered:  { label: 'Teslim',     cls: 'bg-emerald-500/20 text-emerald-400' },
    cancelled:  { label: 'İptal',      cls: 'bg-red-500/20 text-red-400' },
    returned:   { label: 'İade',       cls: 'bg-slate-500/20 text-slate-400' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>
}
