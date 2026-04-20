export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ vendorId: string }> }): Promise<Metadata> {
  const { vendorId } = await params
  const supabase = await createClient()
  const { data: vendor } = await supabase
    .from('vendors')
    .select('company_name')
    .eq('id', vendorId)
    .single()
  return {
    title: vendor?.company_name ? `${vendor.company_name} — Estelongy Mağaza` : 'Satıcı',
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  botox:'Botoks', filler:'Dolgu', mezo:'Mezoterapi', laser:'Lazer',
  gold_needle:'Altın İğne', peeling:'Peeling', serum:'Serum',
  supplement:'Takviye', device:'Cihaz', other:'Diğer',
}

export default async function SaticiMagazaPage({ params }: { params: Promise<{ vendorId: string }> }) {
  const { vendorId } = await params
  const supabase = await createClient()

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
    .eq('id', vendorId)
    .eq('approval_status', 'approved')
    .single()

  if (!vendor) notFound()

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug, description, category, price, final_score, preference_count, treatment_type, images')
    .eq('vendor_id', vendor.id)
    .eq('is_active', true)
    .eq('approval_status', 'approved')
    .order('final_score', { ascending: false })

  const totalProducts = products?.length ?? 0
  const avgScore = products && products.length > 0
    ? products.reduce((s, p) => s + Number(p.final_score ?? 0), 0) / products.length
    : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/magaza" className="text-slate-400 hover:text-white transition-colors text-sm">← Mağaza</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold truncate">{vendor.company_name}</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        {/* Mağaza başlık */}
        <div className="mb-10 p-8 rounded-3xl bg-gradient-to-br from-violet-600/10 via-purple-600/5 to-transparent border border-violet-500/20">
          <div className="flex items-start gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-white mb-1">{vendor.company_name}</h1>
              <p className="text-slate-400 text-sm mb-4">Estelongy Onaylı Satıcı</p>

              <div className="flex flex-wrap gap-6 text-sm">
                <div>
                  <p className="text-slate-500 text-xs">Ürün Sayısı</p>
                  <p className="text-white font-black text-xl">{totalProducts}</p>
                </div>
                {avgScore !== null && (
                  <div>
                    <p className="text-slate-500 text-xs">Ortalama Puan</p>
                    <p className={`font-black text-xl ${
                      avgScore >= 9 ? 'text-emerald-400' : avgScore >= 7 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {avgScore.toFixed(1)}<span className="text-slate-500 text-sm font-normal">/10</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Ürünler */}
        {products && products.length > 0 ? (
          <>
            <h2 className="text-white font-bold text-lg mb-4">Ürünler ({totalProducts})</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {products.map(p => (
                <Link key={p.id} href={`/magaza/${p.slug ?? p.id}`}
                  className="group bg-slate-800/50 border border-slate-700 hover:border-violet-500/50 rounded-2xl overflow-hidden transition-all">
                  <div className="h-44 bg-slate-900 flex items-center justify-center relative">
                    {p.images?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-700 text-5xl">✦</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-bold text-sm group-hover:text-violet-300 transition-colors line-clamp-1">{p.name}</h3>
                    {p.category && (
                      <p className="text-slate-500 text-xs mt-1">{CATEGORY_LABELS[p.category] ?? p.category}</p>
                    )}
                    <div className="flex items-end justify-between mt-3">
                      {p.price && (
                        <span className="text-white font-black">₺{Number(p.price).toLocaleString('tr-TR')}</span>
                      )}
                      {p.final_score && (
                        <span className={`font-bold text-sm ${
                          p.final_score >= 9 ? 'text-emerald-400' :
                          p.final_score >= 7 ? 'text-amber-400' : 'text-red-400'
                        }`}>★ {Number(p.final_score).toFixed(1)}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-slate-600">
            <div className="text-5xl mb-4">📦</div>
            <p>Bu mağazada henüz aktif ürün yok</p>
          </div>
        )}
      </div>
    </main>
  )
}
