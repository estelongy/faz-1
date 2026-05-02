'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import PaylasModal from './PaylasModal'
import {
  HASTA_ANKET_SORULARI,
  KLINIK_EK_SORULARI,
  KLINIK_ANKET_SORULARI,
  klinikAnketPuani,
  hastaAnketPuani,
} from '@/lib/anket-sorular'
import { TETKIK_PARAMS, scoreTetkikValues } from '@/lib/tetkik-params'

// ── Akış adımları (6 adım) ────────────────────────────────────────
const STEPS = [
  { n: 1, label: 'Kabul'         },
  { n: 2, label: 'Klinik Anketi' },
  { n: 3, label: 'Tetkik'        },
  { n: 4, label: 'İleri Analiz'  },
  { n: 5, label: 'Hekim'         },
  { n: 6, label: 'Onay'          },
]

// ── Renk yardımcıları ─────────────────────────────────────────────
function scoreColor(s: number) {
  if (s >= 90) return '#00d4ff'
  if (s >= 75) return '#22c55e'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}

// ── Props ─────────────────────────────────────────────────────────
interface AppointmentData {
  id: string
  user_id: string
  appointment_date: string | null
  status: string
  notes: string | null
  clinic_notes: string | null
  profiles: { full_name: string | null } | null
}

interface AnalysisData {
  id: string
  web_overall: number | null
  temp_overall: number | null
  final_overall: number | null
  device_overall: number | null
  device_raw_data: Record<string, number> | null
  doctor_notes: string | null
  doctor_approved_scores: Record<string, unknown> | null
  status: string | null
}

interface Props {
  appointment: AppointmentData
  analysis: AnalysisData | null
  jetonBalance: number
  /** Estelongy hediyesi olarak verilen ücretsiz hasta hakkı */
  freeBalance?: number
  /** Hasta anketi cevapları (varsa klinik anketinde önceden doldurulur) */
  hastaAnketCevaplari: Record<string, number> | null
  onKabul:            (apptId: string) => Promise<{ ok: boolean; error?: string }>
  onSaveAnket:        (apptId: string, analysisId: string, answers: Record<string, number>, total: number) => Promise<void>
  onSaveTetkik:       (apptId: string, analysisId: string, data: Record<string, number>) => Promise<void>
  onSaveIleriAnaliz:  (apptId: string, analysisId: string, yeniC250: number) => Promise<void>
  onSaveHekim:        (apptId: string, analysisId: string, score: number, notes: string) => Promise<void>
  onFinalOnay:        (apptId: string, analysisId: string, mevcutSkor: number, hekimSkor: number, clinicNotes: string) => Promise<void>
}

