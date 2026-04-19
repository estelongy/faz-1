export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
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

export default async function SaticiPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Satıcı kaydını bul
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status')
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
    .select('id, name, category, price, final_score, approval_status, treatment_type, is_active, created_at')
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
          <div className="flex items-center gap-3">
            <Link href="/magaza" className="text-slate-400 hover:text-white text-sm transition-colors">Mağaza</Link>
            <Link href="/panel" className="text-slate-400 hover:text-white text-sm transition-colors">Hesabım</Link>
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
        <div className="grid grid-cols-3 gap-4 mb-10">
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
        </div>

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
              {products.map(product => (
                <div key={product.id} className="flex items-center justify-between p-4 bg-slate-800/50 border border-slate-700 rounded-2xl gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-white font-medium text-sm truncate">{product.name}</span>
                      <StatusBadge status={product.approval_status} />
                      {product.treatment_type === 'treatment' && (
                        <span className="text-xs bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full">Klinik İşlem</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      {product.category && <span>{CATEGORY_LABELS[product.category] ?? product.category}</span>}
                      {product.price && <span>₺{Number(product.price).toLocaleString('tr-TR')}</span>}
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
                  <div className="shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${product.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-700 text-slate-500'}`}>
                      {product.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>
                </div>
              ))}
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
