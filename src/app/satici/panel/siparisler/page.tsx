export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import SiparisKartlari from './SiparisKartlari'

export const metadata: Metadata = { title: 'Siparişlerim — Satıcı' }

export default async function SaticiSiparislerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>
}) {
  const { durum } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  let query = supabase
    .from('order_items')
    .select('*, orders!inner(order_number, payment_status, paid_at, address_snapshot, user_id, profiles(full_name))')
    .eq('vendor_id', vendor.id)
    .eq('orders.payment_status', 'paid')
    .order('created_at', { ascending: false })

  if (durum && ['pending','preparing','shipped','delivered','cancelled','returned'].includes(durum)) {
    query = query.eq('fulfillment_status', durum)
  }

  const { data: items } = await query.limit(100)

  const statusCounts = {
    pending:    0,
    preparing:  0,
    shipped:    0,
    delivered:  0,
  }
  const { data: counts } = await supabase
    .from('order_items')
    .select('fulfillment_status')
    .eq('vendor_id', vendor.id)
  if (counts) {
    for (const c of counts) {
      const s = c.fulfillment_status as keyof typeof statusCounts
      if (s in statusCounts) statusCounts[s]++
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/satici/panel" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Satıcı Paneli
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Siparişlerim</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Siparişlerim</h1>
          <p className="text-slate-400 text-sm mt-1">{vendor.company_name}</p>
        </div>

        {/* Durum filtreleri */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Link href="/satici/panel/siparisler"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!durum ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
            Tümü
          </Link>
          {[
            { key: 'pending',   label: 'Bekleyen',    count: statusCounts.pending,   color: 'amber' },
            { key: 'preparing', label: 'Hazırlıkta',  count: statusCounts.preparing, color: 'blue' },
            { key: 'shipped',   label: 'Kargoda',     count: statusCounts.shipped,   color: 'violet' },
            { key: 'delivered', label: 'Teslim',      count: statusCounts.delivered, color: 'emerald' },
          ].map(f => (
            <Link key={f.key} href={`/satici/panel/siparisler?durum=${f.key}`}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${durum === f.key ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              {f.label} {f.count > 0 && <span className="ml-1 opacity-70">({f.count})</span>}
            </Link>
          ))}
        </div>

        {/* Kartlar */}
        {items && items.length > 0 ? (
          <SiparisKartlari items={items} />
        ) : (
          <div className="text-center py-24 text-slate-600">
            <div className="text-5xl mb-4">📦</div>
            <p>Bu filtreye uyan sipariş yok</p>
          </div>
        )}
      </div>
    </main>
  )
}
