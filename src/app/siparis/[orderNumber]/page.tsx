export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { IadeTalepForm } from './IadeTalepForm'

export const metadata: Metadata = { title: 'Sipariş Takip' }

const PAYMENT_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Ödeme Bekliyor', color: 'bg-amber-500/20 text-amber-400' },
  paid:     { label: 'Ödendi',          color: 'bg-emerald-500/20 text-emerald-400' },
  failed:   { label: 'Ödeme Başarısız', color: 'bg-red-500/20 text-red-400' },
  refunded: { label: 'İade Edildi',     color: 'bg-blue-500/20 text-blue-400' },
}

const FULFILLMENT_STATUS_LABEL: Record<string, { label: string; color: string; icon: string }> = {
  pending:    { label: 'Hazırlanacak',  color: 'text-amber-400',   icon: '⏳' },
  preparing:  { label: 'Hazırlanıyor',  color: 'text-blue-400',    icon: '📦' },
  shipped:    { label: 'Kargoya Verildi', color: 'text-violet-400', icon: '🚚' },
  delivered:  { label: 'Teslim Edildi', color: 'text-emerald-400', icon: '✓' },
  cancelled:  { label: 'İptal Edildi',  color: 'text-red-400',     icon: '✕' },
  returned:   { label: 'İade',          color: 'text-slate-400',   icon: '↩' },
}

