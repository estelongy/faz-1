// EGS Skor Zinciri yardımcıları
// Tek kaynak: Tüm skor hesaplamaları burada toplanır.

export type ScoreType = 'on_analiz' | 'klinik_onayli'

export type ColorZone = 'red' | 'brown' | 'green' | 'blue'

export interface ScoreComponents {
  c250_base?: number
  hasta_anket_puani?: number
  klinik_anket_puani?: number
  tetkik_puani?: number
  ileri_ai_puani?: number
  hekim_degerlendirme?: number
  hekim_onay_puani?: number
}

/** Renk bölgesi kuralı (CLAUDE.md) */
export function colorZone(score: number | null | undefined): ColorZone | null {
  if (score == null) return null
  if (score < 50) return 'red'
  if (score < 75) return 'brown'
  if (score < 90) return 'green'
  return 'blue'
}

export function zoneLabel(zone: ColorZone | null): string {
  switch (zone) {
    case 'red':   return 'Kritik'
    case 'brown': return 'Normal'
    case 'green': return 'Genç'
    case 'blue':  return 'Premium'
    default:      return '—'
  }
}

export function zoneMeaning(zone: ColorZone | null): string {
  switch (zone) {
    case 'red':   return 'Yaşından yaşlı görünüyor'
    case 'brown': return 'Yaşında görünüyor'
    case 'green': return 'Yaşından genç görünüyor'
    case 'blue':  return 'Mükemmel gençlik skoru'
    default:      return ''
  }
}

/** Bileşenler toplamı (ön analiz + klinik adımları, hekim onayı hariç) */
export function sumComponents(c: ScoreComponents): number {
  const s =
    (c.c250_base ?? 0) +
    (c.hasta_anket_puani ?? 0) +
    (c.klinik_anket_puani ?? 0) +
    (c.tetkik_puani ?? 0) +
    (c.ileri_ai_puani ?? 0) +
    (c.hekim_degerlendirme ?? 0)
  return clamp(s)
}

/**
 * Klinik onaylı final formül:
 *   final = (mevcut * 0.85) + (hekim_onay * 0.15)
 * mevcut = sumComponents(c)
 */
export function finalApprovedScore(c: ScoreComponents, hekimOnayPuani: number): number {
  const mevcut = sumComponents(c)
  return clamp(mevcut * 0.85 + hekimOnayPuani * 0.15)
}

export function clamp(n: number, lo = 0, hi = 100): number {
  if (Number.isNaN(n)) return lo
  return Math.max(lo, Math.min(hi, Math.round(n * 10) / 10))
}

/** Longevity anketi puanı: skoru +0..+10 puana kadar artırır */
export function longevityToPoints(answers: Record<string, number>): number {
  // Cevapların ortalaması 0-10 arası → direkt puan
  const vals = Object.values(answers).filter(v => typeof v === 'number')
  if (vals.length === 0) return 0
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length
  // 0-10 ortalamayı 0-10 puana mapper: zaten 0-10
  return clamp(avg, 0, 10)
}

/** Klinik yüz yüze anketi: hasta anketi puanı düşülür, klinik puan eklenir (çift sayım önleme) */
export function clinicSurveyDelta(klinikPuan: number, hastaPuan: number): number {
  return clamp(klinikPuan - hastaPuan, -10, 10)
}

/** Tetkik giriş ortalaması → 0..+2 */
export function tetkikToPoints(values: Record<string, number>): number {
  const vals = Object.values(values).filter(v => typeof v === 'number')
  if (vals.length === 0) return 0
  const avg = vals.reduce((s, v) => s + v, 0) / vals.length
  // 0-100 ölçek → 0..2
  return clamp(avg / 50, 0, 2)
}
