export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import UrunOnayActions from './UrunOnayActions'

export const metadata: Metadata = { title: 'Ürün Onayları — Admin' }

async function urunOnayAction(productId: string, status: 'approved' | 'rejected') {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')

  await supabase
    .from('products')
    .update({ approval_status: status, is_active: status === 'approved' })
    .eq('id', productId)

  revalidatePath('/admin/urunler')
}

type VendorInfo = { company_name: string }[] | null

const CATEGORY_LABELS: Record<string, string> = {
  botox: 'Botoks', filler: 'Dolgu', mezo: 'Mezoterapi', laser: 'Lazer',
  gold_needle: 'Altın İğne', peeling: 'Peeling', serum: 'Serum',
  supplement: 'Takviye', device: 'Cihaz', other: 'Diğer',
}

export default async function AdminUrunlerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')

  const { data: products } = await supabase
    .from('products')
    .select('id, name, category, treatment_type, price, description, ingredients, approval_status, is_active, created_at, vendors(company_name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const pending  = products?.filter(p => p.approval_status === 'pending')  ?? []
  const approved = products?.filter(p => p.approval_status === 'approved') ?? []
  const rejected = products?.filter(p => p.approval_status === 'rejected') ?? []

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white">Ürün Yönetimi</h1>
        <p className="text-slate-400 text-sm mt-1">
          {pending.length} bekleyen · {approved.length} onaylı · {rejected.length} reddedilmiş
        </p>
      </div>

      {/* Bekleyenler */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-amber-400 font-bold text-sm uppercase tracking-widest mb-3">
            ⏳ Bekleyen ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map(p => (
              <div key={p.id} className="p-5 bg-slate-800/50 border border-amber-500/20 rounded-2xl">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-white font-bold">{p.name}</span>
                      {p.treatment_type === 'treatment' && (
                        <span className="text-xs bg-violet-600/20 text-violet-400 px-2 py-0.5 rounded-full">Klinik İşlem</span>
                      )}
                      {p.category && (
                        <span className="text-xs bg-slate-700 text-slate-400 px-2 py-0.5 rounded-full">
                          {CATEGORY_LABELS[p.category] ?? p.category}
                        </span>
                      )}
                    </div>
                    {(p.vendors as VendorInfo)?.[0]?.company_name && (
                      <p className="text-slate-500 text-xs mb-1">Satıcı: {(p.vendors as VendorInfo)?.[0]?.company_name}</p>
                    )}
                    {p.description && <p className="text-slate-400 text-sm mb-2">{p.description}</p>}
                    {p.price && <p className="text-slate-300 text-sm">₺{Number(p.price).toLocaleString('tr-TR')}</p>}
                    {Array.isArray(p.ingredients) && p.ingredients.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {p.ingredients.map((ing: string) => (
                          <span key={ing} className="text-xs bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">{ing}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <UrunOnayActions productId={p.id} action={urunOnayAction} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onaylılar */}
      {approved.length > 0 && (
        <div>
          <h2 className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-3">
            ✓ Onaylı ({approved.length})
          </h2>
          <div className="space-y-2">
            {approved.map(p => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-slate-800/30 border border-slate-700 rounded-2xl gap-4">
                <div>
                  <span className="text-white text-sm font-medium">{p.name}</span>
                  {(p.vendors as VendorInfo)?.[0]?.company_name && (
                    <span className="text-slate-500 text-xs ml-2">— {(p.vendors as VendorInfo)?.[0]?.company_name}</span>
                  )}
                </div>
                <UrunOnayActions productId={p.id} currentStatus="approved" action={urunOnayAction} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
