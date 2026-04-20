'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import PaylasModal from './PaylasModal'

// ── Anket soruları (C250 formülüne göre güncellenecek) ────────────
const ANKET_SORULAR = [
  { key: 'q1', label: 'Uyku kalitesi',      desc: '0 = Çok kötü  ·  20 = Mükemmel'         },
  { key: 'q2', label: 'Beslenme düzeni',    desc: '0 = Çok kötü  ·  20 = Mükemmel'         },
  { key: 'q3', label: 'Stres yönetimi',     desc: '0 = Sürekli stresli  ·  20 = Stressiz'  },
  { key: 'q4', label: 'Fiziksel aktivite',  desc: '0 = Hareketsiz  ·  20 = Çok aktif'      },
  { key: 'q5', label: 'Cilt koruma rutini', desc: '0 = Hiç yok  ·  20 = Günlük ve düzenli' },
]

const TETKIK_FIELDS = [
  { key: 'vitaminD',  label: 'Vitamin D',          unit: 'ng/mL', optimal: '40–60'  },
  { key: 'b12',       label: 'B12',                unit: 'pg/mL', optimal: '200–900'},
  { key: 'ferritin',  label: 'Ferritin',           unit: 'ng/mL', optimal: '20–200' },
  { key: 'kolesterol',label: 'Kolesterol (total)',  unit: 'mg/dL', optimal: '<200'   },
]

const STEPS = [
  { n: 1, label: 'Kabul'  },
  { n: 2, label: 'Anket'  },
  { n: 3, label: 'Tetkik' },
  { n: 4, label: 'Hekim'  },
  { n: 5, label: 'Onay'   },
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
  onKabul:            (apptId: string) => Promise<{ ok: boolean; error?: string }>
  onSaveAnket:        (apptId: string, analysisId: string, answers: Record<string, number>, total: number) => Promise<void>
  onSaveTetkik:       (apptId: string, analysisId: string, data: Record<string, number>) => Promise<void>
  onSaveHekim:        (apptId: string, analysisId: string, score: number, notes: string) => Promise<void>
  onFinalOnay:        (apptId: string, analysisId: string, mevcutSkor: number, hekimSkor: number, clinicNotes: string) => Promise<void>
}

