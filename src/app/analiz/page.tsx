'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import EGSScoreBar from '@/components/EGSScoreBar'

type Step = 'upload' | 'processing' | 'result'

interface AnalysisResult {
  overall: number
  moisture: number
  wrinkles: number
  spots: number
  pores: number
  skinAge: number
  recommendations: string[]
}

// Mock AI analiz sonucu üretir — gerçek API entegrasyonu için burası değiştirilecek
function mockAnalyze(): AnalysisResult {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min
  const overall = rand(60, 92)
  const spots = rand(5, 40)
  return {
    overall,
    moisture: rand(55, 90),
    wrinkles: rand(10, 45),
    spots,
    pores: rand(20, 60),
    skinAge: rand(22, 38),
    recommendations: [
      'Günlük SPF 50+ güneş kremi kullanın',
      'Hyalüronik asit serumu nemlendirme için idealdir',
      overall < 75 ? 'Retinol içerikli ürünleri gece rutinine ekleyin' : 'Mevcut bakım rutininizi sürdürün',
      'Günde en az 2 litre su için',
      spots > 25 ? 'Leke karşıtı C vitamini serumu deneyin' : 'Antioksidan içerikli tonerde tutarlı kalın',
    ].filter(Boolean) as string[],
  }
}

const scoreColor = (score: number) =>
  score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-red-400'

const scoreBarColor = (score: number) =>
  score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'

export default function AnalizPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<Step>('upload')
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  async function startAnalysis() {
    if (!previewUrl) return
    const supabase = createClient()
    setStep('processing')

    // Yapay gecikme — AI işlem süresi simülasyonu
    await new Promise(r => setTimeout(r, 2800))

    const analysisResult = mockAnalyze()
    setResult(analysisResult)
    setStep('result')

    // Supabase'e kaydet
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('analyses').insert({
          user_id: user.id,
          web_overall: analysisResult.overall,
          status: 'completed',
        })
      }
    } catch {
      // Kayıt hatası sessizce geçilir
    }
  }

  async function saveAndGoPanel() {
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
                  : (['processing', 'result'].indexOf(step) > ['processing', 'result'].indexOf(s)) || (step === 'result')
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
              <h1 className="text-3xl font-bold text-white mb-2">Cilt Analizinizi Başlatın</h1>
              <p className="text-slate-400">Yüzünüzün net göründüğü bir selfie yükleyin</p>
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
                  onClick={() => { setPreviewUrl(null); URL.revokeObjectURL(previewUrl) }}
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
                  <p className="text-slate-500 text-xs mt-0.5">Fotoğrafınız yalnızca analiz için kullanılır ve şifreli olarak saklanır.</p>
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
            <h2 className="text-2xl font-bold text-white mb-3">Cildiniz Analiz Ediliyor</h2>
            <p className="text-slate-400 mb-8">AI modelimiz fotoğrafınızı işliyor...</p>
            <div className="space-y-3 text-left max-w-xs mx-auto">
              {[
                'Yüz tespiti yapılıyor',
                'Cilt dokusu analiz ediliyor',
                'Nem ve leke haritası çıkarılıyor',
                'Bakım önerileri hazırlanıyor',
              ].map((label, i) => (
                <div key={label} className="flex items-center gap-3" style={{ animationDelay: `${i * 0.4}s` }}>
                  <div className="w-5 h-5 rounded-full border-2 border-violet-500/50 flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
                  </div>
                  <span className="text-slate-400 text-sm">{label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ADIM 3 — Sonuç */}
        {step === 'result' && result && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white mb-2">Analiziniz Hazır</h1>
              <p className="text-slate-400">İlk EGS Gençlik Skorunuz hesaplandı</p>
            </div>

            {/* EGS Canlı Skor Barı */}
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60 mb-6">
              <EGSScoreBar
                score={result.overall}
                phase="ai_analiz"
                animated={true}
              />
            </div>

            {/* Metrikler */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { label: 'Nem Seviyesi', value: result.moisture, unit: '%' },
                { label: 'Cilt Yaşı', value: result.skinAge, unit: ' yaş' },
                { label: 'Kırışıklık', value: result.wrinkles, unit: '/100', invert: true },
                { label: 'Gözenek', value: result.pores, unit: '/100', invert: true },
              ].map(({ label, value, unit, invert }) => {
                const displayScore = invert ? 100 - value : value
                return (
                  <div key={label} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <p className="text-slate-500 text-xs mb-2">{label}</p>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={`text-2xl font-bold ${scoreColor(displayScore)}`}>{value}</span>
                      <span className="text-slate-500 text-xs">{unit}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${scoreBarColor(displayScore)}`}
                        style={{ width: `${invert ? 100 - value : value}%` }}
                      />
                    </div>
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
              {/* Longevity Anketi CTA — skor artırmak için */}
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
