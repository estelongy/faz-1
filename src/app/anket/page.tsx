'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// TODO: Soru metinleri ve skor katkısı C250 formülüne göre güncellenecek
const SORULAR = [
  {
    key: 'uyku',
    label: 'Uyku kalitesi',
    desc: 'Son 1 ayda uyku süreniz ve kalitesini değerlendirin',
    low: 'Çok kötü',
    high: 'Mükemmel',
    emoji: '😴',
  },
  {
    key: 'beslenme',
    label: 'Beslenme düzeni',
    desc: 'Günlük beslenme alışkanlıklarınız (sebze, meyve, işlenmiş gıda dengesi)',
    low: 'Çok kötü',
    high: 'Mükemmel',
    emoji: '🥗',
  },
  {
    key: 'stres',
    label: 'Stres yönetimi',
    desc: 'Son 1 ayda stres seviyeniz ve başa çıkma yetkiniz',
    low: 'Sürekli stresli',
    high: 'Tamamen rahat',
    emoji: '🧘',
  },
  {
    key: 'aktivite',
    label: 'Fiziksel aktivite',
    desc: 'Haftalık egzersiz ve günlük hareket miktarınız',
    low: 'Hareketsiz',
    high: 'Çok aktif',
    emoji: '🏃',
  },
  {
    key: 'cilt',
    label: 'Cilt koruma rutini',
    desc: 'Günlük cilt bakımı, güneş koruması ve nemlendirme düzeniniz',
    low: 'Hiç yok',
    high: 'Günlük ve düzenli',
    emoji: '✨',
  },
]

// TODO: C250 katkı katsayısı onaylanacak — şu an max +10 puan
const ANKET_MAX_KATKISI = 10

function scoreColor(s: number) {
  if (s >= 90) return '#00d4ff'
  if (s >= 75) return '#22c55e'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}

type Analysis = {
  id: string
  web_overall: number | null
  temp_overall: number | null
  temp_longevity_score: number | null
}

export default function AnketPage() {
  const router = useRouter()
  const supabase = createClient()

  const [loading, setLoading]     = useState(true)
  const [saving,  setSaving]      = useState(false)
  const [analysis, setAnalysis]   = useState<Analysis | null>(null)
  const [alreadyDone, setAlreadyDone] = useState(false)

  const [answers, setAnswers] = useState<Record<string, number>>(
    Object.fromEntries(SORULAR.map(q => [q.key, 10]))
  )

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }

      const { data } = await supabase
        .from('analyses')
        .select('id, web_overall, temp_overall, temp_longevity_score')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!data) { router.push('/analiz'); return }

      setAnalysis(data)
      if (data.temp_overall != null) {
        setAlreadyDone(true)
        // Önceki cevapları geri yükle (temp_longevity_score'dan)
      }
      setLoading(false)
    }
    init()
  }, [])

  const anketToplam   = Object.values(answers).reduce((a, b) => a + b, 0)   // 0–100
  const katkı         = Math.round((anketToplam / 100) * ANKET_MAX_KATKISI)
  const mevcutSkor    = analysis?.web_overall ?? 50
  const yeniSkor      = Math.min(100, mevcutSkor + katkı)

  async function handleSubmit() {
    if (!analysis) return
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/giris'); return }

      await supabase
        .from('analyses')
        .update({
          temp_longevity_score: anketToplam,
          temp_overall: yeniSkor,
        })
        .eq('id', analysis.id)
        .eq('user_id', user.id)

      router.push('/panel')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="text-white font-bold text-sm">Longevity Anketi</span>
          </div>
          <button onClick={() => router.push('/panel')}
            className="text-slate-400 hover:text-white text-sm transition-colors">
            Panele Dön
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">

        {/* Başlık */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Longevity Anketi</h1>
          <p className="text-slate-400">
            Yaşam tarzı bilgileriniz EGS skorunuzu daha doğru hesaplamamızı sağlar.
            Klinikte yüz yüze tekrar sorulacak — dürüst cevaplar en iyi sonucu verir.
          </p>
        </div>

        {/* Mevcut skor önizleme */}
        <div className="mb-8 p-5 rounded-2xl border border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">AI Ön Skorunuz</p>
              <p className="text-4xl font-black mt-0.5" style={{ color: scoreColor(mevcutSkor) }}>
                {mevcutSkor}
              </p>
            </div>
            <div className="text-slate-600 text-2xl font-light">→</div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Anket Sonrası Tahmini</p>
              <p className="text-4xl font-black mt-0.5" style={{ color: scoreColor(yeniSkor) }}>
                {yeniSkor}
              </p>
            </div>
            <div className="text-right ml-4">
              <p className="text-slate-500 text-xs">Katkı</p>
              <p className="text-2xl font-black text-emerald-400 mt-0.5">+{katkı}</p>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{ width: `${yeniSkor}%`, background: scoreColor(yeniSkor) }}
            />
          </div>
          <p className="text-slate-600 text-xs mt-2 text-center">
            {/* TODO: C250 katkı faktörü onaylanacak */}
            Anket katkısı: {anketToplam}/100 puan → +{katkı} EGS
          </p>
        </div>

        {alreadyDone && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-400">
            ⚠ Bu analiz için anket zaten doldurulmuş. Güncellemek için tekrar kaydedin.
          </div>
        )}

        {/* Sorular */}
        <div className="space-y-5">
          {SORULAR.map((soru, idx) => {
            const val = answers[soru.key]
            const pct = (val / 20) * 100
            return (
              <div key={soru.key}
                className="p-5 rounded-2xl border border-slate-700 bg-slate-800/50 transition-all"
                style={{ borderColor: val > 14 ? '#22c55e30' : val < 7 ? '#ef444430' : undefined }}>

                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{soru.emoji}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">{idx + 1}/5</span>
                        <h3 className="text-white font-bold">{soru.label}</h3>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{soru.desc}</p>
                    </div>
                  </div>
                  <span className="text-3xl font-black shrink-0"
                    style={{ color: scoreColor(pct) }}>
                    {val}
                  </span>
                </div>

                <input
                  type="range" min={0} max={20} step={1} value={val}
                  onChange={e => setAnswers(prev => ({ ...prev, [soru.key]: Number(e.target.value) }))}
                  className="w-full cursor-pointer accent-violet-500"
                />

                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>{soru.low}</span>
                  <span>{soru.high}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Toplam özet */}
        <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="grid grid-cols-5 gap-2 mb-4">
            {SORULAR.map(s => (
              <div key={s.key} className="text-center">
                <div className="text-lg font-black" style={{ color: scoreColor((answers[s.key] / 20) * 100) }}>
                  {answers[s.key]}
                </div>
                <div className="text-[9px] text-slate-600 truncate">{s.label.split(' ')[0]}</div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-slate-400 text-sm">Toplam Anket Puanı</span>
            <span className="text-2xl font-black text-white">{anketToplam}<span className="text-slate-500 text-sm font-normal"> / 100</span></span>
          </div>
        </div>

        {/* Gönder */}
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="mt-6 w-full py-4 rounded-2xl font-black text-white text-base transition-opacity hover:opacity-90 disabled:opacity-50
            bg-gradient-to-r from-violet-600 to-purple-600">
          {saving
            ? 'Kaydediliyor...'
            : alreadyDone
              ? '↻ Güncelle ve Panele Dön'
              : `Anketi Tamamla — Skorumu Güncelle (+${katkı})`}
        </button>

        <p className="text-center text-slate-600 text-xs mt-3">
          Bu cevaplar klinikte yüz yüze tekrar doğrulanacaktır.
        </p>
      </div>
    </main>
  )
}