// ── Bileşen ───────────────────────────────────────────────────────
export default function KlinikAkisWizard({
  appointment, analysis, jetonBalance,
  onKabul, onSaveAnket, onSaveTetkik, onSaveHekim, onFinalOnay,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [kabulError, setKabulError]   = useState<string | null>(null)

  // Başlangıç adımı — kaldığı yerden devam
  function getInitialStep() {
    if (appointment.status === 'completed') return 5
    if (appointment.status === 'in_progress') {
      const scores = analysis?.doctor_approved_scores as Record<string, unknown> | null
      if (scores?.hekim_skoru != null) return 5
      if (analysis?.doctor_notes) return 5
      if (analysis?.device_overall != null) return 4
      return 2
    }
    return 1
  }

  const [step, setStep]               = useState(getInitialStep)
  const [anket, setAnket]             = useState<Record<string, number>>(
    analysis?.device_raw_data ?? Object.fromEntries(ANKET_SORULAR.map(q => [q.key, 10]))
  )
  const [tetkik, setTetkik]           = useState<Record<string, string>>({})
  const [hekimScore, setHekimScore]   = useState<number>(() => {
    const prev = analysis?.doctor_approved_scores as Record<string, unknown> | null
    return typeof prev?.hekim_skoru === 'number' ? prev.hekim_skoru : (analysis?.web_overall ?? 70)
  })
  const [hekimNotes, setHekimNotes]   = useState(analysis?.doctor_notes ?? '')
  const [clinicNotes, setClinicNotes] = useState(appointment.clinic_notes ?? '')

  const mevcutSkor = analysis?.temp_overall ?? analysis?.web_overall ?? 50
  const anketTotal = Object.values(anket).reduce((a, b) => a + b, 0)
  // TODO: C250 katkı katsayısı onaylanacak (şu an max +8 puan)
  const ANKET_MAX = 8
  const anketKatkisi  = Math.round((anketTotal / 100) * ANKET_MAX)
  const aralikSkor    = Math.min(100, mevcutSkor + anketKatkisi)
  const finalSkor     = Math.min(100, Math.round((aralikSkor * 0.85) + (hekimScore * 0.15)))

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
              <p className="font-bold text-xl mt-0.5" style={{ color: scoreColor(mevcutSkor) }}>
                {mevcutSkor} / 100
              </p>
            </div>
          </div>
        </div>

        {analysis?.web_overall && (
          <div className="p-4 rounded-xl border text-sm" style={{ borderColor: `${scoreColor(mevcutSkor)}30`, background: `${scoreColor(mevcutSkor)}0d` }}>
            <p className="font-medium" style={{ color: scoreColor(mevcutSkor) }}>
              Hastanın ön analizi: <strong>{mevcutSkor}</strong>
            </p>
            <p className="text-slate-500 mt-0.5">Tahmini bir başlangıç değeri. Muayeneyle ve sizin değerlendirmenizle Klinik Onaylı EGS&apos;ye dönüşür.</p>
          </div>
        )}

        {/* Jeton bakiyesi */}
        {!alreadyIn && (
          <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
            jetonBalance > 0
              ? 'border-slate-700 bg-slate-800/40'
              : 'border-red-500/30 bg-red-500/10'
          }`}>
            <div>
              <span className={jetonBalance > 0 ? 'text-slate-400' : 'text-red-400'}>Jeton Bakiyesi</span>
              {jetonBalance === 0 && (
                <p className="text-red-400 text-xs mt-0.5">Hasta kabul etmek için jeton gerekli. Yöneticinizle iletişime geçin.</p>
              )}
            </div>
            <span className={`text-2xl font-black ${jetonBalance > 0 ? 'text-white' : 'text-red-400'}`}>
              {jetonBalance}
            </span>
          </div>
        )}

        {kabulError && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ✕ {kabulError}
          </div>
        )}

        {!alreadyIn ? (
          <button
            disabled={isPending || jetonBalance < 1}
            onClick={() => startTransition(async () => {
              setKabulError(null)
              const result = await onKabul(appointment.id)
              if (result.ok) {
                setStep(2)
              } else {
                setKabulError(result.error ?? 'Bir hata oluştu')
              }
            })}
            className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed">
            {isPending ? 'İşleniyor...' : jetonBalance < 1 ? '✕ Yetersiz Jeton' : '✓ Hastayı Kabul Et — 1 Jeton Düşülecek'}
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

  // ── Step 2: Klinik Anketi ──────────────────────────────────────
  function renderAnket() {
    const savedTotal = analysis?.device_overall
    return (
      <div className="space-y-5">
        {savedTotal != null && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-sm text-emerald-400">
            ✓ Anket daha önce kaydedildi (toplam: {savedTotal}/100). Güncellemek için tekrar kaydedin.
          </div>
        )}
        {ANKET_SORULAR.map(q => (
          <div key={q.key} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-medium">{q.label}</span>
              <span className="text-2xl font-black" style={{ color: scoreColor(anket[q.key] * 5) }}>
                {anket[q.key]}
              </span>
            </div>
            <input
              type="range" min={0} max={20} value={anket[q.key]}
              onChange={e => setAnket(prev => ({ ...prev, [q.key]: Number(e.target.value) }))}
              className="w-full accent-violet-500 cursor-pointer" />
            <p className="text-slate-500 text-xs mt-1">{q.desc}</p>
          </div>
        ))}

        <div className="flex items-center justify-between p-4 bg-slate-900 rounded-xl border border-slate-700">
          <span className="text-slate-400 font-medium">Anket Toplamı</span>
          <span className="text-2xl font-black" style={{ color: scoreColor(anketTotal) }}>
            {anketTotal} <span className="text-slate-500 text-base font-normal">/ 100</span>
          </span>
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(1)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            ← Geri
          </button>
          <button
            disabled={isPending || !analysis}
            onClick={() => startTransition(async () => {
              if (!analysis) return
              await onSaveAnket(appointment.id, analysis.id, anket, anketTotal)
              setStep(3)
            })}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? 'Kaydediliyor...' : 'Kaydet ve Devam →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 3: Tetkik Girişleri ───────────────────────────────────
  function renderTetkik() {
    return (
      <div className="space-y-5">
        <p className="text-slate-400 text-sm">Opsiyonel — tetkik sonuçlarını girin. Boş bırakılan alanlar hesaba katılmaz.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {TETKIK_FIELDS.map(f => (
            <div key={f.key} className="p-4 bg-slate-800/60 rounded-xl border border-slate-700">
              <label className="text-white font-medium text-sm block mb-2">
                {f.label}
                <span className="ml-2 text-slate-500 font-normal">{f.unit}</span>
              </label>
              <input
                type="number" placeholder="—" value={tetkik[f.key] ?? ''}
                onChange={e => setTetkik(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500" />
              <p className="text-slate-500 text-xs mt-1">Optimal: {f.optimal}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button onClick={() => setStep(2)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            ← Geri
          </button>
          <button
            disabled={isPending || !analysis}
            onClick={() => startTransition(async () => {
              if (!analysis) return
              const numericTetkik = Object.fromEntries(
                Object.entries(tetkik)
                  .filter(([, v]) => v !== '')
                  .map(([k, v]) => [k, Number(v)])
              )
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

  // ── Step 4: Hekim Değerlendirmesi ──────────────────────────────
  function renderHekim() {
    return (
      <div className="space-y-5">
        <div className="p-5 bg-slate-800/60 rounded-2xl border border-slate-700">
          <p className="text-slate-400 text-sm mb-1">Ön Analiz</p>
          <p className="text-3xl font-black" style={{ color: scoreColor(mevcutSkor) }}>{mevcutSkor}</p>
          <p className="text-slate-500 text-xs mt-1">Anket katkısıyla tahmini: {aralikSkor} — nihai karar sizde</p>
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
          <p className="text-slate-400 text-xs mb-1">Tahmini Final EGS (formül önizleme)</p>
          {/* TODO: C250 final formülü onaylanacak: (aralik × 0.85) + (hekim × 0.15) */}
          <p className="text-4xl font-black" style={{ color: scoreColor(finalSkor) }}>{finalSkor}</p>
          <p className="text-slate-500 text-xs mt-1">({aralikSkor} × 0.85) + ({hekimScore} × 0.15)</p>
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
          <button onClick={() => setStep(3)} className="px-5 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors">
            ← Geri
          </button>
          <button
            disabled={isPending || !analysis}
            onClick={() => startTransition(async () => {
              if (!analysis) return
              await onSaveHekim(appointment.id, analysis.id, hekimScore, hekimNotes)
              setStep(5)
            })}
            className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {isPending ? 'Kaydediliyor...' : 'Kaydet ve Önizle →'}
          </button>
        </div>
      </div>
    )
  }

  // ── Step 5: Final Onay ─────────────────────────────────────────
  function renderOnay() {
    const publishedScore = analysis?.final_overall
    return (
      <div className="space-y-5">
        {publishedScore != null ? (
          <div className="text-center py-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
            <p className="text-emerald-400 text-sm font-bold mb-2">✦ KLİNİK ONAYLI EGS YAYINLANDI ✦</p>
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
              <p className="text-slate-400 text-sm mb-2">Yayınlanacak EGS Skoru</p>
              <p className="text-7xl font-black" style={{ color: scoreColor(finalSkor) }}>{finalSkor}</p>
              <p className="text-slate-500 text-xs mt-2">
                Ön: {mevcutSkor} · Anket: +{anketKatkisi} · Hekim: {hekimScore}
              </p>
            </div>

            <div className="space-y-3 p-4 bg-slate-800/40 rounded-xl border border-slate-700 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Hasta</span><span className="text-white">{appointment.profiles?.full_name}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Ön Analiz</span><span style={{ color: scoreColor(mevcutSkor) }}>{mevcutSkor}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Anket Katkısı</span><span className="text-emerald-400">+{anketKatkisi}</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Hekim Değerlendirmesi</span><span style={{ color: scoreColor(hekimScore) }}>{hekimScore}</span></div>
              <div className="flex justify-between border-t border-slate-700 pt-2"><span className="text-white font-bold">Final EGS</span><span className="text-xl font-black" style={{ color: scoreColor(finalSkor) }}>{finalSkor}</span></div>
            </div>

            <div>
              <label className="text-white font-medium text-sm block mb-2">Klinik Notu (opsiyonel)</label>
              <textarea rows={2} value={clinicNotes} onChange={e => setClinicNotes(e.target.value)}
                placeholder="Vizit özeti..."
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
                  await onFinalOnay(appointment.id, analysis.id, aralikSkor, hekimScore, clinicNotes)
                })}
                className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 text-base">
                {isPending ? 'Yayınlanıyor...' : '✦ Klinik Onaylı EGS Yayınla'}
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
  const stepContent = [renderKabul, renderAnket, renderTetkik, renderHekim, renderOnay]

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
                <span className={`text-[10px] font-medium ${done ? 'text-emerald-400' : curr ? 'text-violet-400' : 'text-slate-600'}`}>
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
