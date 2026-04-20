export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KlinikAkisWizard from '@/components/KlinikAkisWizard'
import { longevityToPoints, tetkikToPoints, sumComponents, finalApprovedScore } from '@/lib/egs'

// ── Server Actions ─────────────────────────────────────────────────

async function kabulEt(apptId: string): Promise<{ ok: boolean; error?: string }> {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Yetkilendirme hatası' }

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  // Atomik jeton düşme + transaction log (SECURITY DEFINER RPC)
  const { data: result, error: jetonErr } = await supabase.rpc('consume_jeton', {
    p_clinic_id: clinic.id,
    p_appointment_id: apptId,
    p_description: 'Hasta kabulü',
  }).single()
  if (jetonErr) return { ok: false, error: 'Jeton işlemi başarısız' }
  const r = result as { ok: boolean; new_balance: number; err: string | null } | null
  if (!r?.ok) return { ok: false, error: r?.err ?? 'Yetersiz jeton bakiyesi. Lütfen jeton yükleyin.' }

  // Randevu güncelle
  await supabase.from('appointments')
    .update({ status: 'in_progress' })
    .eq('id', apptId)
    .eq('clinic_id', clinic.id)

  return { ok: true }
}

async function upsertKlinikScore(
  supabase: Awaited<ReturnType<typeof createClient>>,
  patch: {
    user_id: string
    analysis_id: string
    appointment_id: string
    clinic_id: string
    c250_base?: number
    hasta_anket_puani?: number
    klinik_anket_puani?: number
    tetkik_puani?: number
    hekim_degerlendirme?: number
    hekim_onay_puani?: number
    total_score?: number
  }
) {
  const { data: existing } = await supabase
    .from('scores')
    .select('id')
    .eq('appointment_id', patch.appointment_id)
    .eq('score_type', 'klinik_onayli')
    .maybeSingle()

  if (existing) {
    await supabase.from('scores').update({
      ...patch,
      overall_score: patch.total_score != null ? Math.round(patch.total_score) : undefined,
    }).eq('id', existing.id)
  } else {
    await supabase.from('scores').insert({
      ...patch,
      score_type: 'klinik_onayli',
      overall_score: patch.total_score != null ? Math.round(patch.total_score) : null,
    })
  }
}

async function saveAnket(apptId: string, analysisId: string, answers: Record<string, number>, total: number) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const userId = await getUserIdFromAnalysis(supabase, analysisId)
  await supabase.from('analyses').update({
    device_type: 'klinik_anketi',
    device_raw_data: answers,
    device_scores: answers,
    device_overall: total,
  }).eq('id', analysisId).eq('user_id', userId)

  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  const { data: a } = await supabase.from('analyses').select('web_overall, temp_overall').eq('id', analysisId).single()
  if (!clinic) return

  const klinikPuan = longevityToPoints(answers)
  // Hasta anketi puanını al (çift sayım önleme)
  const { data: onAnaliz } = await supabase
    .from('scores').select('hasta_anket_puani')
    .eq('user_id', userId).eq('analysis_id', analysisId).eq('score_type', 'on_analiz').maybeSingle()
  const hastaPuan = Number(onAnaliz?.hasta_anket_puani ?? 0)
  const deltaKlinik = klinikPuan - hastaPuan

  const c250 = Number(a?.web_overall ?? a?.temp_overall ?? 50)
  const total_score = sumComponents({
    c250_base: c250,
    hasta_anket_puani: hastaPuan,
    klinik_anket_puani: deltaKlinik,
  })

  await upsertKlinikScore(supabase, {
    user_id: userId,
    analysis_id: analysisId,
    appointment_id: apptId,
    clinic_id: clinic.id,
    c250_base: c250,
    hasta_anket_puani: hastaPuan,
    klinik_anket_puani: deltaKlinik,
    total_score,
  })
}

async function saveTetkik(apptId: string, analysisId: string, data: Record<string, number>) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: existing } = await supabase.from('analyses').select('doctor_approved_scores').eq('id', analysisId).single()
  const merged = { ...(existing?.doctor_approved_scores ?? {}), tetkik: data }
  await supabase.from('analyses').update({ doctor_approved_scores: merged }).eq('id', analysisId)

  const { data: s } = await supabase
    .from('scores')
    .select('id, c250_base, hasta_anket_puani, klinik_anket_puani')
    .eq('appointment_id', apptId).eq('score_type', 'klinik_onayli').maybeSingle()

  if (s) {
    const tetkikPuan = tetkikToPoints(data)
    const total = sumComponents({
      c250_base: Number(s.c250_base ?? 0),
      hasta_anket_puani: Number(s.hasta_anket_puani ?? 0),
      klinik_anket_puani: Number(s.klinik_anket_puani ?? 0),
      tetkik_puani: tetkikPuan,
    })
    await supabase.from('scores').update({
      tetkik_puani: tetkikPuan,
      total_score: total,
      overall_score: Math.round(total),
    }).eq('id', s.id)
  }
}

