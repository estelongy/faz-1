export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import IadeKararForm from './IadeKararForm'

export const metadata: Metadata = { title: 'İade Talepleri — Satıcı Paneli' }

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Bekliyor',    color: 'bg-amber-500/20 text-amber-400' },
  approved:  { label: 'Onaylandı',   color: 'bg-emerald-500/20 text-emerald-400' },
  rejected:  { label: 'Reddedildi',  color: 'bg-red-500/20 text-red-400' },
  completed: { label: 'Tamamlandı',  color: 'bg-blue-500/20 text-blue-400' },
  cancelled: { label: 'İptal',       color: 'bg-slate-700 text-slate-500' },
}

export default async function SaticiIadelerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!vendor) redirect('/satici/basvuru')

  const { durum } = await searchParams

  let query = supabase
    .from('returns')
    .select('id, status, reason, description, created_at, refund_amount, resolver_note, order_items!inner(id, product_snapshot, line_total, vendor_id, orders(order_number, created_at))')
    .eq('order_items.vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  if (durum && durum !== 'tumu') query = query.eq('status', durum)

  const { data: returns } = await query

  const pendingCount = (returns ?? []).filter(r => r.status === 'pending').length

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/satici/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Satıcı Paneli</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">İade Talepleri</span>
          {pendingCount > 0 && (
            <span className="bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded-full">{pendingCount}</span>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black text-white">İade Talepleri</h1>
        </div>

        {/* Filtre */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'tumu', label: 'Tümü' },
            { key: 'pending', label: 'Bekleyen' },
            { key: 'approved', label: 'Onaylanan' },
            { key: 'rejected', label: 'Reddedilen' },
          ].map(f => (
            <Link key={f.key} href={`/satici/panel/iadeler?durum=${f.key}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                (durum ?? 'tumu') === f.key
                  ? 'bg-violet-600 text-white'
                  : 'bg-slate-800 border border-slate-700 text-slate-400 hover:text-white'
              }`}>
              {f.label}
            </Link>
          ))}
        </div>

        {!returns || returns.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">↩</div>
            <p className="text-slate-400">İade talebi yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {returns.map(ret => {
              const item = ret.order_items as unknown as { id: string; product_snapshot?: { name?: string }; line_total?: number; orders?: { order_number?: string } } | null
              const badge = STATUS_BADGE[ret.status] ?? { label: ret.status, color: 'bg-slate-700 text-slate-400' }
              return (
                <div key={ret.id} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-white font-bold">{item?.product_snapshot?.name ?? 'Ürün'}</p>
                      {item?.orders?.order_number && (
                        <p className="text-slate-500 text-xs mt-0.5">Sipariş #{item.orders.order_number}</p>
                      )}
                      <p className="text-slate-500 text-xs mt-0.5">
                        {new Date(ret.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                      {item?.line_total && (
                        <p className="text-white font-bold mt-1">₺{Number(item.line_total).toLocaleString('tr-TR')}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mb-4">
                    <p><span className="text-slate-500">Sebep:</span> {ret.reason}</p>
                    {ret.description && <p><span className="text-slate-500">Açıklama:</span> {ret.description}</p>}
                    {ret.resolver_note && (
                      <p className="mt-2 p-2 bg-slate-900/50 rounded-lg">
                        <span className="text-slate-500">Notun:</span> {ret.resolver_note}
                      </p>
                    )}
                  </div>

                  {ret.status === 'pending' && (
                    <IadeKararForm returnId={ret.id} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
