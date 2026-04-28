'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { saveLongevityAnket } from './anket-actions'

const SORULAR = [
  {
    key: 'beslenme',
    label: 'Beslenme düzeni',
    desc: '20 yaşınızdan bu yana beslenme düzeninizi, sebze-meyve tüketiminizi ve işlenmiş gıdadan kaçınma alışkanlığınızı 0-100 arasında puanlayın.',
    low: 'Çok kötü',
    high: 'Mükemmel',
    emoji: '🥗',
  },
  {
    key: 'cilt',
    label: 'Cilt koruma rutini',
    desc: '20 yaşınızdan bu yana güneş koruması, nemlendirme ve cilt bakım rutininizi 0-100 arasında puanlayın.',
    low: 'Hiç yok',
    high: 'Günlük ve düzenli',
    emoji: '✨',
  },
  {
    key: 'uyku',
    label: 'Uyku kalitesi',
    desc: '20 yaşınızdan bu yana uyku sürenizi, uyku kalitenizi ve dinlendirme kapasitesini 0-100 arasında puanlayın.',
    low: 'Çok kötü',
    high: 'Mükemmel',
    emoji: '😴',
  },
  {
    key: 'stres',
    label: 'Stres yönetimi',
    desc: '20 yaşınızdan bu yana hayatın stres faktörlerine karşı psikolojik dayanıklılığınızı ve iç huzurunuzu koruma kapasitenizi 0-100 arasında puanlayın.',
    low: 'Sürekli stresli',
    high: 'Tamamen rahat',
    emoji: '🧘',
  },
  {
    key: 'aktivite',
    label: 'Fiziksel aktivite',
    desc: '20 yaşınızdan bu yana kas kütlenizi korumak ve metabolizmanızı canlı tutmak için sergilediğiniz fiziksel aktivite düzeyini 0-100 arasında puanlayın.',
    low: 'Hareketsiz',
    high: 'Çok aktif',
    emoji: '🏃',
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
  const [introShown, setIntroShown] = useState(false)

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
      const res = await saveLongevityAnket({
        analysisId: analysis.id,
        answers,
        anketToplam,
      })
      if (!res.ok) { alert(res.error ?? 'Hata'); setSaving(false); return }
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

  // ── Intro Ekranı ──────────────────────────────────────────────────────────
  if (!introShown) {
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

        <div className="max-w-2xl mx-auto px-4 pt-28 pb-16 flex flex-col items-center justify-center min-h-screen">
          <div className="w-full rounded-3xl border border-slate-700 bg-slate-800/60 backdrop-blur-sm p-8 space-y-6">

            {/* Başlık */}
            <div className="text-center space-y-1">
              <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3">Longevity Başarı Analizi</p>
              <p className="text-slate-400 text-sm">(Sağlıklı Yaşam Analizi)</p>
              <h1 className="text-2xl font-black text-white mt-2 leading-snug">
                Biyolojik Sermayenizi<br />Ne Kadar Korudunuz?
              </h1>
            </div>

            {/* Ana açıklama */}
            <p className="text-slate-300 text-sm leading-relaxed text-center">
              Bu analiz şu anki sağlığınızı değil; <span className="text-white font-semibold">20 yaşınızdan bugüne kadar</span> yaşam tarzınızın biyolojik yaşlanma hızınızı nasıl şekillendirdiğini ölçer.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-700 text-sm text-slate-400 leading-relaxed text-center">
              Takvim yaşınız değiştirilemez.<br />
              <span className="text-white font-medium">Biyolojik yaşınız ise büyük ölçüde sizin elinizde olmuştur.</span>
            </div>

            {/* Nasıl değerlendirmelisiniz */}
            <div className="space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">📊 Nasıl değerlendirmelisiniz?</p>
              <p className="text-slate-400 text-xs leading-relaxed">
                Geçici dönemleri değil, <span className="text-slate-300">20&apos;li yaşlarınızdan bugüne uzanan genel ortalamanızı</span> esas alın.
              </p>
              <div className="space-y-2">
                {[
                  { pct: '%100', label: 'O alanda yaşam boyu tutarlı ve özenliydiniz', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
                  { pct: '%50',  label: 'İyi dönemler ve ihmal edilen dönemler dengelendi', color: 'text-amber-400',   bg: 'bg-amber-500/10 border-amber-500/20'   },
                  { pct: '%0',   label: 'O alan büyük ölçüde ihmal edildi',                color: 'text-red-400',     bg: 'bg-red-500/10 border-red-500/20'       },
                ].map(row => (
                  <div key={row.pct} className={`flex items-start gap-3 p-3 rounded-xl border ${row.bg}`}>
                    <span className={`font-black text-sm shrink-0 w-10 ${row.color}`}>{row.pct}</span>
                    <span className="text-slate-300 text-xs leading-relaxed">{row.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Hatırlatma */}
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-violet-500/10 border border-violet-500/20">
              <span className="text-lg shrink-0">💡</span>
              <p className="text-slate-300 text-xs leading-relaxed">
                Burada kendinizi yargılamıyorsunuz — <span className="text-white font-medium">nerede olduğunuzu görüyorsunuz.</span>
              </p>
            </div>

            {/* Meta */}
            <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
              <span>⏱ 3–5 dakika</span>
              <span className="w-px h-4 bg-slate-700" />
              <span>📋 5 soru</span>
              <span className="w-px h-4 bg-slate-700" />
              <span className="text-amber-400 font-semibold">+10 puan</span>
            </div>

            {/* CTA */}
            <button
              onClick={() => setIntroShown(true)}
              className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 hover:scale-[1.01] bg-gradient-to-r from-violet-600 to-purple-600">
              Analize Başla →
            </button>
          </div>
        </div>
      </main>
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
            Yaşam tarzı bilgileriniz Gençlik Skorunuzu daha doğru hesaplamamızı sağlar.
            Klinikte yüz yüze tekrar sorulacak — dürüst cevaplar en iyi sonucu verir.
          </p>
        </div>

        {/* Mevcut skor önizleme */}
        <div className="mb-8 p-5 rounded-2xl border border-slate-700 bg-slate-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Ön Analiziniz</p>
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
            Anket katkısı: {anketToplam}/100 puan → +{katkı} Gençlik Puanı
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
