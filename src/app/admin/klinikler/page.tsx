export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Klinikler',
}

type ApprovalStatus = 'pending' | 'approved' | 'rejected'

interface Clinic {
  id: string
  name: string
  location: string | null
  bio: string | null
  specialties: string[] | null
  approval_status: ApprovalStatus
  is_active: boolean
  jeton_balance: number
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

async function updateClinic(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')
  const clinicId = formData.get('clinicId') as string
  const status = formData.get('status') as ApprovalStatus
  const isActive = status === 'approved'

  // Kliniğin user_id'sini al (rol güncellemesi için)
  const { data: current } = await supabase
    .from('clinics')
    .select('user_id, approval_status, jeton_balance, name')
    .eq('id', clinicId)
    .single()

  // Onay anında hatırlanacak: welcome email tetikleme
  // (aşağıda approved dallarında çağrılıyor)
  async function triggerWelcomeIfApproved() {
    if (status !== 'approved' || current?.approval_status === 'approved') return
    if (!current?.user_id) return
    try {
      const { createServiceClient } = await import('@/lib/supabase/service')
      const { sendWelcomeEmail } = await import('@/lib/welcome-email')
      const admin = createServiceClient()
      const { data: userRes } = await admin.auth.admin.getUserById(current.user_id)
      const email = userRes?.user?.email
      const { data: profile } = await admin.from('profiles').select('full_name').eq('id', current.user_id).single()
      const firstName = profile?.full_name?.split(' ')[0] ?? 'Değerli klinik sahibi'
      if (email) {
        await sendWelcomeEmail({ to: email, firstName, role: 'clinic' })
      }
    } catch (e) {
      console.error('[admin/klinikler] welcome email gönderilemedi:', e)
    }
  }

  // Onay/red güncelle. Yeni kliniğe ücretsiz hak DEFAULT 20 olarak otomatik
  // veriliyor (free_appointments_remaining migration default'u). Ek 'starter
  // jeton' artık gerekmiyor — eskiden 10 jeton verilirdi, şimdi 20 ücretsiz hak.
  await supabase.from('clinics').update({ approval_status: status, is_active: isActive }).eq('id', clinicId)

  // app_metadata.role güncelle: onaylandıysa 'clinic', reddedildiyse 'user'
  if (current?.user_id) {
    const newRole = status === 'approved' ? 'clinic' : status === 'rejected' ? 'user' : null
    if (newRole) await supabase.rpc('set_user_role', { target_user_id: current.user_id, new_role: newRole })
  }

  await triggerWelcomeIfApproved()
  redirect('/admin/klinikler')
}

async function addJeton(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const clinicId = formData.get('clinicId') as string
  const amount   = parseInt(formData.get('amount') as string, 10)
  if (!clinicId || isNaN(amount) || amount < 1) redirect('/admin/klinikler')

  const { data: clinic } = await supabase.from('clinics').select('jeton_balance').eq('id', clinicId).single()
  const newBalance = (clinic?.jeton_balance ?? 0) + amount

  await supabase.from('clinics').update({ jeton_balance: newBalance }).eq('id', clinicId)
  await supabase.from('jeton_transactions').insert({
    clinic_id: clinicId,
    amount,
    type: 'manual',
    description: `Admin tarafından ${amount} kredi yüklendi`,
  })

  redirect('/admin/klinikler')
}

export default async function KliniklerPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const { data: clinics } = await supabase
    .from('clinics')
    .select('id, name, location, bio, specialties, approval_status, is_active, jeton_balance, created_at, profiles(full_name)')
    .order('created_at', { ascending: false })

  const all = (clinics ?? []) as unknown as Clinic[]
  const pending = all.filter(c => c.approval_status === 'pending')
  const approved = all.filter(c => c.approval_status === 'approved')
  const rejected = all.filter(c => c.approval_status === 'rejected')

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Klinikler</h1>
        <p className="text-slate-400 text-sm mt-1">Klinik başvurularını yönetin</p>
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

      {/* Bekleyen başvurular — öne çıkar */}
      {pending.length > 0 && (
        <div className="mb-8">
          <h2 className="text-white font-bold mb-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            Onay Bekleyen ({pending.length})
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pending.map((c) => (
              <ClinicCard key={c.id} clinic={c} action={updateClinic} showActions />
            ))}
          </div>
        </div>
      )}

      {/* Tüm klinikler */}
      <div>
        <h2 className="text-white font-bold mb-4">Tüm Klinikler ({all.length})</h2>
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Klinik</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Konum</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Kayıt</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Kredi</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {all.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{c.name}</div>
                    <div className="text-slate-500 text-xs">{c.profiles?.full_name ?? '—'}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{c.location ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{new Date(c.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${
                        (c.jeton_balance ?? 0) === 0 ? 'text-red-400' :
                        (c.jeton_balance ?? 0) <= 10 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>{c.jeton_balance ?? 0}</span>
                      <form action={addJeton} className="flex gap-1 items-center">
                        <input type="hidden" name="clinicId" value={c.id} />
                        <input type="number" name="amount" defaultValue={10} min={1} max={1000}
                          className="w-14 bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded px-1.5 py-0.5 focus:outline-none focus:border-violet-500"
                          aria-label="Eklenecek kredi miktarı" />
                        <button type="submit" className="px-1.5 py-0.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs rounded transition-colors" title="Klinike kredi ekle">+</button>
                      </form>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[c.approval_status]}`}>
                      {STATUS_LABEL[c.approval_status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={updateClinic} className="flex gap-1">
                      <input type="hidden" name="clinicId" value={c.id} />
                      <select name="status" defaultValue={c.approval_status}
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
          {all.length === 0 && <div className="text-center py-12 text-slate-500">Henüz klinik başvurusu yok</div>}
        </div>
      </div>
    </div>
  )
}

function ClinicCard({ clinic, action, showActions }: {
  clinic: Clinic
  action: (f: FormData) => Promise<void>
  showActions?: boolean
}) {
  return (
    <div className="p-5 rounded-2xl bg-slate-900 border border-amber-500/20">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-white font-bold">{clinic.name}</div>
          <div className="text-slate-400 text-xs mt-0.5">{clinic.profiles?.full_name ?? 'Bilinmiyor'} · {clinic.location ?? 'Konum yok'}</div>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[clinic.approval_status]}`}>
          {STATUS_LABEL[clinic.approval_status]}
        </span>
      </div>
      {clinic.bio && <p className="text-slate-400 text-xs mb-3 line-clamp-2">{clinic.bio}</p>}
      {clinic.specialties && clinic.specialties.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {clinic.specialties.slice(0, 4).map(s => (
            <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">{s}</span>
          ))}
        </div>
      )}
      {showActions && (
        <div className="flex gap-2">
          <form action={action} className="flex-1">
            <input type="hidden" name="clinicId" value={clinic.id} />
            <input type="hidden" name="status" value="approved" />
            <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
              ✓ Onayla
            </button>
          </form>
          <form action={action} className="flex-1">
            <input type="hidden" name="clinicId" value={clinic.id} />
            <input type="hidden" name="status" value="rejected" />
            <button type="submit" className="w-full py-2 bg-red-900/50 hover:bg-red-800/50 text-red-400 text-sm font-medium rounded-xl transition-colors border border-red-800/50">
              ✕ Reddet
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
