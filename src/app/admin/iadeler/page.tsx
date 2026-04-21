export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import IadeKararForm from '@/app/satici/panel/iadeler/IadeKararForm'

export const metadata: Metadata = { title: 'Admin · İade Arabulucu' }

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Bekliyor',    color: 'bg-amber-500/20 text-amber-400' },
  approved:  { label: 'Onaylandı',   color: 'bg-emerald-500/20 text-emerald-400' },
  rejected:  { label: 'Reddedildi',  color: 'bg-red-500/20 text-red-400' },
  completed: { label: 'Tamamlandı',  color: 'bg-blue-500/20 text-blue-400' },
  cancelled: { label: 'İptal',       color: 'bg-slate-700 text-slate-500' },
}

const RESOLVER_BADGE: Record<string, { label: string; color: string }> = {
  vendor: { label: 'Satıcı',    color: 'bg-violet-500/20 text-violet-400' },
  admin:  { label: 'Admin',     color: 'bg-red-500/20 text-red-400' },
}

// Bekleme süresine göre "geciken" iadeler (3+ gün)
const STALE_DAYS_THRESHOLD = 3

function isStale(createdAt: string, status: string): boolean {
  if (status !== 'pending') return false
  const created = new Date(createdAt).getTime()
  const daysSince = (Date.now() - created) / (1000 * 60 * 60 * 24)
  return daysSince >= STALE_DAYS_THRESHOLD
}

