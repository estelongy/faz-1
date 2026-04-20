export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import UrunEkleForm from './UrunEkleForm'

export const metadata: Metadata = { title: 'Satıcı Paneli — Estelongy' }

const CATEGORY_LABELS: Record<string, string> = {
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending:  { label: 'İncelemede', cls: 'bg-amber-500/20 text-amber-400' },
    approved: { label: 'Onaylı',     cls: 'bg-emerald-500/20 text-emerald-400' },
    rejected: { label: 'Reddedildi', cls: 'bg-red-500/20 text-red-400' },
  }
  const s = map[status] ?? { label: status, cls: 'bg-slate-700 text-slate-400' }
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>{s.label}</span>
}

async function handleSignOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/giris')
}

export default async function SaticiPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  // Satıcı kaydını bul
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, stripe_account_id, stripe_charges_enabled')
    .eq('user_id', user.id)
    .single()

  if (!vendor) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🏪</div>
          <h1 className="text-white font-bold text-xl mb-2">Satıcı Hesabı Bulunamadı</h1>
          <p className="text-slate-400 text-sm mb-6">Ürün eklemek için önce satıcı başvurusu yapmanız gerekiyor.</p>
          <Link href="/satici/basvur"
            className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl text-sm">
            Satıcı Başvurusu Yap →
          </Link>
        </div>
      </main>
    )
  }

  if (vendor.approval_status === 'pending') {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⏳</div>
          <h1 className="text-white font-bold text-xl mb-2">Başvurunuz İnceleniyor</h1>
          <p className="text-slate-400 text-sm">Başvurunuz admin tarafından incelendikten sonra panele erişebileceksiniz.</p>
        </div>
      </main>
    )
  }

  if (vendor.approval_status !== 'approved') {
    notFound()
  }

  // Ürünleri getir
  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, price, stock, final_score, approval_status, treatment_type, is_active, images, created_at')
    .eq('vendor_id', vendor.id)
    .order('created_at', { ascending: false })

  const totalProducts = products?.length ?? 0
  const approvedCount = products?.filter(p => p.approval_status === 'approved').length ?? 0
  const pendingCount  = products?.filter(p => p.approval_status === 'pending').length ?? 0

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white font-black text-lg tracking-tight">ESTELONGY</Link>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400 text-sm">Satıcı Paneli</span>
          </div>
          <div className="flex items-center gap-4">
            <form action={handleSignOut}>
              <button type="submit" className="text-slate-400 hover:text-red-400 text-sm transition-colors">Çıkış Yap</button>
            </form>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-24 pb-16">
        {/* Başlık */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">{vendor.company_name}</h1>
          <p className="text-slate-400 text-sm mt-1">Ürün ve işlem yönetiminiz</p>
        </div>

        {/* Özet kartlar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-white">{totalProducts}</p>
            <p className="text-slate-400 text-xs mt-1">Toplam Ürün</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-emerald-400">{approvedCount}</p>
            <p className="text-slate-400 text-xs mt-1">Onaylı</p>
          </div>
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-3xl font-black text-amber-400">{pendingCount}</p>
            <p className="text-slate-400 text-xs mt-1">İncelemede</p>
          </div>
          <Link href="/satici/panel/siparisler"
            className="bg-gradient-to-br from-violet-600/20 to-purple-600/20 hover:from-violet-600/30 hover:to-purple-600/30 border border-violet-500/30 rounded-2xl p-5 text-center transition-all group">
            <p className="text-3xl font-black text-violet-300 group-hover:text-white transition-colors">📦</p>
            <p className="text-violet-400 text-xs font-bold mt-1 uppercase tracking-wider">Siparişlerim</p>
          </Link>
        </div>

        {/* Alt navigasyon linkleri */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link href="/satici/panel/kazanc"
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-emerald-500/50 rounded-2xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">💰</div>
            <div>
              <p className="text-white font-bold text-sm">Kazançlarım</p>
              <p className="text-slate-500 text-xs mt-0.5">Satış + komisyon özeti</p>
            </div>
          </Link>
          <Link href="/satici/panel/odeme-hesabi"
            className="p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-blue-500/50 rounded-2xl transition-all flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">💳</div>
            <div>
              <p className="text-white font-bold text-sm">Ödeme Hesabı</p>
              <p className="text-slate-500 text-xs mt-0.5">Stripe · banka bilgileri</p>
            </div>
          </Link>
        </div>

        {/* Ödeme hesabı uyarı banner — henüz stripe_account_id yoksa */}
        {!vendor.stripe_account_id && (
          <Link href="/satici/panel/odeme-hesabi"
            className="flex items-center gap-3 mb-8 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl hover:border-amber-500/50 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-xl shrink-0">💳</div>
            <div className="flex-1">
              <p className="text-amber-300 font-bold text-sm">Ödeme hesabı kur</p>
              <p className="text-slate-400 text-xs mt-0.5">Müşteri ödemelerini alabilmek için Stripe üzerinden hesap oluştur</p>
            </div>
            <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        )}

        {/* Ürün Ekle Formu */}
        <div className="mb-10">
          <h2 className="text-white font-bold text-lg mb-4">Yeni Ürün / İşlem Ekle</h2>
          <UrunEkleForm vendorId={vendor.id} />
        </div>

        {/* Ürün Listesi */}
        <div>
          <h2 className="text-white font-bold text-lg mb-4">Ürünlerim</h2>

          {products && products.length > 0 ? (
            <div className="space-y-3">
              {products.map(product => {
                const cover = Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : null
                return (
                  <Link key={product.id} href={`/satici/panel/urunler/${product.id}/duzenle`}
                    className="flex items-center gap-4 p-4 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 hover:border-violet-500/50 rounded-2xl transition-all">
                    {/* Thumbnail */}
                    <div className="shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 flex items-center justify-center">
                      {cover ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={cover} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      )}
                    </div>
                    {/* Bilgi */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-white font-medium text-sm truncate">{product.name}</span>
                        <StatusBadge status={product.approval_status} />
                        {product.treatment_type === 'treatment' && (
                          <span className="text-xs bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full">Klinik İşlem</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        {product.category && <span>{CATEGORY_LABELS[product.category] ?? product.category}</span>}
                        {product.price && <span>₺{Number(product.price).toLocaleString('tr-TR')}</span>}
                        {product.stock != null && <span>Stok: {product.stock}</span>}
                        {product.final_score && (
                          <span className={
                            product.final_score >= 9 ? 'text-emerald-400' :
                            product.final_score >= 7 ? 'text-amber-400' : 'text-red-400'
                          }>
                            ★ {product.final_score.toFixed(1)}/10
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Durum + ok */}
                    <div className="shrink-0 flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${product.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-500'}`}>
                        {product.is_active ? 'Aktif' : 'Pasif'}
                      </span>
                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-slate-600">
              <div className="text-4xl mb-3">📦</div>
              <p>Henüz ürün eklenmemiş</p>
              <p className="text-sm mt-1">Yukarıdaki formu kullanarak ürün ekleyebilirsiniz.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
