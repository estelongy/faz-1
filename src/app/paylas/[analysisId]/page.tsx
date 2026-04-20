import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

interface ScoreCard {
  score: number
  first_name: string
  clinic_name: string
  completed_at: string
}

async function loadCard(analysisId: string): Promise<ScoreCard | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_public_score_card', { p_analysis_id: analysisId })
  if (error || !data || (Array.isArray(data) && data.length === 0)) return null
  return Array.isArray(data) ? data[0] : data
}

function zoneFromScore(s: number): { name: string; color: string; label: string } {
  if (s >= 90) return { name: 'Premium', color: '#00d4ff', label: 'Çok iyi' }
  if (s >= 75) return { name: 'Genç',    color: '#22c55e', label: 'Yaşından genç' }
  if (s >= 50) return { name: 'Normal',  color: '#f59e0b', label: 'Yaşında' }
  return          { name: 'Kritik',      color: '#ef4444', label: 'Yaşından yaşlı' }
}

export async function generateMetadata(
  { params }: { params: Promise<{ analysisId: string }> }
): Promise<Metadata> {
  const { analysisId } = await params
  const card = await loadCard(analysisId)
  if (!card) {
    return { title: 'Paylaşım Bulunamadı | Estelongy' }
  }
  const zone = zoneFromScore(card.score)
  const title = `${card.first_name} — Klinik Onaylı EGS: ${card.score}`
  const description = `${card.first_name} ${zone.name} seviyede (${card.score}/100) — ${card.clinic_name} onaylı. Sen de ücretsiz öğren.`
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url: `/paylas/${analysisId}`,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  }
}

export default async function SharePage(
  { params }: { params: Promise<{ analysisId: string }> }
) {
  const { analysisId } = await params
  const card = await loadCard(analysisId)
  if (!card) notFound()

  const zone = zoneFromScore(card.score)
  const dateStr = new Date(card.completed_at).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <Link href="/" className="absolute top-6 left-6 flex items-center gap-2 hover:opacity-80 transition-opacity">
        <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <span className="text-white font-bold text-lg">Estelongy</span>
      </Link>

      {/* Kart */}
      <div
        className="relative w-full max-w-md rounded-3xl border-2 p-8 text-center shadow-2xl"
        style={{
          borderColor: `${zone.color}40`,
          background: `linear-gradient(135deg, #1e1b4b 0%, #0f172a 50%, ${zone.color}15 100%)`,
          boxShadow: `0 0 80px ${zone.color}20`,
        }}
      >
        {/* Klinik onaylı damga */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-xs font-black rounded-full shadow-lg whitespace-nowrap">
          ✦ KLİNİK ONAYLI ✦
        </div>

        {/* Hasta adı */}
        <p className="text-slate-400 text-sm mt-4 mb-1">Tebrikler</p>
        <h1 className="text-3xl font-black text-white mb-6">{card.first_name}</h1>

        {/* Skor */}
        <div className="mb-6">
          <p className="text-slate-500 text-xs mb-2 uppercase tracking-wider">Gençlik Skoru</p>
          <p
            className="text-8xl font-black leading-none"
            style={{ color: zone.color, textShadow: `0 0 40px ${zone.color}60` }}
          >
            {card.score}
          </p>
          <p className="text-slate-400 text-sm mt-1">/ 100</p>
        </div>

        {/* Renk bölgesi */}
        <div
          className="inline-block px-4 py-2 rounded-full mb-6 border"
          style={{ background: `${zone.color}15`, borderColor: `${zone.color}40`, color: zone.color }}
        >
          <span className="font-bold text-base">{zone.name}</span>
          <span className="text-xs ml-2 opacity-80">— {zone.label}</span>
        </div>

        {/* Alt bilgi */}
        <div className="pt-5 border-t border-slate-700/50 text-xs text-slate-500 space-y-1">
          <p>{card.clinic_name}</p>
          <p>{dateStr}</p>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center max-w-md">
        <h2 className="text-2xl font-bold text-white mb-3">Senin skorun ne?</h2>
        <p className="text-slate-400 mb-6 text-sm">
          <strong>Ücretsiz</strong> ön analizle başla, klinik onayıyla kesin Gençlik Skoruna ulaş.
        </p>
        <Link
          href="/kayit?next=/analiz"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Ücretsiz Analiz Başlat
        </Link>
        <p className="text-slate-600 text-xs mt-4">30 saniye · Selfie yeterli</p>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-slate-600 text-xs">
        <Link href="/" className="hover:text-slate-400 transition-colors">estelongy.com</Link>
      </div>
    </main>
  )
}
