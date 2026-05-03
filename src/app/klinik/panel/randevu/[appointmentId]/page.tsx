export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KlinikAkisWizard from '@/components/KlinikAkisWizard'
import { sumComponents, finalApprovedScore } from '@/lib/egs'
import { klinikAnketPuani } from '@/lib/anket-sorular'
import { scoreTetkikValues } from '@/lib/tetkik-params'
import { enqueueNotification } from '@/lib/notifications'

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

  // Atomik kredi düşme + transaction log (SECURITY DEFINER RPC)
  // RPC adı 'consume_jeton' geriye uyumluluk için; davranış: önce ücretsiz hak, sonra ücretli bakiye
  const { data: result, error: creditErr } = await supabase.rpc('consume_jeton', {
    p_clinic_id: clinic.id,
    p_appointment_id: apptId,
    p_description: 'Hasta kabulü',
  }).single()
  if (creditErr) return { ok: false, error: 'Kredi işlemi başarısız' }
  const r = result as { ok: boolean; new_balance: number; err: string | null } | null
  if (!r?.ok) return { ok: false, error: r?.err ?? 'Yetersiz kredi. Lütfen kredi yükleyin.' }

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
    device_type: 'klinik_anketi_10',
    device_raw_data: answers,
    device_scores: answers,
    device_overall: total,
  }).eq('id', analysisId).eq('user_id', userId)

  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  const { data: a } = await supabase.from('analyses').select('web_overall, temp_overall').eq('id', analysisId).single()
  if (!clinic) return

  // Klinik anketi 10 soru ağırlıklı katkı (max 7.2 — hasta 3.6 + ek 3.6)
  const klinikToplam = klinikAnketPuani(answers)
  // Hasta anketi puanını al (çift sayım önleme — hasta anketinin 5 sorusu klinik anketinde replace edilir)
  const { data: onAnaliz } = await supabase
    .from('scores').select('hasta_anket_puani')
    .eq('user_id', userId).eq('analysis_id', analysisId).eq('score_type', 'on_analiz').maybeSingle()
  const hastaPuan = Number(onAnaliz?.hasta_anket_puani ?? 0)
  // Replace mantığı: klinik toplam puanından hasta puanı çıkarılır → net klinik katkısı
  const deltaKlinik = klinikToplam - hastaPuan

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

/**
 * İleri analiz: c250_base'i replace eder.
 * Şimdilik manuel bir skor değeri alınır (fotoğraf/cihaz entegrasyonu sonraki sprintte).
 */
async function saveIleriAnaliz(apptId: string, analysisId: string, yeniC250: number) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return

  // Mevcut skor satırını al
  const { data: s } = await supabase
    .from('scores')
    .select('id, hasta_anket_puani, klinik_anket_puani, tetkik_puani, hekim_degerlendirme')
    .eq('appointment_id', apptId).eq('score_type', 'klinik_onayli').maybeSingle()

  if (!s) return

  // c250_base'i replace et (ön analiz → ileri analiz)
  const total = sumComponents({
    c250_base: yeniC250,
    hasta_anket_puani: Number(s.hasta_anket_puani ?? 0),
    klinik_anket_puani: Number(s.klinik_anket_puani ?? 0),
    tetkik_puani: Number(s.tetkik_puani ?? 0),
    hekim_degerlendirme: Number(s.hekim_degerlendirme ?? 0),
  })

  await supabase.from('scores').update({
    c250_base: yeniC250,
    total_score: total,
    overall_score: Math.round(total),
  }).eq('id', s.id)

  // Analyses'a ileri analiz notu
  const { data: existing } = await supabase.from('analyses').select('doctor_approved_scores').eq('id', analysisId).single()
  const merged = { ...(existing?.doctor_approved_scores ?? {}), ileri_analiz_c250: yeniC250 }
  await supabase.from('analyses').update({ doctor_approved_scores: merged }).eq('id', analysisId)
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
    const tetkikPuan = scoreTetkikValues(data)
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

  // Skor güncelleme bildirimi kuyruğa ekle (e-posta + SMS — telefon doğrulanmışsa)
  try {
    const { data: appt } = await supabase
      .from('appointments')
      .select('user_id, profiles(full_name, phone_verified)')
      .eq('id', apptId)
      .single()
    if (appt) {
      const profileObj = appt.profiles as { full_name?: string | null; phone_verified?: boolean } | null
      const patientName = profileObj?.full_name ?? 'Hasta'
      const phoneVerified = !!profileObj?.phone_verified
      const payload = {
        patient_name: patientName,
        score: Math.round(finalScore),
        score_type: 'klinik_onayli' as const,
      }
      await enqueueNotification({ userId: appt.user_id, type: 'score_update', channel: 'email', payload })
      if (phoneVerified) {
        await enqueueNotification({ userId: appt.user_id, type: 'score_update', channel: 'sms', payload })
      }
    }
  } catch (e) {
    console.error('Score notification error:', e)
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
    .from('clinics').select('id, name, jeton_balance, free_appointments_remaining').eq('user_id', user.id).single()
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

  // Hasta anketi cevaplarını çek (varsa klinik anketinde önceden doldurulacak)
  let hastaAnketCevaplari: Record<string, number> | null = null
  if (analysis) {
    const { data: survey } = await supabase
      .from('longevity_surveys')
      .select('answers')
      .eq('user_id', appointment.user_id)
      .eq('is_completed', true)
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (survey?.answers && typeof survey.answers === 'object') {
      hastaAnketCevaplari = survey.answers as Record<string, number>
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-4 flex items-center gap-3">
        <Link href={`/klinik/panel/hasta/${appointment.user_id}`}
          className="text-slate-400 hover:text-white transition-colors text-sm">
          ← Hasta Detay
        </Link>
      </div>
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
          freeBalance={(clinic as { free_appointments_remaining?: number }).free_appointments_remaining ?? 0}
          hastaAnketCevaplari={hastaAnketCevaplari}
          onKabul={kabulEt}
          onSaveAnket={saveAnket}
          onSaveTetkik={saveTetkik}
          onSaveIleriAnaliz={saveIleriAnaliz}
          onSaveHekim={saveHekim}
          onFinalOnay={finalOnay}
        />
    </div>
  )
}