export default async function SiparisPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ success?: string }>
}) {
  const { orderNumber } = await params
  const { success } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/giris?next=/siparis/${orderNumber}`)

  const { data: order } = await supabase
    .from('orders')
    .select('*, order_items(*, vendors(company_name), returns(id, status, reason, description, created_at))')
    .eq('order_number', orderNumber)
    .eq('user_id', user.id)
    .single()

  if (!order) notFound()

  const paymentBadge = PAYMENT_STATUS_LABEL[order.payment_status ?? 'pending']

  type OrderItem = {
    id: string
    product_snapshot: { name?: string; image?: string; slug?: string }
    quantity: number
    unit_price: number
    line_total: number
    fulfillment_status?: string | null
    tracking_number?: string | null
    tracking_carrier?: string | null
    vendors?: { company_name?: string } | null
    returns?: { id: string; status: string; reason: string; description: string | null; created_at: string }[] | null
  }

  const itemsByVendor: Record<string, OrderItem[]> = {}
  for (const item of (order.order_items ?? []) as OrderItem[]) {
    const vname = item.vendors?.company_name ?? 'Satıcı'
    if (!itemsByVendor[vname]) itemsByVendor[vname] = []
    itemsByVendor[vname].push(item)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Panelim</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold truncate">{order.order_number}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        {/* Başarı banner */}
        {success === '1' && order.payment_status === 'paid' && (
          <div className="mb-6 p-5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <p className="text-white font-bold">Siparişin alındı!</p>
                <p className="text-emerald-300 text-sm mt-0.5">Satıcılarımız hazırlığa başladı. E-posta ile takip bilgilendirmesi alacaksın.</p>
              </div>
            </div>
          </div>
        )}
        {success === '1' && order.payment_status === 'pending' && (
          <div className="mb-6 p-5 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⏳</span>
              <div>
                <p className="text-white font-bold">Ödeme işleniyor</p>
                <p className="text-amber-300 text-sm mt-0.5">Ödemen doğrulanınca siparişin kargoya hazırlanır. Bu sayfa otomatik yenilenir.</p>
              </div>
            </div>
          </div>
        )}

        {/* Özet */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-xs mb-1">Sipariş No</p>
            <p className="text-white font-black font-mono">{order.order_number}</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-xs mb-1">Tarih</p>
            <p className="text-white font-bold text-sm">
              {new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
            <p className="text-slate-400 text-xs mb-1">Ödeme</p>
            <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${paymentBadge.color}`}>
              {paymentBadge.label}
            </span>
          </div>
        </div>

        {/* Adres */}
        {order.address_snapshot && (
          <div className="mb-6 p-5 bg-slate-800/50 border border-slate-700 rounded-2xl">
            <h3 className="text-white font-bold text-sm mb-2">📍 Teslimat Adresi</h3>
            <p className="text-slate-300 text-sm">{order.address_snapshot.full_name}</p>
            <p className="text-slate-500 text-xs mt-0.5">{order.address_snapshot.phone}</p>
            <p className="text-slate-400 text-sm mt-2 leading-relaxed">
              {order.address_snapshot.address_line},
              {order.address_snapshot.neighborhood && ` ${order.address_snapshot.neighborhood},`}
              {' '}{order.address_snapshot.district} / {order.address_snapshot.city}
            </p>
          </div>
        )}

        {/* Satıcı bazlı kalemler */}
        <div className="space-y-4 mb-6">
          {Object.entries(itemsByVendor).map(([vendorName, items]) => (
            <div key={vendorName} className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-700 flex items-center justify-between">
                <span className="text-slate-300 text-sm font-medium">{vendorName}</span>
                {items[0]?.fulfillment_status && (
                  <span className={`text-xs font-medium ${FULFILLMENT_STATUS_LABEL[items[0].fulfillment_status]?.color ?? 'text-slate-500'}`}>
                    {FULFILLMENT_STATUS_LABEL[items[0].fulfillment_status]?.icon}{' '}
                    {FULFILLMENT_STATUS_LABEL[items[0].fulfillment_status]?.label ?? items[0].fulfillment_status}
                  </span>
                )}
              </div>

              {/* Kalemler */}
              <div className="divide-y divide-slate-700">
                {items.map(item => {
                  const snap = item.product_snapshot as { name?: string; image?: string; slug?: string }
                  return (
                    <div key={item.id}>
                      <div className="flex gap-4 p-4">
                        <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                          {snap?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={snap.image} alt={snap.name ?? ''} className="w-full h-full object-cover" />
                          ) : (
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-medium">{snap?.name ?? 'Ürün'}</p>
                          <p className="text-slate-500 text-xs mt-0.5">
                            {item.quantity} adet × ₺{Number(item.unit_price).toLocaleString('tr-TR')}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-white font-bold text-sm">₺{Number(item.line_total).toLocaleString('tr-TR')}</p>
                        </div>
                      </div>
                      {order.payment_status === 'paid' && (
                        <div className="px-4 pb-3">
                          <IadeTalepForm
                            orderItemId={item.id}
                            productName={snap?.name ?? 'Ürün'}
                            fulfillmentStatus={item.fulfillment_status ?? null}
                            existingReturn={item.returns?.[0] ?? null}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Kargo takip */}
              {items[0]?.tracking_number && (
                <div className="px-5 py-3 bg-slate-900/50 border-t border-slate-700 text-xs">
                  <span className="text-slate-500">Takip No: </span>
                  <span className="text-violet-400 font-mono">{items[0].tracking_number}</span>
                  {items[0].tracking_carrier && (
                    <span className="text-slate-500 ml-2">({items[0].tracking_carrier})</span>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Toplam */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Ara Toplam</span>
              <span className="text-white">₺{Number(order.subtotal ?? order.total_amount ?? 0).toLocaleString('tr-TR')}</span>
            </div>
            {Number(order.shipping_fee ?? 0) > 0 && (
              <div className="flex justify-between text-slate-400">
                <span>Kargo</span>
                <span className="text-white">₺{Number(order.shipping_fee).toLocaleString('tr-TR')}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-3 border-t border-slate-700 mt-2">
              <span className="text-slate-300 font-medium">Toplam</span>
              <span className="text-white font-black text-2xl">
                ₺{Number(order.total ?? order.total_amount ?? 0).toLocaleString('tr-TR')}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/magaza" className="text-violet-400 hover:text-violet-300 text-sm transition-colors">
            Alışverişe Devam Et →
          </Link>
        </div>
      </div>
    </main>
  )
}
