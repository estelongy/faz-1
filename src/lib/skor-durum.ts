/**
 * Skor durumu & aşama yardımcıları.
 *
 * 3 durum:
 *  - 'tahmini'      → yalnızca ön analiz (AI) yapıldı
 *  - 'guncelleniyor' → randevu sonrası en az bir adım tamamlandı, hekim onayı bekleniyor
 *  - 'klinik_onayli' → hekim onayladı, skor sabitlendi
 */

import type { EGSPhase } from '@/components/EGSScoreBar'

export type SkorDurum = 'tahmini' | 'guncelleniyor' | 'klinik_onayli'

export interface AnalysisLite {
  web_overall: number | null
  temp_overall: number | null
  final_overall: number | null
}

export interface ScoreRowLite {
  c250_base: number | null
  hasta_anket_puani: number | null
  klinik_anket_puani: number | null
  tetkik_puani: number | null
  hekim_degerlendirme: number | null
  hekim_onay_puani: number | null
}

export interface AppointmentLite {
  status: string
}

/** Skor durumu — hasta panelinde etiket olarak gösterilir. */
export function getSkorDurumu(
  analysis: AnalysisLite | null,
  scoreRow: ScoreRowLite | null,
  activeAppt: AppointmentLite | null
): SkorDurum {
  if (!analysis) return 'tahmini'

  // Hekim onayı verildi → final_overall dolu veya score_row hekim_onay_puani dolu
  if (analysis.final_overall != null) return 'klinik_onayli'
  if (scoreRow?.hekim_onay_puani != null) return 'klinik_onayli'

  // Randevu süreci başladı mı?
  const inProcess =
    activeAppt?.status === 'confirmed' ||
    activeAppt?.status === 'in_progress' ||
    (scoreRow?.hasta_anket_puani ?? 0) > 0 ||
    (scoreRow?.klinik_anket_puani ?? 0) !== 0 ||
    (scoreRow?.tetkik_puani ?? 0) > 0 ||
    (scoreRow?.hekim_degerlendirme ?? 0) !== 0

  if (inProcess) return 'guncelleniyor'

  // Sadece longevity anketi doldurmuşsa (randevu süreci değil)
  if (analysis.temp_overall != null && analysis.temp_overall !== analysis.web_overall) {
    return 'guncelleniyor'
  }

  return 'tahmini'
}

export function getSkorDurumuLabel(durum: SkorDurum): string {
  switch (durum) {
    case 'tahmini':       return 'Tahmini Skor'
    case 'guncelleniyor': return 'Güncelleniyor'
    case 'klinik_onayli': return 'Klinik Onaylı'
  }
}

export function getSkorDurumuColor(durum: SkorDurum): { fg: string; bg: string; border: string } {
  switch (durum) {
    case 'tahmini':
      return { fg: '#fbbf24', bg: '#fbbf2410', border: '#fbbf2440' } // amber
    case 'guncelleniyor':
      return { fg: '#a78bfa', bg: '#a78bfa10', border: '#a78bfa40' } // violet
    case 'klinik_onayli':
      return { fg: '#34d399', bg: '#34d39910', border: '#34d39940' } // emerald
  }
}

/**
 * Aktif EGSPhase — skor zincirinde nerede olduğunu belirler.
 * Hasta panelindeki aşama yolculuğunda kullanılır.
 */
export function getEGSPhase(
  analysis: AnalysisLite | null,
  scoreRow: ScoreRowLite | null,
  activeAppt: AppointmentLite | null
): EGSPhase {
  if (!analysis) return 'ai_analiz'
  if (analysis.final_overall != null) return 'klinik_onayli'
  if (scoreRow?.hekim_onay_puani != null) return 'klinik_onayli'

  // Geriden ileriye kontrol
  if ((scoreRow?.hekim_degerlendirme ?? 0) !== 0) return 'hekim_degerlendirme'
  if ((scoreRow?.tetkik_puani ?? 0) > 0) return 'tetkik'
  // ileri analiz: analysis'in doctor_approved_scores içinde ileri_analiz_c250 var mı?
  if ((scoreRow?.klinik_anket_puani ?? 0) !== 0) return 'klinik_anketi'
  if (activeAppt?.status === 'in_progress') return 'klinik_kabul'
  if (activeAppt?.status === 'confirmed' || activeAppt?.status === 'pending') return 'randevu'
  if ((scoreRow?.hasta_anket_puani ?? 0) > 0) return 'longevity_anketi'
  if (analysis.temp_overall != null && analysis.temp_overall !== analysis.web_overall) return 'longevity_anketi'
  return 'ai_analiz'
}
