export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Satıcılar',
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface Vendor {
  id: string
  company_name: string
  tax_number: string | null
  approval_status: ApprovalStatus
  is_active: boolean
  balance: number
  created_at: string
  profiles: { full_name: string | null } | null
}

const STATUS_COLOR: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
}
const STATUS_LABEL: Record<ApprovalStatus, string> = {
  pending: 'Beklemede',
  approved: 'Onaylı',
  rejected: 'Reddedildi',
}

async function updateVendor(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')
  const vendorId = formData.get('vendorId') as string
  const status = formData.get('status') as ApprovalStatus
  const isActive = status === 'approved'
  await supabase.from('vendors').update({ approval_status: status, is_active: isActive }).eq('id', vendorId)

  // Onaylandıysa kullanıcıya vendor rolü ata, reddedildiyse user'a döndür
  const { data: vendor } = await supabase.from('vendors').select('user_id').eq('id', vendorId).single()
  if (vendor?.user_id) {
    const newRole = status === 'approved' ? 'vendor' : 'user'
    await supabase.rpc('set_user_role', { target_user_id: vendor.user_id, new_role: newRole })
  }

  redirect('/admin/saticilar')
}

export default async function SaticilarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, company_name, tax_number, approval_status, is_active, balance, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })

  const all = (vendors ?? []) as unknown as Vendor[]
  const pending = all.filter(v => v.approval_status === 'pending')
  const approved = all.filter(v => v.approval_status === 'approved')
  const rejected = all.filter(v => v.approval_status === 'rejected')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Satıcılar</h1>
        <p className="text-slate-400 text-sm mt-1">Satıcı başvurularını yönetin</p>
      </div>

      {/* Özet */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Bekleyen', count: pending.length, color: 'border-amber-500/30 bg-amber-500/10', textColor: 'text-amber-400' },
          { label: 'Onaylı', count: approved.length, color: 'border-emerald-500/30 bg-emerald-500/10', textColor: 'text-emerald-400' },
          { label: 'Reddedildi', count: rejected.length, color: 'border-red-500/30 bg-red-500/10', textColor: 'text-red-400' },
        ].map(({ label, count, color, textColor }) => (
          <div key={label} className={`p-5 rounded-2xl border ${color}`}>
            <div className={`text-3xl font-bold ${textColor}`}>{count}</div>
            <div className="text-slate-400 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Bekleyen satıcılar */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Onay Bekleyen ({pending.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map(v => (
              <div key={v.id} className="p-5 rounded-2xl bg-slate-900 border border-amber-500/20">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-white font-bold">{v.company_name}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{v.profiles?.full_name ?? '—'}</div>
                    {v.tax_number && <div className="text-slate-500 text-xs mt-0.5">Vergi No: {v.tax_number}</div>}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Beklemede</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <form action={updateVendor} className="flex-1">
                    <input type="hidden" name="vendorId" value={v.id} />
                    <input type="hidden" name="status" value="approved" />
                    <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                      ✓ Onayla
                    </button>
                  </form>
                  <form action={updateVendor} className="flex-1">
                    <input type="hidden" name="vendorId" value={v.id} />
                    <input type="hidden" name="status" value="rejected" />
                    <button type="submit" className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-400 text-sm font-medium rounded-xl transition-colors border border-red-800/50">
                      ✕ Reddet
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tablo */}
      <div>
        <h2 className="text-white font-bold mb-4">Tüm Satıcılar ({all.length})</h2>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Şirket</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Vergi No</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Bakiye</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Kayıt</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {all.map(v => (
                <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{v.company_name}</div>
                    <div className="text-slate-500 text-xs">{v.profiles?.full_name ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{v.tax_number ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">₺{Number(v.balance).toLocaleString('tr-TR')}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(v.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[v.approval_status]}`}>
                      {STATUS_LABEL[v.approval_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateVendor} className="flex gap-1">
                      <input type="hidden" name="vendorId" value={v.id} />
                      <select name="status" defaultValue={v.approval_status}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500">
                        <option value="pending">Beklemede</option>
                        <option value="approved">Onayla</option>
                        <option value="rejected">Reddet</option>
                      </select>
                      <button type="submit" className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors">
                        Kaydet
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {all.length === 0 && <div className="text-center py-12 text-slate-500">Henüz satıcı başvurusu yok</div>}
        </div>
      </div>
    </div>
  )
}
