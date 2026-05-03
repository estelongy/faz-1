export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Hastalarım — Klinik',
}

export default async function HastalarimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/basvur')

  // Bu kliniğe randevu almış tüm benzersiz hastalar
  const { data: appts } = await supabase
    .from('appointments')
    .select('user_id, appointment_date, status')
    .eq('clinic_id', clinic.id)
    .order('appointment_date', { ascending: false })

  const apptsList = (appts ?? []) as Array<{ user_id: string; appointment_date: string | null; status: string }>

  // user_id bazında özet
  const map = new Map<string, {
    user_id: string
    last_visit: string | null
    total_appts: number
    completed: number
  }>()

  for (const a of apptsList) {
    const existing = map.get(a.user_id)
    if (!existing) {
      map.set(a.user_id, {
        user_id: a.user_id,
        last_visit: a.appointment_date,
        total_appts: 1,
        completed: a.status === 'completed' ? 1 : 0,
      })
    } else {
      existing.total_appts += 1
      if (a.status === 'completed') existing.completed += 1
      if (a.appointment_date && (!existing.last_visit || a.appointment_date > existing.last_visit)) {
        existing.last_visit = a.appointment_date
      }
    }
  }

  const userIds = Array.from(map.keys())

  // Profil bilgilerini çek
  const { data: profiles } = userIds.length > 0
    ? await supabase
        .from('profiles')
        .select('id, full_name, birth_year')
        .in('id', userIds)
    : { data: [] }

  // En son skoru çek
  const { data: analyses } = userIds.length > 0
    ? await supabase
        .from('analyses')
        .select('user_id, web_overall, temp_overall, final_overall, created_at')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]))
  const scoreMap = new Map<string, { score: number; isFinal: boolean }>()
  for (const a of analyses ?? []) {
    if (!scoreMap.has(a.user_id)) {
      const score = a.final_overall ?? a.temp_overall ?? a.web_overall
      if (score != null) scoreMap.set(a.user_id, { score, isFinal: !!a.final_overall })
    }
  }

  const hastalar = Array.from(map.values()).sort((a, b) => {
    const ad = a.last_visit ? new Date(a.last_visit).getTime() : 0
    const bd = b.last_visit ? new Date(b.last_visit).getTime() : 0
    return bd - ad
  })

  function scoreColorClass(s: number) {
    if (s >= 90) return 'text-cyan-400'
    if (s >= 80) return 'text-emerald-400'
    if (s >= 66) return 'text-amber-400'
    if (s >= 56) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Hastalarım</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          {clinic.name} kliniğinize randevu almış tüm hastalar — toplam <strong className="text-white">{hastalar.length}</strong> kişi.
        </p>
      </div>

      {hastalar.length === 0 ? (
        <div className="p-8 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
          <div className="text-5xl mb-3">👥</div>
          <p className="text-white font-semibold mb-1">Henüz hasta kaydınız yok</p>
          <p className="text-slate-400 text-sm">İlk randevu geldiğinde hasta listenizde burada görünecek.</p>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3 font-medium">Hasta</th>
                  <th className="text-left px-4 py-3 font-medium">Yaş</th>
                  <th className="text-left px-4 py-3 font-medium">Skor</th>
                  <th className="text-left px-4 py-3 font-medium">Son Ziyaret</th>
                  <th className="text-center px-4 py-3 font-medium">Toplam</th>
                  <th className="text-center px-4 py-3 font-medium">Tamamlanan</th>
                  <th className="text-right px-4 py-3 font-medium">Detay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {hastalar.map(h => {
                  const profile = profileMap.get(h.user_id) as { full_name?: string | null; birth_year?: number | null } | undefined
                  const score = scoreMap.get(h.user_id)
                  const yas = profile?.birth_year ? new Date().getFullYear() - profile.birth_year : null

                  return (
                    <tr key={h.user_id} className="hover:bg-slate-800/40 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-sm font-bold shrink-0">
                            {(profile?.full_name ?? '?')[0].toUpperCase()}
                          </div>
                          <span className="text-white font-medium">{profile?.full_name ?? 'İsimsiz'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-400">{yas ?? '—'}</td>
                      <td className="px-4 py-3">
                        {score
                          ? <span className={`font-black text-base ${scoreColorClass(score.score)}`}>
                              {score.score}{score.isFinal && <span className="ml-0.5 text-emerald-400">✦</span>}
                            </span>
                          : <span className="text-slate-600">—</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {h.last_visit
                          ? new Date(h.last_visit).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
                          : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-white font-semibold">{h.total_appts}</td>
                      <td className="px-4 py-3 text-center text-emerald-400 font-semibold">{h.completed}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/klinik/panel/hasta/${h.user_id}`}
                          className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300 text-xs font-semibold opacity-60 group-hover:opacity-100 transition-opacity">
                          Aç
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
