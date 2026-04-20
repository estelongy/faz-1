export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'

export const metadata: Metadata = { title: 'Kazançlarım — Satıcı' }

const FULFILLMENT_LABEL: Record<string, string> = {
  pending: 'Hazırlanacak', preparing: 'Hazırlanıyor', shipped: 'Kargoda',
  delivered: 'Teslim', cancelled: 'İptal', returned: 'İade',
}

function monthKey(d: string) {
  return d.slice(0, 7) // YYYY-MM
}

function formatMonth(ym: string) {
  const [y, m] = ym.split('-')
  const names = ['Ocak','Şubat','Mart','Nisan','Mayıs','Haziran','Temmuz','Ağustos','Eylül','Ekim','Kasım','Aralık']
  return `${names[parseInt(m)-1]} ${y}`
}

export default async function KazancPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, commission_rate, stripe_account_id, stripe_payouts_enabled')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  // Sadece ödenen siparişlerin kalemleri
  const { data: items } = await supabase
    .from('order_items')
    .select('id, line_total, commission_amount, vendor_payout, fulfillment_status, created_at, orders!inner(order_number, payment_status, paid_at)')
    .eq('vendor_id', vendor.id)
    .eq('orders.payment_status', 'paid')
    .order('created_at', { ascending: false })

  type Line = {
    id: string
    line_total: number
    commission_amount: number
    vendor_payout: number
    fulfillment_status: string
    created_at: string
    orders: { order_number: string; paid_at: string | null } | { order_number: string; paid_at: string | null }[]
  }

  const lines = (items ?? []) as unknown as Line[]

  const totalGross    = lines.reduce((s, l) => s + Number(l.line_total), 0)
  const totalCommis   = lines.reduce((s, l) => s + Number(l.commission_amount), 0)
  const totalNet      = lines.reduce((s, l) => s + Number(l.vendor_payout), 0)
  const deliveredNet  = lines
    .filter(l => l.fulfillment_status === 'delivered')
    .reduce((s, l) => s + Number(l.vendor_payout), 0)
  const pendingNet    = totalNet - deliveredNet

  // Aylık gruplama
  const monthly: Record<string, { gross: number; commis: number; net: number; count: number }> = {}
  for (const l of lines) {
    const o = Array.isArray(l.orders) ? l.orders[0] : l.orders
    const date = o?.paid_at ?? l.created_at
    const key = monthKey(date)
    if (!monthly[key]) monthly[key] = { gross: 0, commis: 0, net: 0, count: 0 }
    monthly[key].gross  += Number(l.line_total)
    monthly[key].commis += Number(l.commission_amount)
    monthly[key].net    += Number(l.vendor_payout)
    monthly[key].count  += 1
  }
  const months = Object.entries(monthly).sort((a, b) => b[0].localeCompare(a[0]))

  const commissionPct = Number(vendor.commission_rate ?? 0.15) * 100

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/satici/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Satıcı Paneli</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Kazançlarım</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Kazançlarım</h1>
          <p className="text-slate-400 text-sm mt-1">{vendor.company_name} — %{commissionPct.toFixed(0)} platform komisyonu</p>
        </div>

        {/* Stripe uyarı */}
        {!vendor.stripe_payouts_enabled && (
          <Link href="/satici/panel/odeme-hesabi"
            className="flex items-center gap-3 mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl hover:border-amber-500/50 transition-all">
            <span className="text-2xl shrink-0">⚠</span>
            <div className="flex-1">
              <p className="text-amber-300 font-bold text-sm">Banka çekimi henüz aktif değil</p>
              <p className="text-slate-400 text-xs mt-0.5">Kazançlarının banka hesabına çekilebilmesi için ödeme hesabını tamamla</p>
            </div>
            <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Özet kartlar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Toplam Ciro"        value={totalGross}   color="slate"   note={`${lines.length} satış`} />
          <StatCard label="Platform Komisyonu" value={totalCommis}  color="amber"   note={`%${commissionPct.toFixed(0)}`} />
          <StatCard label="Teslim Edilen"      value={deliveredNet} color="emerald" note="net, transfer oldu" />
          <StatCard label="Süreçteki"          value={pendingNet}   color="violet"  note="teslim bekliyor" />
        </div>

        {/* Aylık dökümanlar */}
        {months.length > 0 && (
          <div className="mb-8">
            <h2 className="text-white font-bold text-lg mb-4">Aylık Özet</h2>
            <div className="space-y-2">
              {months.map(([ym, m]) => (
                <div key={ym} className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl flex items-center justify-between gap-4">
                  <div>
                    <p className="text-white font-bold text-sm">{formatMonth(ym)}</p>
                    <p className="text-slate-500 text-xs mt-0.5">{m.count} satış · ₺{m.gross.toLocaleString('tr-TR')} ciro</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-black text-lg">₺{m.net.toLocaleString('tr-TR')}</p>
                    <p className="text-slate-500 text-[11px]">komisyon: ₺{m.commis.toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* İşlem geçmişi */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Son İşlemler</h2>
          {lines.length > 0 ? (
            <div className="overflow-x-auto bg-slate-900 rounded-2xl border border-slate-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Tarih</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Sipariş</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Durum</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Ciro</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Komisyon</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Net</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {lines.slice(0, 30).map(l => {
                    const o = Array.isArray(l.orders) ? l.orders[0] : l.orders
                    return (
                      <tr key={l.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(o?.paid_at ?? l.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-violet-400 font-mono text-xs">{o?.order_number}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {FULFILLMENT_LABEL[l.fulfillment_status] ?? l.fulfillment_status}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-300">₺{Number(l.line_total).toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-right text-amber-400">−₺{Number(l.commission_amount).toLocaleString('tr-TR')}</td>
                        <td className="px-4 py-3 text-right text-emerald-400 font-bold">₺{Number(l.vendor_payout).toLocaleString('tr-TR')}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-600">
              <div className="text-5xl mb-4">💰</div>
              <p>Henüz satış yok</p>
              <p className="text-xs mt-1">İlk satışını yaptığında buradan takip edebilirsin</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

function StatCard({ label, value, color, note }: { label: string; value: number; color: string; note?: string }) {
  const colorMap: Record<string, string> = {
    slate: 'text-slate-200',
    amber: 'text-amber-400',
    emerald: 'text-emerald-400',
    violet: 'text-violet-400',
  }
  return (
    <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl">
      <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">{label}</p>
      <p className={`text-2xl font-black ${colorMap[color]}`}>
        ₺{value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
      </p>
      {note && <p className="text-slate-600 text-[11px] mt-1">{note}</p>}
    </div>
  )
}
