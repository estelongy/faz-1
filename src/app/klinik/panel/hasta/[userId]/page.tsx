export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ScoreBar, { type ScorePhase } from '@/components/ScoreBar'
import ScoreChart, { type ScorePoint } from '@/components/ScoreChart'
import KlinikNotlar, { type ClinicNote } from './KlinikNotlar'
import ZiyaretKarti, { type ZiyaretItem, type ZiyaretAnalysis } from '@/components/ZiyaretKarti'
import { saveVisitNotesAction } from './ziyaret-actions'

export const metadata: Metadata = {
  title: 'Hasta Detayı',
}

export default async function HastaDetayPage({
  params,
}: {
  params: { userId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics').select('id, name').eq('user_id', user.id).single()
  if (!clinic) redirect('/klinik/panel')

  // Hasta profili
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, created_at')
    .eq('id', params.userId)
    .single()

  // Bu kliniğe ait randevular (azalan sıra)
  const { data: appts } = await supabase
    .from('appointments')
    .select('id, appointment_date, status, notes, clinic_notes, procedure_notes, recommendations, created_at')
    .eq('user_id', params.userId)
    .eq('clinic_id', clinic.id)
    .order('appointment_date', { ascending: false })
    .limit(20)

  // Analizler (artan sıra — grafik için)
  const { data: analyses } = await supabase
    .from('analyses')
    .select('id, web_overall, temp_overall, final_overall, status, created_at, doctor_notes, doctor_approved_scores, web_scores, appointment_id')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: true })
    .limit(30)

  const latestAnalysis = analyses?.[analyses.length - 1] ?? null
  const latestScore    = latestAnalysis?.final_overall
    ?? latestAnalysis?.temp_overall
    ?? latestAnalysis?.web_overall
    ?? null

  function getCurrentPhase(): ScorePhase {
    if (!latestAnalysis) return 'ai_analiz'
    if (latestAnalysis.final_overall) return 'klinik_onayli'
    if (latestAnalysis.temp_overall)  return 'longevity_anketi'
    return 'ai_analiz'
  }

  const chartPoints: ScorePoint[] = (analyses ?? []).flatMap(a => {
    const pts: ScorePoint[] = []
    const ai = a.web_overall ?? a.temp_overall
    if (ai != null)            pts.push({ date: a.created_at, score: ai,              type: 'ai_analiz'     })
    if (a.final_overall != null) pts.push({ date: a.created_at, score: a.final_overall, type: 'klinik_onayli' })
    return pts
  })

  // Aktif randevu (klinik akışı başlatılabilir)
  const activeAppt = appts?.find(a =>
    ['pending', 'confirmed', 'in_progress'].includes(a.status)
  )

  // Klinik notları
  const { data: notesRaw } = await supabase
    .from('clinic_patient_notes')
    .select('id, note, pinned, created_at, updated_at, author_id')
    .eq('clinic_id', clinic.id)
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })

  // Yazar adlarını çek
  const authorIds = Array.from(new Set((notesRaw ?? []).map(n => n.author_id).filter(Boolean))) as string[]
  const { data: authors } = authorIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', authorIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> }
  const authorByid = new Map((authors ?? []).map(a => [a.id, a.full_name]))

  const notes: ClinicNote[] = (notesRaw ?? []).map(n => ({
    id: n.id,
    note: n.note,
    pinned: n.pinned ?? false,
    created_at: n.created_at,
    updated_at: n.updated_at,
    author_name: n.author_id ? authorByid.get(n.author_id) ?? null : null,
  }))

  // ── Ziyaret zaman çizelgesi kur ─────────────────────────────
  type RawAnalysis = NonNullable<typeof analyses>[number]
  const analysesByAppt = new Map<string, RawAnalysis>()
  const looseAnalyses: RawAnalysis[] = []
  ;(analyses ?? []).forEach(a => {
    if (a.appointment_id) analysesByAppt.set(a.appointment_id, a)
    else looseAnalyses.push(a)
  })

  const toZA = (a: RawAnalysis): ZiyaretAnalysis => ({
    id: a.id,
    web_overall: a.web_overall,
    temp_overall: a.temp_overall,
    final_overall: a.final_overall,
    status: a.status,
    created_at: a.created_at,
    doctor_notes: a.doctor_notes,
    doctor_approved_scores: (a.doctor_approved_scores ?? null) as ZiyaretAnalysis['doctor_approved_scores'],
    web_scores: (a.web_scores ?? null) as Record<string, number> | null,
  })

  const visitItems: ZiyaretItem[] = (appts ?? []).map(apt => {
    const a = analysesByAppt.get(apt.id) ?? null
    return {
      kind: 'visit',
      id: apt.id,
      date: apt.appointment_date ?? apt.created_at,
      status: apt.status,
      reasonNote: apt.notes ?? null,
      clinicNote: apt.clinic_notes ?? null,
      procedureNotes: apt.procedure_notes ?? null,
      recommendations: apt.recommendations ?? null,
      analysis: a ? toZA(a) : null,
      scoreDelta: null,
      appointmentId: apt.id,
      isActive: ['pending', 'confirmed', 'in_progress'].includes(apt.status),
      userId: params.userId,
    }
  })

  const selfItems: ZiyaretItem[] = looseAnalyses.map(a => ({
    kind: 'self_analysis',
    id: a.id,
    date: a.created_at,
    status: a.status ?? '',
    reasonNote: null,
    clinicNote: null,
    procedureNotes: null,
    recommendations: null,
    analysis: toZA(a),
    scoreDelta: null,
    appointmentId: null,
    isActive: false,
    userId: params.userId,
  }))

  // Kronolojik sırala (yeni → eski)
  const timeline = [...visitItems, ...selfItems].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  // Skor farkı: önceki ziyaretin final skoruna göre
  const chronological = [...timeline].reverse()
  let prevFinal: number | null = null
  for (const it of chronological) {
    const cur = it.analysis?.final_overall ?? it.analysis?.web_overall ?? it.analysis?.temp_overall ?? null
    if (prevFinal != null && cur != null) it.scoreDelta = Math.round((cur - prevFinal) * 10) / 10
    if (cur != null) prevFinal = cur
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/klinik/panel" className="text-slate-400 hover:text-white transition-colors text-sm">
              ← Panel
            </Link>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold">
                {(profile?.full_name ?? '?')[0].toUpperCase()}
              </div>
              <span className="text-white font-bold text-sm">{profile?.full_name ?? 'Hasta'}</span>
            </div>
          </div>
          <span className="text-slate-500 text-xs hidden sm:block">{clinic.name}</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">

        {/* ── Başlık ── */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/20 flex items-center justify-center text-violet-400 text-2xl font-black shrink-0">
            {(profile?.full_name ?? '?')[0].toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-black text-white">{profile?.full_name ?? 'Hasta'}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Üyelik: {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('tr-TR') : '—'}
              {' · '}
              {appts?.length ?? 0} randevu
            </p>
          </div>

          {/* Aktif randevu CTA */}
          {activeAppt && (
            <Link
              href={`/klinik/panel/randevu/${activeAppt.id}`}
              className="shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-opacity hover:opacity-90
                bg-gradient-to-r from-violet-600 to-purple-600">
              {activeAppt.status === 'in_progress'
                ? '↗ Klinik Akışına Devam Et'
                : '↗ Klinik Sürecini Başlat'}
            </Link>
          )}
        </div>

        {/* ── EGS + Graf ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Gauge */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            {latestScore !== null ? (
              <ScoreBar score={latestScore} phase={getCurrentPhase()} animated={false} isClinicView />
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-7 h-7 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-400 font-medium text-sm">Estelongy Gençlik Skoru yok</p>
                  <p className="text-slate-600 text-xs mt-0.5">Hasta henüz analiz yapmamış</p>
                </div>
              </div>
            )}
          </div>

          {/* Skor geçmişi grafiği */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-white font-bold mb-4">Skor Geçmişi</h2>
            {chartPoints.length > 0 ? (
              <ScoreChart points={chartPoints} />
            ) : (
              <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
                Henüz analiz verisi yok
              </div>
            )}
          </div>
        </div>

        {/* ── Klinik Notları ── */}
        <KlinikNotlar userId={params.userId} notes={notes} />

        {/* ── Ziyaret Zaman Çizelgesi ── */}
        <div className="mt-6 space-y-4">
          <h2 className="text-white font-bold text-lg px-1">
            Ziyaret & Analiz Geçmişi ({timeline.length})
          </h2>
          {timeline.length > 0 ? (
            timeline.map(item => (
              <ZiyaretKarti
                key={`${item.kind}-${item.id}`}
                item={item}
                editable={item.kind === 'visit'}
                klinikAkisLink
                saveVisitNotes={saveVisitNotesAction}
              />
            ))
          ) : (
            <div className="bg-slate-900 rounded-2xl border border-slate-800 py-12 text-center text-slate-600">
              Henüz ziyaret veya analiz bulunmuyor
            </div>
          )}
        </div>

      </div>
    </main>
  )
}
