export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KuponForm from './KuponForm'

export default async function AdminKuponlarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const { data: coupons } = await supabase
    .from('coupons')
    .select('id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_from, valid_until, is_active')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link href="/admin" className="text-slate-400 hover:text-white text-sm transition-colors">← Admin</Link>
          <h1 className="text-2xl font-bold text-white mt-1">Kupon Yönetimi</h1>
          <p className="text-slate-400 text-sm">{coupons?.length ?? 0} kupon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Yeni kupon oluştur */}
        <div>
          <h2 className="text-white font-bold mb-4">Yeni Kupon</h2>
          <KuponForm />
        </div>

        {/* Mevcut kuponlar */}
        <div>
          <h2 className="text-white font-bold mb-4">Mevcut Kuponlar</h2>
          <div className="space-y-3">
            {coupons && coupons.length > 0 ? coupons.map(c => (
              <div key={c.id} className={`p-4 rounded-xl border ${c.is_active ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-900/30 border-slate-800 opacity-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <code className="text-white font-black font-mono text-lg tracking-widest">{c.code}</code>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                      {c.is_active ? 'Aktif' : 'Devre Dışı'}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">İndirim</p>
                    <p className="text-white font-bold">
                      {c.discount_type === 'percent' ? `%${c.discount_value}` : `₺${c.discount_value}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Kullanım</p>
                    <p className="text-white font-bold">
                      {c.used_count}{c.max_uses ? `/${c.max_uses}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500">Min. Sepet</p>
                    <p className="text-white font-bold">
                      {Number(c.min_order_amount ?? 0) > 0 ? `₺${c.min_order_amount}` : '—'}
                    </p>
                  </div>
                </div>
                {c.valid_until && (
                  <p className="text-slate-500 text-xs mt-2">
                    Geçerlilik: {new Date(c.valid_until).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            )) : (
              <p className="text-slate-500 text-sm">Henüz kupon yok</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