// ── Bileşen ───────────────────────────────────────────────────────
export default function KlinikAkisWizard({
  appointment, analysis, jetonBalance, freeBalance = 0, hastaAnketCevaplari,
  onKabul, onSaveAnket, onSaveTetkik, onSaveIleriAnaliz, onSaveHekim, onFinalOnay,
}: Props) {
  const totalCredit = jetonBalance + freeBalance
  const willUsePaid = freeBalance === 0 && jetonBalance > 0
  const [isPending, startTransition] = useTransition()
  const [kabulError, setKabulError]   = useState<string | null>(null)

  // Başlangıç adımı — kaldığı yerden devam
  function getInitialStep() {
    if (appointment.status === 'completed') return 6
    if (appointment.status === 'in_progress') {
      const scores = analysis?.doctor_approved_scores as Record<string, unknown> | null
      if (scores?.hekim_skoru != null) return 6
      if (analysis?.doctor_notes) return 6
      if (scores?.ileri_analiz_c250 != null) return 5
      if (scores?.tetkik != null) return 4
      if (analysis?.device_overall != null) return 3
      return 2
    }
    return 1
  }

  const [step, setStep] = useState(getInitialStep)

  // Klinik anketi state — hasta anketi cevapları varsa önceden doldur
  const [anket, setAnket] = useState<Record<string, number>>(() => {
    // Analysis'te kayıtlı cevap varsa onu al, yoksa hasta anketinden, yoksa varsayılan (50, 0-100 ölçek)
    if (analysis?.device_raw_data && Object.keys(analysis.device_raw_data).length > 0) {
      const defaults: Record<string, number> = {}
      for (const q of KLINIK_ANKET_SORULARI) {
        defaults[q.key] = analysis.device_raw_data[q.key] ?? 50
      }
      return defaults
    }
    const defaults: Record<string, number> = {}
    for (const q of KLINIK_ANKET_SORULARI) {
      defaults[q.key] = hastaAnketCevaplari?.[q.key] ?? 50
    }
    return defaults
  })

  // Tetkik state
  const [tetkik, setTetkik] = useState<Record<string, string>>({})

  // İleri analiz state — manuel skor girişi
  const [ileriSkor, setIleriSkor] = useState<string>('')

  // Hekim state
  const [hekimScore, setHekimScore] = useState<number>(() => {
    const prev = analysis?.doctor_approved_scores as Record<string, unknown> | null
    return typeof prev?.hekim_skoru === 'number' ? prev.hekim_skoru : (analysis?.web_overall ?? 70)
  })
  const [hekimNotes, setHekimNotes]   = useState(analysis?.doctor_notes ?? '')
  const [clinicNotes, setClinicNotes] = useState(appointment.clinic_notes ?? '')

  // ── Skor hesaplamaları ────────────────────────────────────────────
  const mevcutC250 = analysis?.temp_overall ?? analysis?.web_overall ?? 50

  // Klinik anketi ağırlıklı puan (10 soru, max 7.2)
  const klinikAnketToplamPuan = klinikAnketPuani(anket)
  const klinikAnketToplam = Object.values(anket).reduce((a, b) => a + b, 0) // 0..1000 UI için

  // Hasta anketi puanı (varsa)
  const hastaMevcutPuan = hastaAnketCevaplari ? hastaAnketPuani(hastaAnketCevaplari) : 0

  // Klinik net katkı: klinikToplam - hastaPuan (replace mantığı)
  const klinikNetKatki = klinikAnketToplamPuan - hastaMevcutPuan

  // Tetkik puanı
  const numericTetkik = Object.fromEntries(
    Object.entries(tetkik).filter(([, v]) => v !== '').map(([k, v]) => [k, Number(v)])
  )
  const tetkikPuan = scoreTetkikValues(numericTetkik)

  // İleri analiz: girilmişse c250_base'i replace et
  const ileriC250Num = ileriSkor !== '' ? Number(ileriSkor) : null
  const aktifC250 = ileriC250Num != null && !Number.isNaN(ileriC250Num) ? ileriC250Num : mevcutC250

  // Ara toplam: ea + hasta + klinik_net + tetkik
  const araToplam = Math.min(100, Math.max(0,
    aktifC250 + hastaMevcutPuan + klinikNetKatki + tetkikPuan
  ))

  // Final formül: (ara × 0.85) + (hekim × 0.15)
  const finalSkor = Math.min(100, Math.round((araToplam * 0.85) + (hekimScore * 0.15)))

  // ── Step 1: Kabul ─────────────────────────────────────────────
  function renderKabul() {
    const alreadyIn = appointment.status === 'in_progress' || appointment.status === 'completed'
    return (
      <div className="space-y-6">
        <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700">
          <h3 className="text-white font-bold text-lg mb-3">Hasta Bilgileri</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-slate-500">Ad Soyad</span>
              <p className="text-white font-medium mt-0.5">{appointment.profiles?.full_name ?? '—'}</p>
            </div>
            <div>
              <span className="text-slate-500">Randevu</span>
              <p className="text-white font-medium mt-0.5">
                {appointment.appointment_date
                  ? new Date(appointment.appointment_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
                  : '—'}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Hasta Notu</span>
              <p className="text-white mt-0.5">{appointment.notes || 'Not yok'}</p>
            </div>
            <div>
              <span className="text-slate-500">Ön Analiz</span>
              <p className="font-bold text-xl mt-0.5" style={{ color: scoreColor(mevcutC250) }}>
                {mevcutC250} / 100
              </p>
            </div>
          </div>
        </div>

        {/* Hasta anketi durumu */}
        <div className={`p-4 rounded-xl border text-sm ${
          hastaAnketCevaplari
            ? 'border-emerald-500/30 bg-emerald-500/10'
            : 'border-slate-700 bg-slate-800/40'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={hastaAnketCevaplari ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                {hastaAnketCevaplari ? '✓ Hasta anketi doldurdu' : '○ Hasta anketi doldurmadı'}
              </p>
              <p className="text-slate-500 text-xs mt-0.5">
                {hastaAnketCevaplari
                  ? `Cevaplar klinik anketinde otomatik gelecek (+${hastaMevcutPuan.toFixed(1)} puan)`
                  : 'Klinik anketi direkt eklenecek'}
              </p>
            </div>
            {hastaAnketCevaplari && (
              <span className="text-2xl font-black text-emerald-400">+{hastaMevcutPuan.toFixed(1)}</span>
            )}
          </div>
        </div>

        {/* Kredi bakiyesi (ücretsiz + ücretli) */}
        {!alreadyIn && (
          <div className={`p-4 rounded-xl border text-sm ${
            totalCredit === 0 ? 'border-red-500/30 bg-red-500/10' :
            totalCredit <= 10 ? 'border-amber-500/30 bg-amber-500/10' :
            'border-slate-700 bg-slate-800/40'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={
                totalCredit === 0 ? 'text-red-400' :
                totalCredit <= 10 ? 'text-amber-300' : 'text-slate-400'
              }>Kredi Durumu</span>
              <span className={`text-2xl font-black ${
                totalCredit === 0 ? 'text-red-400' :
                totalCredit <= 10 ? 'text-amber-400' : 'text-white'
              }`}>{totalCredit}</span>
            </div>
            <div className="flex gap-4 text-xs text-slate-500">
              <span>🎁 Ücretsiz: <strong className="text-emerald-400">{freeBalance}</strong></span>
              <span>💳 Ücretli: <strong className="text-violet-400">{jetonBalance}</strong></span>
            </div>
            {totalCredit === 0 && (
              <p className="text-red-400 text-xs mt-2">Krediniz tükendi. Hasta kabulü için kredi yükleyin.</p>
            )}
            {totalCredit > 0 && totalCredit <= 10 && (
              <p className="text-amber-300 text-xs mt-2">⚠ Son {totalCredit} kredi. Bittiğinde randevu kabulü kapanır.</p>
            )}
            {willUsePaid && totalCredit > 10 && (
              <p className="text-violet-300 text-xs mt-2">ℹ Ücretsiz haklarınız bitti. Bu kabul ücretli bakiyenizden düşecek.</p>
            )}
          </div>
        )}

        {kabulError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ✕ {kabulError}
          </div>
        )}

        {!alreadyIn ? (
          <button
            disabled={isPending || totalCredit < 1}
            onClick={() => startTransition(async () => {
              setKabulError(null)
              if (willUsePaid && !confirm('Ücretsiz haklarınız bitti. Bu kabul ücretli kredinizden düşülecek. Onaylıyor musunuz?')) return
              const result = await onKabul(appointment.id)
              if (result.ok) {
                setStep(2)
              } else {
                setKabulError(result.error ?? 'Bir hata oluştu')
              }
            })}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'İşleniyor...' :
             totalCredit < 1 ? '✕ Yetersiz Kredi' :
             freeBalance > 0 ? '✓ Hastayı Kabul Et — 1 Ücretsiz Hak Düşecek' :
             '✓ Hastayı Kabul Et — 1 Kredi Düşecek'}
          </button>
        ) : (
          <button onClick={() => setStep(2)}
            className="w-full py-3.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">
            Kaldığı Yerden Devam →
          </button>
        )}
      </div>
    )
  }

  // ── Step 2: Klinik Anketi (10 soru: 5 hasta + 5 ek) ────────────
  function renderAnket() {
    const renderSoruGrup = (sorular: typeof KLINIK_ANKET_SORULARI, baslik: string, desc: string) => (
      <div>
        <div className="mb-3">
          <h3 className="text-white font-bold">{baslik}</h3>
          <p className="text-slate-500 text-xs mt-0.5">{desc}</p>
        </div>
        <div className="space-y-3">
          {sorular.map(q => {
            const hastaCevap = hastaAnketCevaplari?.[q.key]
            return (
              <div key={q.key} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{q.emoji}</span>
                    <span className="text-white font-medium text-sm">{q.label}</span>
                  </div>
                  <span className="text-2xl font-black" style={{ color: scoreColor(anket[q.key]) }}>
                    {anket[q.key]}
                  </span>
                </div>
                {hastaCevap != null && (
                  <p className="text-amber-400 text-xs mb-2">
                    ℹ Hasta şöyle cevapladı: <strong>{hastaCevap}</strong>
                  </p>
                )}
                <input
                  type="range" min={q.min ?? 0} max={q.max ?? 100} value={anket[q.key]}
                  onChange={e => setAnket(prev => ({ ...prev, [q.key]: Number(e.target.value) }))}
                  className="w-full accent-violet-500 cursor-pointer" />
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{q.low}</span>
                  <span>{q.high}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )

    return (
      <div className="space-y-6">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
          ℹ <strong>10 soru</strong> — ilk 5 soru hasta anketiyle aynı (çift sayım önleme için replace), son 5 soru kliniğe özel.
        </div>

        {renderSoruGrup(
          HASTA_ANKET_SORULARI,
          'Bölüm 1 — Hasta Anketi Doğrulaması',
          hastaAnketCevaplari ? 'Hastanın cevapları önceden yüklendi. Gerekirse düzeltin.' : 'Hasta anketi doldurmadı, sıfırdan değerlendirin.'
        )}

        {renderSoruGrup(
          KLINIK_EK_SORULARI,
          'Bölüm 2 — Klinik Ek Soruları',
          'Yüz yüze değerlendirme gerektiren ek sorular.'
        )}

        {/* Toplam özet */}
        <div className="p-4 bg-slate-900 rounded-xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 text-sm">Klinik Anket Toplamı</span>
            <span className="text-xl font-black" style={{ color: scoreColor(klinikAnketToplam / 2) }}>
              {klinikAnketToplam}<span className="text-slate-500 text-sm font-normal"> / 1000</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500">Puan Katkısı (max +7.2)</span>
            <span className="font-bold text-emerald-400">+{klinikAnketToplamPuan.toFixed(1)}</span>
          </div>
          {hastaAnketCevaplari && (
            <>
              <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-2">
                <span className="text-slate-500">Hasta Anketi (replace edilecek)</span>
                <span className="text-red-400">−{hastaMevcutPuan.toFixed(1)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Net Klinik Katkısı</span>
                <span className={`font-bold ${klinikNetKatki >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {klinikNetKatki >= 0 ? '+' : ''}{klinikNetKatki.toFixed(1)}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            ← Geri
          </button>
          <button
            disabled={isPending || !analysis}
            onClick={() => startTransition(async () => {
              if (!analysis) return
              await onSaveAnket(appointment.id, analysis.id, anket, klinikAnketToplam)
              setStep(3)
            })}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? 'Kaydediliyor...' : 'Kaydet ve Devam →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Tetkik (8 parametre) ───────────────────────────────
  function renderTetkik() {
    return (
      <div className="space-y-5">
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300">
          ℹ Opsiyonel — tetkik sonuçlarını girin. Normal aralıktaki her değer puan kazandırır. Boş alanlar hesaba katılmaz.
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TETKIK_PARAMS.map(p => {
            const raw = tetkik[p.key]
            const num = raw ? Number(raw) : null
            const inRange = num != null && !Number.isNaN(num) && num >= p.min && num <= p.max
            const filled = raw && raw !== ''
            return (
              <div key={p.key} className={`p-4 rounded-xl border transition-colors ${
                filled
                  ? inRange
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-red-500/5 border-red-500/30'
                  : 'bg-slate-800/60 border-slate-700'
              }`}>
                <label className="text-white font-medium text-sm block mb-1">
                  {p.label}
                  <span className="ml-2 text-slate-500 font-normal text-xs">{p.unit}</span>
                </label>
                <input
                  type="number" step="any" placeholder="—" value={raw ?? ''}
                  onChange={e => setTetkik(prev => ({ ...prev, [p.key]: e.target.value }))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-slate-500 text-[10px]">Normal: {p.min}–{p.max}</p>
                  {filled && (
                    <span className={`text-[10px] font-bold ${inRange ? 'text-emerald-400' : 'text-red-400'}`}>
                      {inRange ? `+${p.puan}` : '0'}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
          <span className="text-slate-400 text-sm">Tetkik Puanı</span>
          <span className="text-xl font-black text-emerald-400">+{tetkikPuan.toFixed(1)}</span>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(2)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            ← Geri
          </button>
          <button
            disabled={isPending || !analysis}
            onClick={() => startTransition(async () => {
              if (!analysis) return
              if (Object.keys(numericTetkik).length > 0) {
                await onSaveTetkik(appointment.id, analysis.id, numericTetkik)
              }
              setStep(4)
            })}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? 'Kaydediliyor...' : 'Devam →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 4: İleri Analiz ──────────────────────────────────────
  function renderIleriAnaliz() {
    return (
      <div className="space-y-5">
        <div className="p-4 bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30 rounded-xl">
          <h3 className="text-white font-bold flex items-center gap-2 mb-2">
            <span>⚡</span> İleri Analiz (Ücretli)
          </h3>
          <p className="text-slate-400 text-sm">
            Daha yüksek hassasiyetli fotoğraf analizi veya cihaz entegrasyonu ile Skor yeniden hesaplanır.
            Ön analizdeki skoru <strong>replace eder</strong>.
          </p>
          <p className="text-slate-500 text-xs mt-2">
            <strong>Not:</strong> Fotoğraf/cihaz entegrasyonu sonraki sprintte. Şimdilik manuel skor girişi.
          </p>
        </div>

        <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700">
          <label className="text-white font-medium text-sm block mb-2">
            İleri Analiz Skoru (0-100)
          </label>
          <input
            type="number" min={0} max={100} step="0.1"
            placeholder={`Mevcut ön analiz: ${mevcutC250}`}
            value={ileriSkor}
            onChange={e => setIleriSkor(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white text-lg font-bold focus:outline-none focus:border-violet-500" />
          <p className="text-slate-500 text-xs mt-2">
            Girilmezse ön analiz ({mevcutC250}) kullanılır.
          </p>

          {ileriC250Num != null && !Number.isNaN(ileriC250Num) && (
            <div className="mt-3 pt-3 border-t border-slate-700 flex items-center justify-between text-sm">
              <span className="text-slate-400">Ön Analiz → İleri Analiz</span>
              <span className="flex items-center gap-2">
                <span className="text-slate-500 line-through">{mevcutC250}</span>
                <span className="text-slate-600">→</span>
                <span className="font-bold" style={{ color: scoreColor(ileriC250Num) }}>{ileriC250Num}</span>
              </span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(3)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            ← Geri
          </button>
          <button
            disabled={isPending || !analysis}
            onClick={() => startTransition(async () => {
              if (!analysis) return
              if (ileriC250Num != null && !Number.isNaN(ileriC250Num)) {
                await onSaveIleriAnaliz(appointment.id, analysis.id, ileriC250Num)
              }
              setStep(5)
            })}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending
              ? 'Kaydediliyor...'
              : ileriC250Num != null && !Number.isNaN(ileriC250Num)
                ? 'Uygula ve Devam →'
                : 'Atla ve Devam →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 5: Hekim Değerlendirmesi ──────────────────────────────
  function renderHekim() {
    return (
      <div className="space-y-5">
        <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Algoritma Skoru (aktif)</span>
            <span className="font-bold" style={{ color: scoreColor(aktifC250) }}>{aktifC250}</span>
          </div>
          {hastaMevcutPuan > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Hasta Anketi</span>
              <span className="text-emerald-400">+{hastaMevcutPuan.toFixed(1)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Klinik Anketi (net)</span>
            <span className={klinikNetKatki >= 0 ? 'text-emerald-400' : 'text-red-400'}>
              {klinikNetKatki >= 0 ? '+' : ''}{klinikNetKatki.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Tetkik</span>
            <span className="text-emerald-400">+{tetkikPuan.toFixed(1)}</span>
          </div>
          <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-700">
            <span className="text-white font-bold">Ara Toplam</span>
            <span className="font-black text-xl" style={{ color: scoreColor(araToplam) }}>{araToplam.toFixed(1)}</span>
          </div>
        </div>

        <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-white font-bold">Hekim Skoru</span>
            <span className="text-3xl font-black" style={{ color: scoreColor(hekimScore) }}>
              {hekimScore}
            </span>
          </div>
          <input
            type="range" min={0} max={100} value={hekimScore}
            onChange={e => setHekimScore(Number(e.target.value))}
            className="w-full accent-violet-500 cursor-pointer mb-2" />
          <div className="flex justify-between text-xs text-slate-500">
            <span>0</span><span>Yaşından yaşlı</span><span>Yaşında</span><span>Genç</span><span>100</span>
          </div>
        </div>

        <div className="p-4 rounded-xl border text-center"
          style={{ borderColor: `${scoreColor(finalSkor)}30`, background: `${scoreColor(finalSkor)}0d` }}>
          <p className="text-slate-400 text-xs mb-1">Tahmini Final Gençlik Skoru</p>
          <p className="text-4xl font-black" style={{ color: scoreColor(finalSkor) }}>{finalSkor}</p>
          <p className="text-slate-500 text-xs mt-1">({araToplam.toFixed(1)} × 0.85) + ({hekimScore} × 0.15)</p>
        </div>

        <div>
          <label className="text-white font-medium text-sm block mb-2">Hekim Notu</label>
          <textarea
            rows={3} value={hekimNotes}
            onChange={e => setHekimNotes(e.target.value)}
            placeholder="Gözlemler, öneriler, tedavi planı..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(4)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            ← Geri
          </button>
          <button
            disabled={isPending || !analysis}
            onClick={() => startTransition(async () => {
              if (!analysis) return
              await onSaveHekim(appointment.id, analysis.id, hekimScore, hekimNotes)
              setStep(6)
            })}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? 'Kaydediliyor...' : 'Kaydet ve Önizle →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 6: Final Onay ─────────────────────────────────────────
  function renderOnay() {
    const publishedScore = analysis?.final_overall
    return (
      <div className="space-y-5">
        {publishedScore != null ? (
          <div className="text-center py-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <p className="text-emerald-400 text-sm font-bold mb-2">✦ KLİNİK ONAYLI ESTELONGY GENÇLİK SKORU YAYINLANDI ✦</p>
            <p className="text-7xl font-black text-emerald-400">{publishedScore}</p>
            <p className="text-slate-400 text-sm mt-2 mb-4">Hasta panelinde görünüyor</p>
            {analysis && (
              <div className="flex justify-center">
                <PaylasModal
                  analysisId={analysis.id}
                  score={publishedScore}
                  firstName={appointment.profiles?.full_name?.split(' ')[0] ?? 'Hasta'}
                />
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="text-center py-6 bg-slate-800/60 border border-slate-700 rounded-2xl">
              <p className="text-slate-400 text-sm mb-2">Yayınlanacak Gençlik Skoru</p>
              <p className="text-7xl font-black" style={{ color: scoreColor(finalSkor) }}>{finalSkor}</p>
              <p className="text-slate-500 text-xs mt-2">
                Alg: {aktifC250} · Anket: {(hastaMevcutPuan + klinikNetKatki).toFixed(1)} · Tetkik: +{tetkikPuan.toFixed(1)} · Hekim: {hekimScore}
              </p>
            </div>

            <div className="space-y-2 p-4 bg-slate-800/40 rounded-xl border border-slate-700 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Hasta</span><span className="text-white">{appointment.profiles?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Algoritma Skoru (aktif)</span><span style={{ color: scoreColor(aktifC250) }}>{aktifC250}</span></div>
              {hastaMevcutPuan > 0 && (
                <div className="flex justify-between"><span className="text-slate-400">Hasta Anketi</span><span className="text-emerald-400">+{hastaMevcutPuan.toFixed(1)}</span></div>
              )}
              <div className="flex justify-between"><span className="text-slate-400">Klinik Anketi (net)</span>
                <span className={klinikNetKatki >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                  {klinikNetKatki >= 0 ? '+' : ''}{klinikNetKatki.toFixed(1)}
                </span>
              </div>
              <div className="flex justify-between"><span className="text-slate-400">Tetkik</span><span className="text-emerald-400">+{tetkikPuan.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Ara Toplam</span><span className="text-white">{araToplam.toFixed(1)}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Hekim Değerlendirmesi</span><span style={{ color: scoreColor(hekimScore) }}>{hekimScore}</span></div>
              <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-white font-bold">Final Gençlik Skoru</span><span className="text-xl font-black" style={{ color: scoreColor(finalSkor) }}>{finalSkor}</span></div>
            </div>

            <div>
              <label className="text-white font-medium text-sm block mb-2">Klinik Notu (opsiyonel)</label>
              <textarea rows={2} value={clinicNotes} onChange={e => setClinicNotes(e.target.value)}
                placeholder="Vizit özeti..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(5)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
                ← Geri
              </button>
              <button
                disabled={isPending || !analysis}
                onClick={() => startTransition(async () => {
                  if (!analysis) return
                  await onFinalOnay(appointment.id, analysis.id, araToplam, hekimScore, clinicNotes)
                })}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-base">
                {isPending ? 'Yayınlanıyor...' : '✦ Klinik Onaylı Gençlik Skoru Yayınla'}
              </button>
            </div>
          </>
        )}

        {publishedScore != null && (
          <Link href="/klinik/panel"
            className="block text-center py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-colors">
            ← Panele Dön
          </Link>
        )}
      </div>
    )
  }

  // ── Ana render ────────────────────────────────────────────────
  const stepContent = [renderKabul, renderAnket, renderTetkik, renderIleriAnaliz, renderHekim, renderOnay]

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => {
          const done = step > s.n, curr = step === s.n
          return (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                  ${done ? 'bg-emerald-500 text-white' : curr ? 'bg-violet-600 text-white ring-2 ring-violet-400/50' : 'bg-slate-800 text-slate-500 border border-slate-700'}`}>
                  {done ? '✓' : s.n}
                </div>
                <span className={`text-[9px] font-medium text-center leading-tight ${done ? 'text-emerald-400' : curr ? 'text-violet-400' : 'text-slate-600'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-0.5 flex-1 mx-1 mb-4 ${done ? 'bg-emerald-500/50' : 'bg-slate-800'}`} />
              )}
            </div>
          )
        })}
      </div>

      {/* İçerik */}
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
        <h2 className="text-white font-black text-xl mb-5">
          {STEPS[step - 1]?.label ?? ''}
        </h2>
        {stepContent[step - 1]?.()}
      </div>
    </div>
  )
}
