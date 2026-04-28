'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import ScoreBar from '@/components/ScoreBar'
import { HASTA_ANKET_SORULARI, hastaAnketPuani } from '@/lib/anket-sorular'
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
    eaDetails?: { rawScore?: number; ageFactor?: number; explanation?: string }
    usedFallback?: boolean
  } | null
  created_at: string
}

interface Clinic {
  id: string
  name: string
  location: string | null
  specialties: string[] | null
  clinic_type: string | null
}

interface Product {
  id: string
  slug: string | null
  name: string
  category: string | null
  final_score: number | null
  images: string[] | null
  price: number | null
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
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Skor merkezi yükleniyor…</p>
        </div>
      </main>
    }>
      <SkorMerkeziInner />
    </Suspense>
  )
}

function SkorMerkeziInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const requestedAnalysisId = searchParams.get('analysisId')
  const requestedOpen = searchParams.get('open') as ExpandedCard
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading]       = useState(true)
  const [analysis, setAnalysis]     = useState<Analysis | null>(null)
  const [birthYear, setBirthYear]   = useState<number | null>(null)
  const [expanded, setExpanded]     = useState<ExpandedCard>(null)

  // Anket state
  const [anketCevap, setAnketCevap] = useState<Record<string, number>>({})
  const [anketSubmitting, setAnketSubmitting] = useState(false)
  const [anketIdx, setAnketIdx] = useState(-1)  // -1 = intro, 0+ = sorular

  // Hızlı randevu: bir klinik seçilince RandevuFlow'u o klinikle başlat
  const [hizliKlinikId, setHizliKlinikId] = useState<string | null>(null)

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

      // Analiz sorgusu: id verilmişse onu, yoksa en son analiz
      const analysisQuery = requestedAnalysisId
        ? supabase
            .from('analyses')
            .select('id, web_overall, web_scores, web_ai_raw, created_at')
            .eq('id', requestedAnalysisId)
            .eq('user_id', user.id)
            .maybeSingle()
        : supabase
            .from('analyses')
            .select('id, web_overall, web_scores, web_ai_raw, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

      // Paralel fetch
      const [analysisRes, profileRes, clinicsRes, productsRes] = await Promise.all([
        analysisQuery,
        supabase
          .from('profiles')
          .select('birth_year')
          .eq('id', user.id)
          .single(),
        supabase
          .from('clinics')
          .select('id, name, location, specialties, clinic_type')
          .eq('approval_status', 'approved')
          .eq('is_active', true)
          .limit(20),
        supabase
          .from('products')
          .select('id, slug, name, category, final_score, images, price')
          .eq('status', 'active')
          .order('final_score', { ascending: false, nullsFirst: false })
          .limit(8),
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
      // ?open=anket|randevu|urun query param'ı varsa kart aç
      if (requestedOpen === 'anket' || requestedOpen === 'randevu' || requestedOpen === 'urun') {
        setExpanded(requestedOpen)
      }
      setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [supabase, router, requestedAnalysisId, requestedOpen])

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-8 relative">
        {/* Backdrop — açık kartı tıklayarak kapamak için (tam ekran) */}
        {expanded && (
          <button
            type="button"
            aria-label="Kartı kapat"
            onClick={() => setExpanded(null)}
            className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-40"
          />
        )}

        {/* ─── Yan yana: Sol Skor (sticky) | Sağ Kartlar ─────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 relative">

          {/* ───── SOL — Skor + Biyo. Yaş + Metrikler (sticky) ─────── */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700/60">
              <ScoreBar
                score={liveScore}
                previousScore={isUpdating ? baseScore : undefined}
                phase="ai_analiz"
                animated
                aiActive={analysis?.web_ai_raw?.usedFallback === false}
              />
              {isUpdating && (
                <div className="mt-3 text-center">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300 text-sm font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                    Skorunuz güncelleniyor… (+{tahminiSkorBonusu.toFixed(1)} puan)
                  </span>
                </div>
              )}

              {/* Biyolojik Yaş — tek satır */}
              {gercekYas !== null && (
                <div className="mt-5 pt-5 border-t border-slate-700 flex items-center justify-center gap-3 flex-wrap">
                  <span className="text-xl">🧬</span>
                  <span className="text-slate-400 text-base">Gerçek yaş</span>
                  <span className="text-white text-2xl font-bold">{gercekYas}</span>
                  <span className="text-slate-600 text-lg">→</span>
                  <span className="text-slate-400 text-base">Görünüm</span>
                  <span className={`text-2xl font-bold ${yasFarki && yasFarki > 0 ? 'text-emerald-400' : yasFarki && yasFarki < 0 ? 'text-amber-400' : 'text-white'}`}>
                    {gorunumYas}
                  </span>
                  {yasFarki !== null && yasFarki !== 0 && (
                    <span className={`text-base font-semibold ${yasFarki > 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      · {yasFarki > 0 ? `${yasFarki} yıl genç ✨` : `${Math.abs(yasFarki)} yıl yaşlı`}
                    </span>
                  )}
                </div>
              )}

              {/* Metrikler — 4 kolon yatay, büyük punto */}
              <div className="mt-5 pt-5 border-t border-slate-700 grid grid-cols-2 sm:grid-cols-4 gap-3">
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

          {/* ───── SAĞ — 3 Dikey Aksiyon Kartı ───────────────────────── */}
          <div className="flex flex-col gap-4 lg:h-full">

          {/* ANKET KARTI — Wizard */}
          <ActionCard
            id="anket"
            icon="📋"
            title="Longevity Anketi"
            subtitle="+10 puan kazanabilirsin"
            isExpanded={expanded === 'anket'}
            onToggle={() => {
              setExpanded(expanded === 'anket' ? null : 'anket')
              setAnketIdx(-1) // intro'dan başla
            }}
            preview={
              <div className="relative">
                <p className="text-slate-300 text-sm mb-2">{HASTA_ANKET_SORULARI[0].emoji} {HASTA_ANKET_SORULARI[0].label}</p>
                <p className="text-slate-500 text-xs blur-sm select-none">
                  {HASTA_ANKET_SORULARI.slice(1, 3).map(s => s.label).join(' · ')}
                </p>
              </div>
            }
          >
            <AnketWizard
              currentIdx={anketIdx}
              onPrev={() => setAnketIdx(Math.max(-1, anketIdx - 1))}
              onNext={() => setAnketIdx(Math.min(HASTA_ANKET_SORULARI.length - 1, anketIdx + 1))}
              cevap={anketCevap}
              setCevap={setCevap}
              onSubmit={submitAnket}
              submitting={anketSubmitting}
              tahminiBonus={tahminiSkorBonusu}
            />
          </ActionCard>

          {/* RANDEVU KARTI — Hızlı Vitrin */}
          <ActionCard
            id="randevu"
            icon="📅"
            title="Hızlı Randevu Al"
            subtitle="Sana özel klinik önerileri"
            isExpanded={expanded === 'randevu'}
            onToggle={() => {
              setExpanded(expanded === 'randevu' ? null : 'randevu')
              setHizliKlinikId(null)
            }}
            preview={
              <div className="grid grid-cols-2 gap-2">
                {clinics.slice(0, 4).map(c => (
                  <div key={c.id} className="p-2 rounded-lg bg-slate-900/50 border border-slate-700 text-center">
                    <p className="text-white text-[11px] font-semibold truncate">{c.name}</p>
                    {c.location && <p className="text-slate-500 text-[10px] truncate">📍 {c.location}</p>}
                  </div>
                ))}
              </div>
            }
          >
            {hizliKlinikId ? (
              <div>
                <button
                  onClick={() => setHizliKlinikId(null)}
                  className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-4 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                  Tüm klinikler
                </button>
                <RandevuFlow
                  embedded
                  preselectedClinicId={hizliKlinikId}
                  onSuccess={() => { setExpanded(null); setHizliKlinikId(null) }}
                />
              </div>
            ) : (
              <div>
                <h2 className="text-white text-xl font-bold mb-1">Klinik Seç</h2>
                <p className="text-slate-400 text-sm mb-4">Tıkladığında gün ve saat seçimi açılır</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {clinics.slice(0, 8).map(c => (
                    <button
                      key={c.id}
                      onClick={() => setHizliKlinikId(c.id)}
                      className="text-left p-4 rounded-xl bg-slate-900/50 border border-slate-700 hover:border-violet-500/50 hover:scale-[1.02] transition-all"
                    >
                      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <p className="text-white text-sm font-bold leading-tight mb-1 line-clamp-2">{c.name}</p>
                      {c.location && <p className="text-slate-500 text-[11px] truncate">📍 {c.location}</p>}
                      {c.specialties && c.specialties.length > 0 && (
                        <p className="text-violet-400 text-[10px] mt-1 truncate">{c.specialties.slice(0, 2).join(' · ')}</p>
                      )}
                    </button>
                  ))}
                </div>
                <Link
                  href="/randevu"
                  className="group flex items-center gap-4 w-full mt-6 p-4 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-violet-500/50 hover:bg-slate-900 transition-all"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-base sm:text-lg leading-tight">
                      Başka bir klinik arıyorum
                    </p>
                    <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                      Branş, konum, tedavi türüne göre filtrele
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}
          </ActionCard>

          {/* ÜRÜN KARTI — Hızlı Vitrin */}
          <ActionCard
            id="urun"
            icon="🛍️"
            title="Hızlı Ürün Al"
            subtitle="Skoruna göre seçildi"
            isExpanded={expanded === 'urun'}
            onToggle={() => setExpanded(expanded === 'urun' ? null : 'urun')}
            preview={
              <div className="grid grid-cols-4 gap-1.5">
                {products.slice(0, 4).map(p => (
                  <div key={p.id} className="aspect-square rounded-lg bg-slate-800 overflow-hidden">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600 text-xl">📦</div>
                    )}
                  </div>
                ))}
              </div>
            }
          >
            <div>
              <h2 className="text-white text-xl font-bold mb-1">Önerilen Ürünler</h2>
              <p className="text-slate-400 text-sm mb-4">Cilt skoruna ve klinik analizine göre seçildi</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {products.slice(0, 8).map(p => (
                  <Link
                    key={p.id}
                    href={`/magaza/${p.slug ?? p.id}`}
                    className="group rounded-xl bg-slate-900/50 border border-slate-700 hover:border-violet-500/50 hover:scale-[1.02] transition-all overflow-hidden"
                  >
                    <div className="aspect-square bg-slate-800 overflow-hidden">
                      {p.images?.[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600 text-3xl">📦</div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-white text-xs font-semibold leading-tight mb-1 line-clamp-2 min-h-[2.4em]">{p.name}</p>
                      <div className="flex items-center justify-between">
                        {p.price !== null && (
                          <span className="text-white text-sm font-bold">₺{p.price.toLocaleString('tr-TR')}</span>
                        )}
                        {p.final_score && (
                          <span className="text-violet-400 text-[10px] font-semibold">EGP {p.final_score.toFixed(1)}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/magaza"
                className="group flex items-center gap-4 w-full mt-6 p-4 rounded-2xl bg-slate-900/50 border border-slate-700 hover:border-violet-500/50 hover:bg-slate-900 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base sm:text-lg leading-tight">
                    Mağazaya göz atmak istiyorum
                  </p>
                  <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
                    Kategori, marka ve EGP skoruna göre keşfet
                  </p>
                </div>
                <svg className="w-5 h-5 text-slate-500 group-hover:text-violet-400 group-hover:translate-x-1 transition-all shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
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
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className={`text-xl font-bold mb-1.5 ${metricColor(value, invert)}`}>
        {value}<span className="text-slate-500 text-sm font-normal ml-0.5">{unit}</span>
      </p>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
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
  // ── Açık (tam ekran modal) ────────────────────────────────────────────
  if (isExpanded) {
    return (
      <div
        className="fixed inset-x-2 inset-y-4 sm:inset-x-4 sm:inset-y-8 lg:inset-y-12 lg:left-1/2 lg:-translate-x-1/2 lg:w-full lg:max-w-2xl rounded-3xl border border-violet-500/50 bg-slate-800 shadow-2xl shadow-violet-900/40 z-50 flex flex-col overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal başlık — sticky */}
        <div className="flex items-start justify-between p-5 border-b border-slate-700 bg-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{icon}</span>
              <h3 className="text-white font-bold text-lg">{title}</h3>
            </div>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
          <button onClick={onToggle} aria-label="Kapat" className="text-slate-400 hover:text-white p-1 -m-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {/* Modal içerik — gerekirse kaydırılır, ama tam ekranda olduğu için genelde sığar */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
      </div>
    )
  }

  // ── Kapalı (yan kart önizleme) ────────────────────────────────────────
  return (
    <div className="rounded-2xl border bg-slate-800/50 border-slate-700/60 hover:border-slate-600 cursor-pointer lg:flex-1 lg:min-h-0 transition-all flex flex-col">
      <button onClick={onToggle} className="w-full text-left p-5 flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">{icon}</span>
              <h3 className="text-white font-bold text-lg">{title}</h3>
            </div>
            <p className="text-slate-400 text-sm">{subtitle}</p>
          </div>
          <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex-1 flex items-center">{preview}</div>
      </button>
    </div>
  )
}


interface AnketWizardProps {
  currentIdx: number
  onPrev: () => void
  onNext: () => void
  cevap: Record<string, number>
  setCevap: (key: string, value: number) => void
  onSubmit: () => void
  submitting: boolean
  tahminiBonus: number
}

function AnketWizard({ currentIdx, onPrev, onNext, cevap, setCevap, onSubmit, submitting, tahminiBonus }: AnketWizardProps) {
  const total = HASTA_ANKET_SORULARI.length

  // ── Intro Ekranı (currentIdx === -1) ────────────────────────────────────
  if (currentIdx === -1) {
    return (
      <div className="py-2 space-y-5">
        {/* Başlık */}
        <div className="text-center space-y-1">
          <p className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-3">Longevity Başarı Analizi</p>
          <p className="text-slate-400 text-sm">(Sağlıklı Yaşam Analizi)</p>
          <h2 className="text-2xl font-black text-white mt-2 leading-snug">
            Biyolojik Sermayenizi<br />Ne Kadar Korudunuz?
          </h2>
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
          onClick={onNext}
          className="w-full py-4 rounded-2xl font-black text-white text-base transition-all hover:opacity-90 hover:scale-[1.01] bg-gradient-to-r from-violet-600 to-purple-600">
          Analize Başla →
        </button>
      </div>
    )
  }

  // ── Soru Ekranları (currentIdx 0..4) ────────────────────────────────────
  const soru = HASTA_ANKET_SORULARI[currentIdx]
  const value = cevap[soru.key]
  const isLast = currentIdx === total - 1
  const allAnswered = HASTA_ANKET_SORULARI.every(s => typeof cevap[s.key] === 'number')
  const progress = ((currentIdx + (value !== undefined ? 1 : 0)) / total) * 100

  return (
    <div className="py-2">
      {/* Progress bar */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-slate-300 text-sm font-semibold">Soru {currentIdx + 1} / {total}</span>
          <span className="text-violet-400 text-sm font-bold">+{tahminiBonus.toFixed(1)} puan</span>
        </div>
        <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Soru başlığı */}
      <div className="text-center mb-5">
        <div className="text-5xl mb-2">{soru.emoji}</div>
        <h2 className="text-white text-2xl font-bold mb-1">{soru.label}</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">{soru.desc}</p>
      </div>

      {/* Slider */}
      <div className="max-w-xl mx-auto mb-5 px-2">
        <div className="text-center mb-3">
          <span className={`text-4xl font-black ${value !== undefined ? 'text-violet-400' : 'text-slate-600'}`}>
            {value ?? '—'}
          </span>
          <span className="text-slate-500 text-base ml-2">/ {soru.max ?? 20}</span>
        </div>
        <input
          type="range"
          min={soru.min ?? 0}
          max={soru.max ?? 20}
          value={value ?? Math.floor(((soru.max ?? 20) + (soru.min ?? 0)) / 2)}
          onChange={e => setCevap(soru.key, parseInt(e.target.value))}
          className="w-full h-3 accent-violet-500 cursor-pointer"
        />
        <div className="flex justify-between mt-2 text-sm">
          <span className="text-slate-400">{soru.low}</span>
          <span className="text-slate-400">{soru.high}</span>
        </div>
      </div>

      {/* Navigasyon */}
      <div className="max-w-xl mx-auto flex items-center gap-3">
        <button
          onClick={onPrev}
          disabled={currentIdx === 0}
          className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed border border-slate-700 text-slate-300 font-semibold rounded-xl transition-colors"
        >
          ← Geri
        </button>
        {isLast ? (
          <button
            onClick={onSubmit}
            disabled={submitting || !allAnswered}
            className="flex-[2] py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all"
          >
            {submitting ? 'Kaydediliyor…' : `Anketi Tamamla · +${tahminiBonus.toFixed(1)} puan`}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={value === undefined}
            className="flex-[2] py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all"
          >
            İleri →
          </button>
        )}
      </div>

      {/* Soru noktaları (mini progress) */}
      <div className="flex items-center justify-center gap-1.5 mt-4">
        {HASTA_ANKET_SORULARI.map((s, i) => (
          <div
            key={s.key}
            className={`h-2 rounded-full transition-all ${
              i === currentIdx
                ? 'bg-violet-400 w-6'
                : cevap[s.key] !== undefined
                  ? 'bg-emerald-500 w-2'
                  : 'bg-slate-700 w-2'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
