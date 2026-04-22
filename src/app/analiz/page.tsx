'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ScoreBar from '@/components/ScoreBar'
import type { AnalizResult } from '@/app/api/analiz/route'

type Step = 'upload' | 'processing' | 'result'

type ProcessingStage =
  | 'Fotoğraf yükleniyor'
  | 'Yüz tespiti yapılıyor'
  | 'Cilt dokusu analiz ediliyor'
  | 'C250 formülü hesaplanıyor'
  | 'Bakım önerileri hazırlanıyor'

const STAGES: ProcessingStage[] = [
  'Fotoğraf yükleniyor',
  'Yüz tespiti yapılıyor',
  'Cilt dokusu analiz ediliyor',
  'C250 formülü hesaplanıyor',
  'Bakım önerileri hazırlanıyor',
]

const scoreColor = (score: number) =>
  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'

const scoreBarColor = (score: number) =>
  score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function AnalizPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<File | null>(null)

  const [step, setStep]           = useState<Step>('upload')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult]       = useState<AnalizResult | null>(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [stageIdx, setStageIdx]   = useState(0)
  const [usedFallback, setUsedFallback] = useState(false)

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir fotoğraf dosyası seçin.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Dosya boyutu 10 MB\'ı geçemez.')
      return
    }
    setError(null)
    fileRef.current = file
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  async function startAnalysis() {
    const file = fileRef.current
    if (!file || !previewUrl) return
    setError(null)
    setStep('processing')
    setStageIdx(0)

    // Aşama animasyonu
    let idx = 0
    const stageInterval = setInterval(() => {
      idx++
      if (idx < STAGES.length) setStageIdx(idx)
      else clearInterval(stageInterval)
    }, 900)

    try {
      // Base64 dönüşümü
      const dataUrl = await toBase64(file)
      const base64  = dataUrl.replace(/^data:[^;]+;base64,/, '')
      const mimeType = file.type || 'image/jpeg'

      // Gerçek AI analiz API çağrısı
      const res = await fetch('/api/analiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType }),
      })

      clearInterval(stageInterval)
      setStageIdx(STAGES.length - 1)

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? `HTTP ${res.status}`)
      }

      const data = await res.json() as { ok: boolean; result: AnalizResult; usedFallback: boolean }
      setUsedFallback(data.usedFallback ?? false)
      setResult(data.result)
      setStep('result')
    } catch (err) {
      clearInterval(stageInterval)
      setError(err instanceof Error ? err.message : 'Analiz sırasında bir hata oluştu. Lütfen tekrar deneyin.')
      setStep('upload')
    }
  }

  function saveAndGoPanel() {
    setSaving(true)
    router.push('/panel')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/panel" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">Panel</span>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Estelongy
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        {/* Adım göstergesi */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {(['upload', 'processing', 'result'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step === s
                  ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white'
                  : step === 'result'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
              }`}>
                {i + 1}
              </div>
              {i < 2 && <div className={`w-8 h-px ${step !== 'upload' && i === 0 ? 'bg-violet-500' : step === 'result' && i === 1 ? 'bg-violet-500' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* ADIM 1 — Fotoğraf Yükle */}
        {step === 'upload' && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Gençlik Skorunu Öğren</h1>
              <p className="text-slate-400">Selfie yükle, GPT-4 Vision ile ön analizin saniyeler içinde hazır.</p>
            </div>

            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-2xl p-12 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all bg-slate-800/30 hover:bg-slate-800/50 group"
              >
                <div className="w-16 h-16 rounded-2xl bg-slate-700 group-hover:bg-violet-500/20 flex items-center justify-center transition-all">
                  <svg className="w-8 h-8 text-slate-400 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-1">Fotoğraf yükle veya sürükle</p>
                  <p className="text-slate-500 text-sm">JPG, PNG veya WEBP — maks. 10 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </div>
            ) : (
              <div className="relative rounded-2xl overflow-hidden border border-slate-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={previewUrl} alt="Selfie önizleme" className="w-full object-cover max-h-80" />
                <button
                  onClick={() => { setPreviewUrl(null); fileRef.current = null; URL.revokeObjectURL(previewUrl) }}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {error && (
              <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="mt-8 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                <svg className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <div>
                  <p className="text-white text-sm font-medium">Gizlilik güvencesi</p>
                  <p className="text-slate-500 text-xs mt-0.5">Fotoğrafınız yalnızca analiz için kullanılır, sunucularda saklanmaz.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-xl bg-violet-500/5 border border-violet-500/20">
                <svg className="w-5 h-5 text-violet-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <div>
                  <p className="text-white text-sm font-medium">GPT-4 Vision + C250 Formülü</p>
                  <p className="text-slate-500 text-xs mt-0.5">Bileşen skorları: nem, kırışıklık, pigmentasyon, ton ve göz altı analizi.</p>
                </div>
              </div>
            </div>

            <button
              onClick={startAnalysis}
              disabled={!previewUrl}
              className="w-full mt-6 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all text-lg"
            >
              Analizi Başlat
            </button>
          </div>
        )}

        {/* ADIM 2 — İşleniyor */}
        {step === 'processing' && (
          <div className="text-center py-16">
            <div className="relative w-24 h-24 mx-auto mb-8">
              <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-4 border-t-violet-500 animate-spin" />
              <div className="absolute inset-3 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Fotoğrafın İşleniyor</h2>
            <p className="text-slate-400 mb-8">GPT-4 Vision analiz ediyor, C250 formülü hesaplanıyor...</p>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              {STAGES.map((label, i) => (
                <div key={label} className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                    i < stageIdx
                      ? 'border-emerald-500 bg-emerald-500/20'
                      : i === stageIdx
                        ? 'border-violet-500/50'
                        : 'border-slate-700'
                  }`}>
                    {i < stageIdx
                      ? <svg className="w-3 h-3 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                      : i === stageIdx
                        ? <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                        : null
                    }
                  </div>
                  <span className={`text-sm transition-colors ${i <= stageIdx ? 'text-slate-300' : 'text-slate-600'}`}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADIM 3 — Sonuç */}
        {step === 'result' && result && (
          <div>
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold mb-4">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {usedFallback ? 'Ön Analiz · Tahmini Skor (AI servisi geçici kapalı)' : 'GPT-4 Vision · C250 Ön Analiz'}
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Ön Analiz Skorunuz: <span className="text-violet-400">{result.overall}</span></h1>
              <p className="text-slate-400">
                Kesin skor klinik muayenesiyle oluşur — randevu al,{' '}
                <span className="text-emerald-400 font-semibold">Klinik Onaylı Gençlik Skoru</span> sertifikana ulaş
              </p>
            </div>

            {/* EGS Canlı Skor Barı */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 mb-6">
              <ScoreBar
                score={result.overall}
                phase="ai_analiz"
                animated={true}
              />
              {/* Güven skoru */}
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>AI Güven Skoru</span>
                <span className={result.confidence >= 0.7 ? 'text-emerald-400' : result.confidence >= 0.5 ? 'text-amber-400' : 'text-red-400'}>
                  %{Math.round(result.confidence * 100)}
                </span>
              </div>
              <div className="h-1 rounded-full bg-slate-700 mt-1">
                <div
                  className={`h-full rounded-full transition-all ${result.confidence >= 0.7 ? 'bg-emerald-500' : result.confidence >= 0.5 ? 'bg-amber-500' : 'bg-red-500'}`}
                  style={{ width: `${result.confidence * 100}%` }}
                />
              </div>
            </div>


            {/* Bileşen Metrikleri */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Nem Seviyesi',  value: result.moisture, unit: '%',    invert: false },
                { label: 'Cilt Yaşı',     value: result.skinAge,  unit: ' yaş', invert: false, noBar: true },
                { label: 'Kırışıklık',    value: result.wrinkles, unit: '/100', invert: true  },
                { label: 'Pigmentasyon',  value: result.spots,    unit: '/100', invert: true  },
              ].map(({ label, value, unit, invert, noBar }) => {
                const displayScore = invert ? 100 - value : value
                return (
                  <div key={label} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <p className="text-slate-500 text-xs mb-2">{label}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-2xl font-bold ${noBar ? 'text-white' : scoreColor(displayScore)}`}>{value}</span>
                      <span className="text-slate-500 text-xs">{unit}</span>
                    </div>
                    {!noBar && (
                      <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${scoreBarColor(displayScore)}`}
                          style={{ width: `${displayScore}%` }}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Öneriler */}
            <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                Kişisel Bakım Önerileri
              </h3>
              <ul className="space-y-2">
                {result.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                    <svg className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Aksiyon butonları */}
            <div className="space-y-3">
              <Link
                href="/anket"
                className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Longevity Anketi ile Skorunu Artır →
              </Link>
              <Link
                href="/randevu"
                className="w-full flex items-center justify-center gap-2 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Uzman Randevusu Al
              </Link>
              <button
                onClick={saveAndGoPanel}
                disabled={saving}
                className="w-full py-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 text-slate-400 font-medium rounded-xl transition-all disabled:opacity-50 text-sm"
              >
                {saving ? 'Yükleniyor...' : 'Panele Dön'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
