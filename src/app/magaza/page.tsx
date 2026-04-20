export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import SiralamaSelect from './SiralamaSelect'
import CartButton from '@/components/CartButton'
import AramaBar from './AramaBar'

export const metadata: Metadata = { title: 'Mağaza — Estelongy' }

const CATEGORY_LABELS: Record<string, string> = {
  botox:        'Botoks',
  filler:       'Dolgu',
  mezo:         'Mezoterapi',
  laser:        'Lazer',
  gold_needle:  'Altın İğne',
  peeling:      'Peeling',
  serum:        'Serum',
  supplement:   'Takviye',
  device:       'Cihaz',
  other:        'Diğer',
}

function ScoreBadge({ score }: { score: number | null }) {
  if (!score) return <span className="text-slate-600 text-xs">—</span>
  const color = score >= 9 ? 'text-emerald-400' : score >= 7 ? 'text-amber-400' : 'text-red-400'
  return <span className={`font-black text-lg ${color}`}>{score.toFixed(1)}<span className="text-slate-500 text-xs font-normal">/10</span></span>
}

export default async function MagazaPage({
  searchParams,
}: {
  searchParams: Promise<{ kategori?: string; siralama?: string; q?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('products')
    .select('id, name, slug, description, category, price, final_score, doctor_score, user_score, preference_count, treatment_type, images')
    .eq('is_active', true)
    .eq('approval_status', 'approved')

  if (params.kategori) query = query.eq('category', params.kategori)
  if (params.q && params.q.trim()) {
    const term = params.q.trim().replace(/[%_]/g, '') // sql wildcard sanitize
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  }

  if (params.siralama === 'puan') query = query.order('final_score', { ascending: false })
  else if (params.siralama === 'fiyat_asc') query = query.order('price', { ascending: true })
  else if (params.siralama === 'fiyat_desc') query = query.order('price', { ascending: false })
  else if (params.siralama === 'tercih') query = query.order('preference_count', { ascending: false })
  else query = query.order('final_score', { ascending: false })

  const { data: products } = await query.limit(50)

  const categories = Object.entries(CATEGORY_LABELS)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="text-white font-black text-lg tracking-tight">ESTELONGY</Link>
          <nav className="flex items-center gap-2 text-sm">
            <Link href="/analiz" className="hidden sm:inline text-slate-400 hover:text-white transition-colors px-3 py-2">Analiz</Link>
            <Link href="/randevu" className="hidden sm:inline text-slate-400 hover:text-white transition-colors px-3 py-2">Randevu</Link>
            <Link href="/panel" className="hidden sm:inline text-slate-400 hover:text-white transition-colors px-3 py-2">Panelim</Link>
            <CartButton />
          </nav>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-6">
          <h1 className="text-3xl font-black text-white">Estelongy Mağazası</h1>
          <p className="text-slate-400 mt-1 text-sm">Bilimsel ve uzman onaylı estetik ürün & işlemler</p>
        </div>

        {/* Arama */}
        <div className="mb-5">
          <AramaBar />
        </div>

        {params.q && (
          <div className="mb-4 text-sm">
            <span className="text-slate-500">Aranan:</span>{' '}
            <span className="text-white font-medium">&ldquo;{params.q}&rdquo;</span>
          </div>
        )}

        {/* Filtreler */}
        <div className="flex flex-wrap gap-3 mb-8">
          <div className="flex flex-wrap gap-2">
            <Link href="/magaza"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${!params.kategori ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
              Tümü
            </Link>
            {categories.map(([key, label]) => (
              <Link key={key} href={`/magaza?kategori=${key}${params.siralama ? `&siralama=${params.siralama}` : ''}`}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${params.kategori === key ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'}`}>
                {label}
              </Link>
            ))}
          </div>

          <div className="ml-auto">
            <SiralamaSelect current={params.siralama} />
          </div>
        </div>

        {/* Ürün Grid */}
        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(product => (
              <Link key={product.id} href={`/magaza/${product.slug ?? product.id}`}
                className="group bg-slate-800/50 border border-slate-700 hover:border-violet-500/50 rounded-2xl overflow-hidden transition-all hover:shadow-lg hover:shadow-violet-500/10">

                {/* Görsel alanı */}
                <div className="h-48 bg-slate-900 flex items-center justify-center relative">
                  {product.images?.[0] ? (
                    <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-slate-700 text-5xl">✦</div>
                  )}
                  {product.treatment_type === 'treatment' && (
                    <span className="absolute top-3 left-3 bg-violet-600/90 text-white text-xs font-bold px-2 py-1 rounded-lg">
                      KLİNİK İŞLEM
                    </span>
                  )}
                  <div className="absolute top-3 right-3 bg-slate-900/90 backdrop-blur-sm rounded-xl px-3 py-1.5 text-center">
                    <ScoreBadge score={product.final_score} />
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-white font-bold text-base group-hover:text-violet-300 transition-colors">{product.name}</h3>
                    {product.category && (
                      <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-lg shrink-0">
                        {CATEGORY_LABELS[product.category] ?? product.category}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="text-slate-400 text-sm line-clamp-2 mb-4">{product.description}</p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {product.doctor_score && (
                        <span>🩺 {product.doctor_score.toFixed(1)}</span>
                      )}
                      {product.user_score && (
                        <span>⭐ {product.user_score.toFixed(1)}</span>
                      )}
                      {product.preference_count && product.preference_count > 0 && (
                        <span>🔥 {product.preference_count} tercih</span>
                      )}
                    </div>
                    {product.price && (
                      <span className="text-white font-bold">₺{Number(product.price).toLocaleString('tr-TR')}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="text-slate-700 text-6xl mb-4">🛍️</div>
            <p className="text-slate-500 text-lg font-medium">Henüz ürün eklenmemiş</p>
            <p className="text-slate-600 text-sm mt-2">Yakında burada olacak</p>
          </div>
        )}
      </div>
    </main>
  )
}
