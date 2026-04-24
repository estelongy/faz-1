'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ScoreBar from '@/components/ScoreBar'
import { HASTA_ANKET_SORULARI, hastaAnketPuani, type AnketSoru } from '@/lib/anket-sorular'
import RandevuFlow from '@/components/RandevuFlow'

// ─── Tipler ──────────────────────────────────────────────────────────────────
type ExpandedCard = 'anket' | 'randevu' | 'urun' | null

interface Analysis {
  id: string
  web_overall: number
  web_scores: {
    wrinkles?: number
    pigmentation?: number
    hydration?: number
    tone_uniformity?: number
    under_eye?: number
  } | null
  web_ai_raw: {
    actual_age?: number
    estimated_skin_age?: number
    c250Details?: { rawScore?: number; ageFactor?: number; explanation?: string }
  } | null
  created_at: string
}

interface Clinic {
  id: string
  name: string
  city?: string | null
}

interface Product {
  id: string
  slug: string | null
  name: string
  category: string | null
  final_score: number | null
  images: string[] | null
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────
function scoreToApparentAge(score: number): number {
  // PLACEHOLDER — gerçek algoritma sonra
  return Math.round(Math.max(18, 18 + (100 - score) * 0.74))
}


function metricColor(value: number, invert = false) {
  const v = invert ? 100 - value : value
  if (v >= 75) return 'text-emerald-400'
  if (v >= 50) return 'text-amber-400'
  return 'text-red-400'
}

function metricBar(value: number, invert = false) {
  const v = invert ? 100 - value : value
  if (v >= 75) return 'bg-emerald-500'
  if (v >= 50) return 'bg-amber-500'
  return 'bg-red-500'
}

// ─── Ana Component ───────────────────────────────────────────────────────────
export default function SkorMerkeziPage() {
  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading]       = useState(true)
  const [analysis, setAnalysis]     = useState<Analysis | null>(null)
  const [birthYear, setBirthYear]   = useState<number | null>(null)
  const [expanded, setExpanded]     = useState<ExpandedCard>(null)

  // Anket state
  const [anketCevap, setAnketCevap] = useState<Record<string, number>>({})
  const [anketSubmitting, setAnketSubmitting] = useState(false)

  // Önizleme verileri
  const [clinics, setClinics]       = useState<Clinic[]>([])
  const [products, setProducts]     = useState<Product[]>([])

