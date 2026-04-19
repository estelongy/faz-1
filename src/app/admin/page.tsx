export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard',
}

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')

  // İstatistikler paralel çek
  const [
    { count: totalUsers },
    { count: totalClinics },
    { count: pendingClinics },
    { count: totalVendors },
    { count: pendingVendors },
    { count: totalAnalyses },
    { count: totalAppointments },
    { data: recentUsers },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('clinics').select('*', { count: 'exact', head: true }),
    supabase.from('clinics').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('vendors').select('*', { count: 'exact', head: true }),
    supabase.from('vendors').select('*', { count: 'exact', head: true }).eq('approval_status', 'pending'),
    supabase.from('analyses').select('*', { count: 'exact', head: true }),
    supabase.from('appointments').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, role, created_at').order('created_at', { ascending: false }).limit(8),
  ])

  const ROLE_COLOR: Record<string, string> = {
    user: 'bg-slate-700 text-slate-300',
    clinic: 'bg-blue-500/20 text-blue-400',
    vendor: 'bg-amber-500/20 text-amber-400',
    admin: 'bg-red-500/20 text-red-400',
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Estelongy platform genel durumu</p>
      </div>

      {/* Bekleyen onaylar uyarısı */}
      {((pendingClinics ?? 0) > 0 || (pendingVendors ?? 0) > 0) && (
        <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-amber-300 text-sm">
            {(pendingClinics ?? 0) > 0 && <><strong>{pendingClinics}</strong> klinik</>}
            {(pendingClinics ?? 0) > 0 && (pendingVendors ?? 0) > 0 && ' ve '}
            {(pendingVendors ?? 0) > 0 && <><strong>{pendingVendors}</strong> satıcı</>}
            {' '}onay bekliyor.
          </span>
          <div className="ml-auto flex gap-2">
            {(pendingClinics ?? 0) > 0 && (
              <Link href="/admin/klinikler" className="text-xs px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors">Kliniklere git →</Link>
            )}
            {(pendingVendors ?? 0) > 0 && (
              <Link href="/admin/saticilar" className="text-xs px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition-colors">Satıcılara git →</Link>
            )}
          </div>
        </div>
      )}

      {/* İstatistik kartları */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Toplam Kullanıcı', value: totalUsers ?? 0, color: 'from-violet-500 to-purple-600', link: '/admin/kullanicilar', icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          )},
          { label: 'Klinikler', value: totalClinics ?? 0, color: 'from-blue-500 to-cyan-600', link: '/admin/klinikler', badge: pendingClinics ?? 0, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          )},
          { label: 'Satıcılar', value: totalVendors ?? 0, color: 'from-amber-500 to-orange-500', link: '/admin/saticilar', badge: pendingVendors ?? 0, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          )},
          { label: 'Analizler', value: totalAnalyses ?? 0, color: 'from-emerald-500 to-teal-600', link: null, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          )},
          { label: 'Randevular', value: totalAppointments ?? 0, color: 'from-amber-500 to-orange-600', link: null, icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          )},
        ].map(({ label, value, color, link, badge, icon }) => {
          const inner = (
            <>
              {badge ? (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">{badge}</span>
              ) : null}
              {!link && (
                <span className="absolute top-3 right-3 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-500">yakında</span>
              )}
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white mb-3`}>
                {icon}
              </div>
              <div className="text-3xl font-bold text-white mb-0.5">{value.toLocaleString()}</div>
              <div className="text-slate-500 text-sm">{label}</div>
            </>
          )
          return link ? (
            <Link key={label} href={link} className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all group">
              {inner}
            </Link>
          ) : (
            <div key={label} className="relative p-5 rounded-2xl bg-slate-900 border border-slate-800 cursor-default">
              {inner}
            </div>
          )
        })}
      </div>

      {/* Son kayıt olan kullanıcılar */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold">Son Kayıt Olanlar</h2>
          <Link href="/admin/kullanicilar" className="text-xs text-slate-400 hover:text-white transition-colors">
            Tümünü gör →
          </Link>
        </div>
        <div className="space-y-2">
          {recentUsers?.map((u: { id: string; full_name: string | null; role: string; created_at: string }) => (
            <div key={u.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold">
                  {(u.full_name ?? '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-white text-sm font-medium">{u.full_name ?? 'İsimsiz'}</div>
                  <div className="text-slate-500 text-xs">{new Date(u.created_at).toLocaleDateString('tr-TR')}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role] ?? ROLE_COLOR.user}`}>
                {u.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