async function saveHekim(apptId: string, analysisId: string, score: number, notes: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: existing } = await supabase.from('analyses').select('doctor_approved_scores').eq('id', analysisId).single()
  const merged = { ...(existing?.doctor_approved_scores ?? {}), hekim_skoru: score }
  await supabase.from('analyses').update({
    doctor_id: user.id,
    doctor_notes: notes,
    doctor_approved_scores: merged,
  }).eq('id', analysisId)

  const { data: s } = await supabase
    .from('scores')
    .select('id, c250_base, hasta_anket_puani, klinik_anket_puani, tetkik_puani')
    .eq('appointment_id', apptId).eq('score_type', 'klinik_onayli').maybeSingle()
  if (s) {
    const total = sumComponents({
      c250_base: Number(s.c250_base ?? 0),
      hasta_anket_puani: Number(s.hasta_anket_puani ?? 0),
      klinik_anket_puani: Number(s.klinik_anket_puani ?? 0),
      tetkik_puani: Number(s.tetkik_puani ?? 0),
      hekim_degerlendirme: score,
    })
    await supabase.from('scores').update({
      hekim_degerlendirme: score,
      total_score: total,
      overall_score: Math.round(total),
    }).eq('id', s.id)
  }
}

async function finalOnay(apptId: string, analysisId: string, aralikSkor: number, hekimSkor: number, clinicNotes: string) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return

  // Final formül: (mevcut × 0.85) + (hekim × 0.15)
  const { data: s } = await supabase
    .from('scores')
    .select('id, c250_base, hasta_anket_puani, klinik_anket_puani, tetkik_puani, hekim_degerlendirme')
    .eq('appointment_id', apptId).eq('score_type', 'klinik_onayli').maybeSingle()

  const finalScore = s
    ? finalApprovedScore({
        c250_base: Number(s.c250_base ?? 0),
        hasta_anket_puani: Number(s.hasta_anket_puani ?? 0),
        klinik_anket_puani: Number(s.klinik_anket_puani ?? 0),
        tetkik_puani: Number(s.tetkik_puani ?? 0),
        hekim_degerlendirme: Number(s.hekim_degerlendirme ?? 0),
      }, hekimSkor)
    : Math.min(100, Math.round((aralikSkor * 0.85) + (hekimSkor * 0.15)))

  await Promise.all([
    supabase.from('analyses').update({
      final_overall: Math.round(finalScore),
      clinic_id: clinic.id,
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', analysisId),

    supabase.from('appointments').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      clinic_notes: clinicNotes || null,
      final_score_id: s?.id ?? null,
    }).eq('id', apptId).eq('clinic_id', clinic.id),
  ])

  if (s) {
    await supabase.from('scores').update({
      hekim_onay_puani: hekimSkor,
      total_score: finalScore,
      overall_score: Math.round(finalScore),
    }).eq('id', s.id)
  }

  redirect('/klinik/panel')
}

// Ownership check helper
async function getUserIdFromAnalysis(supabase: Awaited<ReturnType<typeof createClient>>, analysisId: string) {
  const { data } = await supabase.from('analyses').select('user_id').eq('id', analysisId).single()
  return data?.user_id ?? ''
}

// ── Sayfa ──────────────────────────────────────────────────────────
export default async function RandevuAkisPage({
  params,
}: {
  params: { appointmentId: string }
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics').select('id, name, jeton_balance').eq('user_id', user.id).single()
  if (!clinic) redirect('/klinik/panel')

  // Randevu — ownership kontrolü ile
  const { data: apptRaw } = await supabase
    .from('appointments')
    .select('id, user_id, appointment_date, status, notes, clinic_notes, profiles(full_name)')
    .eq('id', params.appointmentId)
    .eq('clinic_id', clinic.id)
    .single()

  if (!apptRaw) redirect('/klinik/panel')

  const appointment = apptRaw as typeof apptRaw & {
    profiles: { full_name: string | null } | null
  }

  // En son analiz (appointment_id ile bağlı varsa önce, yoksa user'ın son analizi)
  const { data: analysisByAppt } = await supabase
    .from('analyses')
    .select('id, web_overall, temp_overall, final_overall, device_overall, device_raw_data, doctor_notes, doctor_approved_scores, status')
    .eq('appointment_id', params.appointmentId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: analysisByUser } = !analysisByAppt
    ? await supabase
        .from('analyses')
        .select('id, web_overall, temp_overall, final_overall, device_overall, device_raw_data, doctor_notes, doctor_approved_scores, status')
        .eq('user_id', appointment.user_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const analysis = analysisByAppt ?? analysisByUser ?? null

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/klinik/panel/hasta/${appointment.user_id}`}
              className="text-slate-400 hover:text-white transition-colors text-sm">
              ← Hasta Detay
            </Link>
            <span className="text-slate-700">|</span>
            <span className="text-white font-bold text-sm">
              {(appointment as { profiles?: { full_name?: string | null } | null }).profiles?.full_name ?? 'Hasta'} — Klinik Akışı
            </span>
          </div>
          <Link href="/klinik/panel" className="text-slate-400 hover:text-white text-sm transition-colors">
            Panele Dön
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-white">Klinik İş Akışı</h1>
          <p className="text-slate-400 mt-0.5 text-sm">
            {clinic.name} · {(appointment as { profiles?: { full_name?: string | null } | null }).profiles?.full_name ?? 'Hasta'}
          </p>
        </div>

        {!analysis && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400 text-sm">
            ⚠ Bu hastanın henüz ön analizi yok. Hasta önce analiz yapmalı.
          </div>
        )}

        <KlinikAkisWizard
          appointment={appointment as Parameters<typeof KlinikAkisWizard>[0]['appointment']}
          analysis={analysis as Parameters<typeof KlinikAkisWizard>[0]['analysis']}
          jetonBalance={(clinic as { jeton_balance?: number }).jeton_balance ?? 0}
          onKabul={kabulEt}
          onSaveAnket={saveAnket}
          onSaveTetkik={saveTetkik}
          onSaveHekim={saveHekim}
          onFinalOnay={finalOnay}
        />
      </div>
    </main>
  )
}