  // ── İlk yükleme: analiz, profil, klinikler, ürünler ──────────────────────
  useEffect(() => {
    let cancelled = false
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/giris?next=/skor')
        return
      }

      // Paralel fetch
      const [analysisRes, profileRes, clinicsRes, productsRes] = await Promise.all([
        supabase
          .from('analyses')
          .select('id, web_overall, web_scores, web_ai_raw, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('birth_year')
          .eq('id', user.id)
          .single(),
        supabase
          .from('clinics')
          .select('id, name, city')
          .eq('status', 'approved')
          .limit(20),
        supabase
          .from('products')
          .select('id, slug, name, category, final_score, images')
          .eq('status', 'active')
          .order('final_score', { ascending: false, nullsFirst: false })
          .limit(3),
      ])

      if (cancelled) return

      if (!analysisRes.data) {
        // Analiz yok → analiz sayfasına yönlendir
        router.push('/analiz')
        return
      }

      setAnalysis(analysisRes.data as Analysis)
      setBirthYear(profileRes.data?.birth_year ?? null)
      setClinics(clinicsRes.data ?? [])
      setProducts(productsRes.data ?? [])
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [supabase, router])

  // ── Anket cevap güncelle (canlı skor için) ────────────────────────────────
  function setCevap(key: string, value: number) {
    setAnketCevap(prev => ({ ...prev, [key]: value }))
  }

  // Canlı tahmini skor — anket cevaplandıkça artıyor
  const tahminiSkorBonusu = useMemo(() => hastaAnketPuani(anketCevap), [anketCevap])
  const baseScore = analysis?.web_overall ?? 0
  const liveScore = Math.min(100, baseScore + tahminiSkorBonusu)
  const isUpdating = expanded === 'anket' && Object.keys(anketCevap).length > 0

  async function submitAnket() {
    if (!analysis) return
    setAnketSubmitting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      await supabase.from('longevity_surveys').insert({
        user_id: user.id,
        responses: anketCevap,
        score: tahminiSkorBonusu,
      })
      // Skoru güncelle: web_overall + bonus
      const yeniSkor = Math.round(liveScore)
      await supabase.from('scores').insert({
        user_id: user.id,
        score_type: 'web',
        total_score: yeniSkor,
        overall_score: yeniSkor,
        analysis_id: analysis.id,
      })
      router.refresh()
      setExpanded(null)
    } catch (err) {
      console.error('Anket kaydedilemedi:', err)
    } finally {
      setAnketSubmitting(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────
  if (loading || !analysis) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Skor merkezi yükleniyor…</p>
        </div>
      </main>
    )
  }

  const gercekYas = birthYear ? new Date().getFullYear() - birthYear : null
  const gorunumYas = scoreToApparentAge(liveScore)
  const yasFarki = gercekYas !== null ? gercekYas - gorunumYas : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/panel" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="text-sm">Panel</span>
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Skor Merkezi</span>
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 relative">
        {/* Backdrop — açık kartı tıklayarak kapamak için */}
        {expanded && (
          <button
            type="button"
            aria-label="Kartı kapat"
            onClick={() => setExpanded(null)}
            className="hidden lg:block fixed inset-0 top-16 bg-slate-900/60 backdrop-blur-sm z-30"
          />
        )}

        {/* ─── Yan yana: Sol Skor (sticky) | Sağ Kartlar ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 relative">

          {/* ───── SOL — Skor + Biyo. Yaş + Metrikler (sticky) ─────── */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <ScoreBar
                score={liveScore}
                previousScore={isUpdating ? baseScore : undefined}
                phase="ai_analiz"
                animated
              />
              {isUpdating && (
                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-xs font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    Skorunuz güncelleniyor… (+{tahminiSkorBonusu.toFixed(1)} puan)
                  </span>
                </div>
              )}

              {/* Biyolojik Yaş */}
              {gercekYas !== null && (
                <div className="mt-6 pt-6 border-t border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-base">🧬</span>
                    <span className="text-white font-semibold text-sm">Biyolojik Yaş</span>
                    <span className="ml-auto text-[10px] text-slate-500 italic">placeholder</span>
                  </div>
                  <div className="flex items-center justify-around">
                    <div className="text-center">
                      <p className="text-slate-500 text-xs mb-1">Gerçek Yaş</p>
                      <p className="text-white text-2xl font-bold">{gercekYas}</p>
                    </div>
                    <div className="text-slate-600 text-xl">→</div>
                    <div className="text-center">
                      <p className="text-slate-500 text-xs mb-1">Görünüm Yaşı</p>
                      <p className={`text-2xl font-bold ${yasFarki && yasFarki > 0 ? 'text-emerald-400' : yasFarki && yasFarki < 0 ? 'text-amber-400' : 'text-white'}`}>
                        {gorunumYas}
                      </p>
                    </div>
                  </div>
                  {yasFarki !== null && yasFarki !== 0 && (
                    <p className={`text-center text-xs font-semibold mt-2 ${yasFarki > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {yasFarki > 0 ? `${yasFarki} yıl daha genç ✨` : `${Math.abs(yasFarki)} yıl daha yaşlı`}
                    </p>
                  )}
                </div>
              )}

              {/* Metrikler */}
              <div className="mt-6 pt-6 border-t border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">🔬</span>
                  <span className="text-white font-semibold text-sm">Cilt Metrikleri</span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {analysis.web_scores?.hydration !== undefined && (
                    <Metric label="Nem" value={analysis.web_scores.hydration} unit="%" />
                  )}
                  {analysis.web_scores?.wrinkles !== undefined && (
                    <Metric label="Kırışıklık" value={analysis.web_scores.wrinkles} unit="/100" invert />
                  )}
                  {analysis.web_scores?.pigmentation !== undefined && (
                    <Metric label="Pigmentasyon" value={analysis.web_scores.pigmentation} unit="/100" invert />
                  )}
                  {analysis.web_scores?.tone_uniformity !== undefined && (
                    <Metric label="Cilt Tonu" value={analysis.web_scores.tone_uniformity} unit="%" />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ───── SAĞ — 3 Dikey Aksiyon Kartı ───────────────────────── */}
          <div className="space-y-4">

          {/* ANKET KARTI */}
          <ActionCard
            id="anket"
            icon="📋"
            title="Longevity Anketi"
            subtitle={`+${(10).toFixed(0)} puan kazanabilirsin`}
            isExpanded={expanded === 'anket'}
            onToggle={() => setExpanded(expanded === 'anket' ? null : 'anket')}
            preview={
              <div className="relative">
                <p className="text-slate-300 text-sm mb-2">{HASTA_ANKET_SORULARI[0].emoji} {HASTA_ANKET_SORULARI[0].label}</p>
                <p className="text-slate-500 text-xs blur-sm select-none">
                  {HASTA_ANKET_SORULARI.slice(1, 3).map(s => s.label).join(' · ')}
                </p>
              </div>
            }
          >
            {/* Tam anket (expand olunca) */}
            <div className="space-y-5">
              {HASTA_ANKET_SORULARI.map((s, idx) => (
                <SoruBlok
                  key={s.key}
                  soru={s}
                  index={idx}
                  value={anketCevap[s.key]}
                  onChange={v => setCevap(s.key, v)}
                />
              ))}
              <button
                onClick={submitAnket}
                disabled={anketSubmitting || Object.keys(anketCevap).length < HASTA_ANKET_SORULARI.length}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 disabled:opacity-40 text-white font-semibold rounded-xl"
              >
                {anketSubmitting ? 'Kaydediliyor…' : `Anketi Tamamla (+${tahminiSkorBonusu.toFixed(1)} puan)`}
              </button>
            </div>
          </ActionCard>

          {/* RANDEVU KARTI */}
          <ActionCard
            id="randevu"
            icon="📅"
            title="Uzman Randevusu"
            subtitle="Klinik onaylı skor için"
            isExpanded={expanded === 'randevu'}
            onToggle={() => setExpanded(expanded === 'randevu' ? null : 'randevu')}
            preview={
              <div>
                {clinics.length > 0 ? (
                  <>
                    <p className="text-slate-300 text-sm mb-1">📍 {clinics[0].name}</p>
                    <p className="text-slate-500 text-xs">{clinics.length} klinik müsait · gün ve saat seç</p>
                  </>
                ) : (
                  <p className="text-slate-500 text-xs">Klinik seçimi…</p>
                )}
              </div>
            }
          >
            <RandevuFlow embedded onSuccess={() => setExpanded(null)} />
          </ActionCard>

          {/* ÜRÜN KARTI */}
          <ActionCard
            id="urun"
            icon="🛍️"
            title="Önerilen Ürünler"
            subtitle="Skoruna göre seçildi"
            isExpanded={expanded === 'urun'}
            onToggle={() => setExpanded(expanded === 'urun' ? null : 'urun')}
            preview={
              <div className="flex gap-2">
                {products.slice(0, 2).map(p => (
                  <div key={p.id} className="flex-1 aspect-square rounded-lg bg-slate-800 overflow-hidden">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-2xl">📦</div>
                    )}
                  </div>
                ))}
              </div>
            }
          >
            <div className="space-y-3">
              {products.map(p => (
                <Link
                  key={p.id}
                  href={`/magaza/${p.slug ?? p.id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-slate-800 border border-slate-700 hover:border-violet-500/50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-900 overflow-hidden shrink-0">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-semibold truncate">{p.name}</p>
                    {p.final_score && (
                      <p className="text-violet-400 text-xs">EGP {p.final_score.toFixed(1)}/10</p>
                    )}
                  </div>
                </Link>
              ))}
              <Link
                href="/magaza"
                className="block w-full py-3 text-center bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl"
              >
                Mağazaya Git →
              </Link>
            </div>
          </ActionCard>
          </div>
        </div>
      </div>
    </main>
  )
}

// ─── Alt Bileşenler ──────────────────────────────────────────────────────────

function Metric({ label, value, unit, invert = false }: { label: string; value: number; unit: string; invert?: boolean }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-slate-400">{label}</span>
        <span className={`font-bold ${metricColor(value, invert)}`}>{value}{unit}</span>
      </div>
      <div className="h-1 bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${metricBar(value, invert)}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}

interface ActionCardProps {
  id: string
  icon: string
  title: string
  subtitle: string
  preview: React.ReactNode
  children: React.ReactNode
  isExpanded: boolean
  onToggle: () => void
}

function ActionCard({ icon, title, subtitle, preview, children, isExpanded, onToggle }: ActionCardProps) {
  return (
    <div className={`rounded-2xl border transition-all ${
      isExpanded
        ? 'bg-slate-800 border-violet-500/50 lg:absolute lg:inset-x-0 lg:top-0 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:shadow-2xl lg:shadow-violet-900/40 z-40'
        : 'bg-slate-800/50 border-slate-700/60 hover:border-slate-600 cursor-pointer'
    }`}>
      <button onClick={onToggle} className="w-full text-left p-5 lg:sticky lg:top-0 lg:bg-slate-800 lg:z-10 lg:rounded-t-2xl">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{icon}</span>
              <h3 className="text-white font-bold">{title}</h3>
            </div>
            <p className="text-slate-500 text-xs">{subtitle}</p>
          </div>
          {isExpanded ? (
            <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
        {!isExpanded && preview}
      </button>
      {isExpanded && (
        <div className="px-5 pb-5">
          {children}
        </div>
      )}
    </div>
  )
}


function SoruBlok({ soru, index, value, onChange }: { soru: AnketSoru; index: number; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs text-slate-500">{index + 1}/{HASTA_ANKET_SORULARI.length}</span>
        <span className="text-lg">{soru.emoji}</span>
        <span className="text-white text-sm font-semibold">{soru.label}</span>
      </div>
      <p className="text-slate-400 text-xs mb-3">{soru.desc}</p>
      <input
        type="range"
        min={soru.min ?? 0}
        max={soru.max ?? 20}
        value={value ?? 10}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-violet-500"
      />
      <div className="flex justify-between text-[10px] text-slate-500 mt-1">
        <span>{soru.low}</span>
        <span className={`font-bold text-sm ${value !== undefined ? 'text-violet-400' : 'text-slate-600'}`}>
          {value ?? '—'}
        </span>
        <span>{soru.high}</span>
      </div>
    </div>
  )
}
