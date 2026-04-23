import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estelongy Rehberi — Estetik, Longevity ve Gençlik Skoru',
  description: 'Estetik uygulamalar, cihaz tedavileri, longevity bilimine dair kapsamlı rehberler. Estelongy Gençlik Skoru\'nu ve klinik süreçleri derinlemesine öğrenin.',
  keywords: ['estetik uygulamalar', 'longevity', 'gençlik skoru', 'cihaz tedavileri', 'botoks', 'dolgu', 'HIFU', 'anti aging'],
  openGraph: {
    title: 'Estelongy Rehberi — Estetik, Longevity ve Gençlik Skoru',
    description: 'Estetik uygulamalar, cihaz tedavileri ve longevity bilimine dair kapsamlı rehberler.',
    url: 'https://estelongy.com/rehber',
  },
  alternates: { canonical: 'https://estelongy.com/rehber' },
}

const ARTICLES = [
  {
    slug: 'estetik-cerrahi',
    category: 'Cerrahi',
    categoryColor: 'rose',
    title: 'Estetik Cerrahi İşlemleri Rehberi',
    desc: 'Rinoplasti, yüz germe, blefaroplasti, liposuction ve vücut şekillendirme — estetik cerrahi prosedürlerini, kimlere uygun olduğunu ve sürecin nasıl işlediğini öğrenin.',
    readTime: '10 dk',
    tags: ['Rinoplasti', 'Yüz Germe', 'Blefaroplasti', 'Liposuction'],
    icon: '🔬',
  },
  {
    slug: 'estetik-uygulamalar',
    category: 'Estetik',
    categoryColor: 'violet',
    title: 'Estetik Uygulamalar Rehberi',
    desc: 'Botoks, hyalüronik asit dolgu, PRP, mezoterapi ve kimyasal peeling — en yaygın estetik uygulamaları, nasıl çalıştıklarını ve ne zaman doğru seçim olduklarını öğrenin.',
    readTime: '8 dk',
    tags: ['Botoks', 'HA Dolgu', 'PRP', 'Mezoterapi'],
    icon: '💉',
  },
  {
    slug: 'cihaz-tedavileri',
    category: 'Cihaz Tedavileri',
    categoryColor: 'blue',
    title: 'Cihaz ile Yapılan Estetik Tedaviler',
    desc: 'HIFU, radyofrekans, dermapen, lazer ve kriyo uygulamaları — invaziv olmayan cihaz tedavilerinin nasıl çalıştığını, kimler için uygun olduğunu ve beklenen sonuçları inceleyin.',
    readTime: '7 dk',
    tags: ['HIFU', 'Radyofrekans', 'Dermapen', 'Lazer'],
    icon: '⚡',
  },
  {
    slug: 'longevity-nedir',
    category: 'Longevity',
    categoryColor: 'emerald',
    title: 'Longevity Nedir? Biyolojik Yaşlanmanın Bilimi',
    desc: 'Kronik yaşlanma mekanizmaları, telomer biyolojisi, serbest radikal teorisi ve günümüzde uygulanan longevity protokolleri. Yaşı yavaşlatmanın bilimsel temelleri.',
    readTime: '10 dk',
    tags: ['Biyolojik Yaş', 'Anti-Aging', 'Longevity', 'Protokol'],
    icon: '🧬',
  },
]

const colorMap: Record<string, { badge: string; dot: string; tag: string }> = {
  violet:  { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30', dot: 'bg-violet-400', tag: 'bg-violet-500/10 text-violet-400' },
  blue:    { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',       dot: 'bg-blue-400',   tag: 'bg-blue-500/10 text-blue-400' },
  emerald: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', tag: 'bg-emerald-500/10 text-emerald-400' },
  amber:   { badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',    dot: 'bg-amber-400',  tag: 'bg-amber-500/10 text-amber-400' },
  rose:    { badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',       dot: 'bg-rose-400',   tag: 'bg-rose-500/10 text-rose-400' },
}

export default function RehberPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Estelongy
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-white font-bold text-sm">Rehber</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
            Estelongy Rehberi
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Estetik & Longevity<br />Bilgi Merkezi
          </h1>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Estetik uygulamalardan longevity bilimine, cihaz tedavilerinden Gençlik Skoru metodolojisine —
            kanıta dayalı içerikler, tek platformda.
          </p>
        </div>

        {/* Makale grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          {ARTICLES.map(a => {
            const c = colorMap[a.categoryColor]
            return (
              <Link
                key={a.slug}
                href={`/rehber/${a.slug}`}
                className="group p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 hover:bg-slate-800 transition-all"
              >
                {/* Üst */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="text-3xl">{a.icon}</div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${c.badge}`}>
                      {a.category}
                    </span>
                    <span className="text-slate-600 text-xs">{a.readTime}</span>
                  </div>
                </div>

                {/* Başlık */}
                <h2 className="text-white font-black text-xl mb-2 group-hover:text-violet-300 transition-colors leading-snug">
                  {a.title}
                </h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-4">
                  {a.desc}
                </p>

                {/* Etiketler */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {a.tags.map(t => (
                    <span key={t} className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.tag}`}>
                      {t}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-1.5 text-violet-400 text-sm font-semibold group-hover:gap-2.5 transition-all">
                  <span>Okumaya devam et</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )
          })}
        </div>

        {/* CTA Bar */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-500/5 border border-violet-500/30 text-center">
          <h2 className="text-white font-black text-2xl mb-3">
            Gençlik Skorunuzu Öğrenin
          </h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
            Tüm bu içeriklerdeki bilgileri kendi cildinize uygulayın.
            Ücretsiz Ön Analiz ile başlayın, hekim onaylı sertifikaya ulaşın.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/kayit?next=/analiz"
              className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20"
            >
              Ücretsiz Ön Analiz →
            </Link>
            <Link
              href="/randevu"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-colors"
            >
              Klinik Randevusu Al
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