export default async function AdminIadelerPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string }>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect(pathForRole(role))

  const { durum } = await searchParams

  let query = supabase
    .from('returns')
    .select(`
      id, status, reason, description, created_at, refund_amount,
      resolver_note, resolver_type, resolved_at, stripe_refund_id,
      user_id,
      order_items!inner(
        id, product_snapshot, line_total, vendor_id, quantity,
        vendors(id, company_name, user_id),
        orders(order_number, created_at, stripe_payment_intent_id, payment_status)
      )
    `)
    .order('created_at', { ascending: false })
    .limit(100)

  if (durum && durum !== 'tumu') query = query.eq('status', durum)

  const { data: returns } = await query

  // Müşteri email'lerini çek
  const userIds = Array.from(new Set((returns ?? []).map(r => r.user_id).filter(Boolean))) as string[]
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> }
  const nameByUser = new Map((profiles ?? []).map(p => [p.id, p.full_name]))

  // Sayımlar (filter badge'leri için)
  const { data: allReturns } = await supabase
    .from('returns')
    .select('status, created_at')

  const counts = {
    tumu: allReturns?.length ?? 0,
    pending: (allReturns ?? []).filter(r => r.status === 'pending').length,
    stale: (allReturns ?? []).filter(r => isStale(r.created_at, r.status)).length,
    approved: (allReturns ?? []).filter(r => r.status === 'approved').length,
    completed: (allReturns ?? []).filter(r => r.status === 'completed').length,
    rejected: (allReturns ?? []).filter(r => r.status === 'rejected').length,
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <div className="max-w-5xl mx-auto px-4 py-8 lg:ml-56">
        <div className="mb-6">
          <Link href="/admin" className="text-slate-400 hover:text-white text-sm transition-colors">← Admin</Link>
          <div className="flex items-center gap-3 mt-1">
            <h1 className="text-2xl font-bold text-white">İade Arabulucu</h1>
            {counts.stale > 0 && (
              <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full animate-pulse">
                {counts.stale} GECİKEN
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Satıcı-müşteri anlaşmazlıklarında devreye gir · {STALE_DAYS_THRESHOLD}+ gün bekleyen talepler işaretlenir
          </p>
        </div>

        {/* Özet Kartları */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-amber-400/70 text-xs">Bekleyen</p>
            <p className="text-2xl font-black text-amber-400">{counts.pending}</p>
          </div>
          <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20">
            <p className="text-red-400/70 text-xs">Geciken (3+ gün)</p>
            <p className="text-2xl font-black text-red-400">{counts.stale}</p>
          </div>
          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-emerald-400/70 text-xs">Onaylanan</p>
            <p className="text-2xl font-black text-emerald-400">{counts.approved + counts.completed}</p>
          </div>
          <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
            <p className="text-slate-500 text-xs">Toplam</p>
            <p className="text-2xl font-black text-white">{counts.tumu}</p>
          </div>
        </div>

        {/* Filtre */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { key: 'tumu', label: `Tümü (${counts.tumu})` },
            { key: 'pending', label: `Bekleyen (${counts.pending})` },
            { key: 'approved', label: `Onaylanan (${counts.approved})` },
            { key: 'rejected', label: `Reddedilen (${counts.rejected})` },
            { key: 'completed', label: `Tamamlanan (${counts.completed})` },
          ].map(f => (
            <Link key={f.key} href={`/admin/iadeler?durum=${f.key}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
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
              const item = ret.order_items as unknown as {
                id: string
                product_snapshot?: { name?: string }
                line_total?: number
                quantity?: number
                vendors?: { company_name?: string; user_id?: string }
                orders?: { order_number?: string; payment_status?: string }
              } | null
              const badge = STATUS_BADGE[ret.status] ?? { label: ret.status, color: 'bg-slate-700 text-slate-400' }
              const resolverBadge = ret.resolver_type ? RESOLVER_BADGE[ret.resolver_type] : null
              const stale = isStale(ret.created_at, ret.status)
              const customerName = ret.user_id ? nameByUser.get(ret.user_id) ?? '—' : '—'

              return (
                <div key={ret.id}
                  className={`bg-slate-800/50 border rounded-2xl p-5 ${
                    stale ? 'border-red-500/40 ring-1 ring-red-500/20' : 'border-slate-700'
                  }`}>
                  {stale && (
                    <div className="mb-3 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs font-bold">
                      ⚠ Bu talep {Math.floor((Date.now() - new Date(ret.created_at).getTime()) / (1000 * 60 * 60 * 24))} gündür yanıt bekliyor
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate">{item?.product_snapshot?.name ?? 'Ürün'}</p>
                      <div className="text-slate-500 text-xs mt-1 space-y-0.5">
                        {item?.orders?.order_number && <p>Sipariş: <span className="font-mono">#{item.orders.order_number}</span></p>}
                        <p>Satıcı: <span className="text-slate-400">{item?.vendors?.company_name ?? '—'}</span></p>
                        <p>Müşteri: <span className="text-slate-400">{customerName}</span></p>
                        <p>
                          {new Date(ret.created_at).toLocaleDateString('tr-TR', {
                            day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge.color}`}>{badge.label}</span>
                      {item?.line_total && (
                        <p className="text-white font-bold mt-1.5">₺{Number(item.line_total).toLocaleString('tr-TR')}</p>
                      )}
                      {item?.quantity && item.quantity > 1 && (
                        <p className="text-slate-500 text-xs">{item.quantity} adet</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-slate-400 mb-4">
                    <p><span className="text-slate-500">Sebep:</span> {ret.reason}</p>
                    {ret.description && <p><span className="text-slate-500">Açıklama:</span> {ret.description}</p>}
                    {ret.resolver_note && resolverBadge && (
                      <div className="mt-2 p-2.5 bg-slate-900/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${resolverBadge.color}`}>
                            {resolverBadge.label}
                          </span>
                          {ret.resolved_at && (
                            <span className="text-slate-600 text-[10px]">
                              {new Date(ret.resolved_at).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400">{ret.resolver_note}</p>
                      </div>
                    )}
                    {ret.stripe_refund_id && (
                      <p className="text-emerald-400 text-[11px] mt-2">
                        ✓ Stripe iade: <span className="font-mono">{ret.stripe_refund_id}</span>
                      </p>
                    )}
                  </div>

                  {ret.status === 'pending' && (
                    <div className="border-t border-slate-700 pt-3">
                      <p className="text-red-400 text-xs font-bold mb-2">
                        🛡 Admin Müdahale — Satıcı henüz karar vermedi
                      </p>
                      <IadeKararForm returnId={ret.id} />
                    </div>
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
