export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ReviewForm from './ReviewForm'

export const metadata: Metadata = { title: 'Ürün Detayı — Estelongy' }

const CATEGORY_LABELS: Record<string, string> = {
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
}

function PuanBar({ label, value }: { label: string; value: number | null }) {
  if (!value) return null
  const pct = (value / 10) * 100
  const color = value >= 9 ? 'bg-emerald-500' : value >= 7 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <div className="flex items-center gap-3">
      <span className="text-slate-400 text-xs w-32 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white font-bold text-sm w-8 text-right">{value.toFixed(1)}</span>
    </div>
  )
}

export default async function UrunDetayPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Slug veya ID ile bul
  const { data: product } = await supabase
    .from('products')
    .select('*, vendors(company_name)')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq('is_active', true)
    .single()

  if (!product) notFound()

  // Yorumlar
  const { data: reviews } = await supabase
    .from('reviews')
    .select('id, rating, title, body, is_verified, created_at, user_id, profiles(full_name)')
    .eq('product_id', product.id)
    .order('created_at', { ascending: false })
    .limit(20)

  // Kullanıcı daha önce yorum yaptı mı?
  const userReview = reviews?.find(r => r.user_id === user?.id)

  const avgUserScore = reviews && reviews.length > 0
    ? reviews.reduce((s, r) => s + Number(r.rating), 0) / reviews.length
    : null

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/magaza" className="text-slate-400 hover:text-white transition-colors text-sm">← Mağaza</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-medium truncate">{product.name}</span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Sol: Görsel + Puan */}
          <div>
            <div className="rounded-2xl overflow-hidden bg-slate-900 h-72 flex items-center justify-center mb-6">
              {product.images?.[0] ? (
                <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <div className="text-slate-700 text-8xl">✦</div>
              )}
            </div>

            {/* Estelongy Puanı */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Estelongy Puanı</p>
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black ${
                      (product.final_score ?? 0) >= 9 ? 'text-emerald-400' :
                      (product.final_score ?? 0) >= 7 ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {product.final_score ? product.final_score.toFixed(1) : '—'}
                    </span>
                    <span className="text-slate-500 text-lg mb-1">/10</span>
                  </div>
                </div>
                {product.preference_count > 0 && (
                  <div className="text-right">
                    <p className="text-slate-400 text-xs">Tercih</p>
                    <p className="text-white font-bold text-2xl">{product.preference_count}</p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <PuanBar label="Hekim Değerlendirmesi" value={product.doctor_score} />
                <PuanBar label="Kullanıcı Puanı" value={avgUserScore ?? product.user_score} />
                <PuanBar label="Bilimsel Belge" value={product.scientific_score} />
                <PuanBar label="Üretici/Marka" value={product.manufacturer_score} />
              </div>
            </div>
          </div>

          {/* Sağ: Detaylar */}
          <div>
            {product.category && (
              <span className="text-xs text-violet-400 font-medium uppercase tracking-widest">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
            )}
            <h1 className="text-3xl font-black text-white mt-2 mb-3">{product.name}</h1>

            {product.vendors?.company_name && (
              <p className="text-slate-500 text-sm mb-4">Satıcı: <span className="text-slate-300">{product.vendors.company_name}</span></p>
            )}

            {product.description && (
              <p className="text-slate-300 leading-relaxed mb-6">{product.description}</p>
            )}

            {product.ingredients?.length > 0 && (
              <div className="mb-6">
                <p className="text-slate-400 text-sm font-medium mb-2">İçerikler / Bileşenler</p>
                <div className="flex flex-wrap gap-2">
                  {product.ingredients.map((ing: string) => (
                    <span key={ing} className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {product.price && (
              <div className="flex items-center justify-between p-5 bg-slate-800/50 border border-slate-700 rounded-2xl mb-4">
                <span className="text-slate-400">Fiyat</span>
                <span className="text-white font-black text-2xl">₺{Number(product.price).toLocaleString('tr-TR')}</span>
              </div>
            )}

            <Link href="/randevu"
              className="w-full flex items-center justify-center py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all text-sm">
              Bu İşlem İçin Randevu Al →
            </Link>
          </div>
        </div>

        {/* Deneyim Paylaşımları */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-white font-bold text-xl">
              Deneyimler <span className="text-slate-500 font-normal text-base">({reviews?.length ?? 0})</span>
            </h2>
            {avgUserScore && (
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-black text-2xl">{avgUserScore.toFixed(1)}</span>
                <span className="text-slate-500 text-sm">/10 ortalama</span>
              </div>
            )}
          </div>

          {/* Yorum Formu */}
          {user && !userReview && (
            <ReviewForm productId={product.id} />
          )}
          {!user && (
            <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl mb-6 text-center">
              <p className="text-slate-400 text-sm">
                Deneyimini paylaşmak için{' '}
                <Link href="/giris" className="text-violet-400 hover:text-violet-300 font-medium">giriş yap</Link>
              </p>
            </div>
          )}

          {/* Yorumlar listesi */}
          <div className="space-y-4 mt-6">
            {reviews && reviews.length > 0 ? reviews.map(review => (
              <div key={review.id} className="p-5 bg-slate-800/50 border border-slate-700 rounded-2xl">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">
                        {(review.profiles as { full_name?: string } | null)?.full_name ?? 'Kullanıcı'}
                      </span>
                      {review.is_verified && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">Doğrulanmış</span>
                      )}
                    </div>
                    {review.title && <p className="text-slate-300 text-sm font-medium mt-1">{review.title}</p>}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-black text-lg ${
                      Number(review.rating) >= 9 ? 'text-emerald-400' :
                      Number(review.rating) >= 7 ? 'text-amber-400' : 'text-red-400'
                    }`}>{Number(review.rating).toFixed(1)}</span>
                    <span className="text-slate-600 text-xs">/10</span>
                  </div>
                </div>
                {review.body && <p className="text-slate-400 text-sm leading-relaxed">{review.body}</p>}
                <p className="text-slate-600 text-xs mt-3">
                  {new Date(review.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            )) : (
              <div className="text-center py-10 text-slate-600">
                Henüz deneyim paylaşılmamış — ilk sen paylaş!
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
