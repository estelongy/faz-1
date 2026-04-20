export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Siparişlerim — Estelongy' }

const STATUS: Record<string, { label: string; color: string }> = {
  pending:  { label: 'Ödeme Bekliyor', color: 'bg-amber-500/20 text-amber-400' },
  paid:     { label: 'Ödendi',          color: 'bg-emerald-500/20 text-emerald-400' },
  failed:   { label: 'Başarısız',       color: 'bg-red-500/20 text-red-400' },
  refunded: { label: 'İade Edildi',     color: 'bg-blue-500/20 text-blue-400' },
}

export default async function SiparislerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?next=/panel/siparislerim')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_number, payment_status, total, created_at, order_items(product_snapshot, quantity)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Panelim</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Siparişlerim</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <h1 className="text-2xl font-black text-white mb-6">Siparişlerim</h1>

        {!orders || orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🛒</div>
            <p className="text-slate-400">Henüz sipariş vermedin</p>
            <Link href="/magaza" className="mt-4 inline-block text-violet-400 hover:text-violet-300 text-sm transition-colors">
              Mağazaya Git →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(o => {
              const badge = STATUS[o.payment_status ?? 'pending'] ?? { label: o.payment_status, color: 'bg-slate-700 text-slate-400' }
              const items = (o.order_items ?? []) as { product_snapshot?: { name?: string }; quantity?: number }[]
              const firstNames = items.slice(0, 2).map(x => x.product_snapshot?.name ?? 'Ürün').join(', ')
              const more = items.length > 2 ? ` +${items.length - 2}` : ''
              return (
                <Link key={o.id} href={`/siparis/${o.order_number}`}
                  className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-2xl p-5 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-white font-bold font-mono text-sm">{o.order_number}</p>
                      <p className="text-slate-400 text-xs mt-1 line-clamp-1">{firstNames}{more}</p>
                      <p className="text-slate-600 text-xs mt-1">
                        {new Date(o.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                      <p className="text-white font-black mt-2">₺{Number(o.total ?? 0).toLocaleString('tr-TR')}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}
