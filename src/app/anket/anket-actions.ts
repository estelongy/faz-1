'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { sumComponents, longevityToPoints } from '@/lib/egs'

interface SaveInput {
  analysisId: string
  answers: Record<string, number>
  anketToplam: number
}

/**
 * Hasta longevity anketini kaydet ve scores tablosuna 'on_analiz' satırı yaz.
 * - C250 base = analyses.web_overall ?? temp_overall
 * - hasta_anket_puani = ortalama × kuralı (longevityToPoints)
 * - total = sumComponents
 */
export async function saveLongevityAnket(input: SaveInput): Promise<{ ok: boolean; total?: number; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  // Analysis sahipliği kontrol
  const { data: a } = await supabase
    .from('analyses')
    .select('id, user_id, web_overall, temp_overall')
    .eq('id', input.analysisId)
    .single()
  if (!a || a.user_id !== user.id) return { ok: false, error: 'Analiz bulunamadı' }

  const c250Base = Number(a.web_overall ?? a.temp_overall ?? 50)
  const hastaPuan = longevityToPoints(input.answers)
  const total = sumComponents({ c250_base: c250Base, hasta_anket_puani: hastaPuan })

  // Analyses güncelle (eski mantık korunur)
  await supabase
    .from('analyses')
    .update({
      temp_longevity_score: input.anketToplam,
      temp_overall: total,
    })
    .eq('id', input.analysisId)
    .eq('user_id', user.id)

  // Longevity surveys kayıt
  await supabase.from('longevity_surveys').insert({
    user_id: user.id,
    answers: input.answers,
    calculated_score: input.anketToplam,
    is_completed: true,
    completed_at: new Date().toISOString(),
  })

  // En yeni 'on_analiz' satırını upsert et
  const { data: existing } = await supabase
    .from('scores')
    .select('id')
    .eq('user_id', user.id)
    .eq('analysis_id', input.analysisId)
    .eq('score_type', 'on_analiz')
    .maybeSingle()

  if (existing) {
    await supabase
      .from('scores')
      .update({
        c250_base: c250Base,
        hasta_anket_puani: hastaPuan,
        total_score: total,
        overall_score: Math.round(total),
      })
      .eq('id', existing.id)
  } else {
    await supabase.from('scores').insert({
      user_id: user.id,
      analysis_id: input.analysisId,
      score_type: 'on_analiz',
      c250_base: c250Base,
      hasta_anket_puani: hastaPuan,
      total_score: total,
      overall_score: Math.round(total),
    })
  }

  revalidatePath('/panel')
  return { ok: true, total }
}
