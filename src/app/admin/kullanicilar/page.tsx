export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Kullanıcılar',
}

type UserRole = 'user' | 'clinic' | 'vendor' | 'admin'

interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  phone: string | null
  is_active: boolean
  created_at: string
}

const ROLE_COLOR: Record<UserRole, string> = {
  user: 'bg-slate-700 text-slate-300',
  clinic: 'bg-blue-500/20 text-blue-400',
  vendor: 'bg-amber-500/20 text-amber-400',
  admin: 'bg-red-500/20 text-red-400',
}

const ROLE_LABEL: Record<UserRole, string> = {
  user: 'Kullanıcı',
  clinic: 'Klinik',
  vendor: 'Satıcı',
  admin: 'Admin',
}

async function changeRole(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')
  const userId = formData.get('userId') as string
  const role = formData.get('role') as UserRole
  // app_metadata.role tek kaynak — set_user_role RPC profiles.role'u da senkronlar
  await supabase.rpc('set_user_role', { target_user_id: userId, new_role: role })
  redirect('/admin/kullanicilar')
}

async function toggleActive(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')
  const userId = formData.get('userId') as string
  const current = formData.get('current') === 'true'
  await supabase.from('profiles').update({ is_active: !current }).eq('id', userId)
  redirect('/admin/kullanicilar')
}

export default async function KullanicilarPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') redirect('/panel')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(100)

  const users = (profiles ?? []) as Profile[]

  const roleCounts = users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Kullanıcılar</h1>
        <p className="text-slate-400 text-sm mt-1">Tüm hesapları yönetin</p>
      </div>

      {/* Rol dağılımı */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {(['user', 'clinic', 'vendor', 'admin'] as UserRole[]).map(role => (
          <div key={role} className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-2xl font-bold text-white">{roleCounts[role] ?? 0}</div>
            <div className={`text-xs mt-1 px-2 py-0.5 rounded-full inline-block ${ROLE_COLOR[role]}`}>{ROLE_LABEL[role]}</div>
          </div>
        ))}
      </div>

      {/* Kullanıcı tablosu */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Kullanıcı</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Telefon</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Kayıt Tarihi</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Durum</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">Rol</th>
                <th className="text-left px-4 py-3 text-slate-400 font-medium">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                        {(u.full_name ?? '?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{u.full_name ?? 'İsimsiz'}</div>
                        <div className="text-slate-500 text-xs font-mono">{u.id.slice(0, 8)}…</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.phone ?? '—'}</td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(u.created_at).toLocaleDateString('tr-TR')}
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleActive}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="current" value={String(u.is_active)} />
                      <button type="submit" className={`text-xs px-2 py-1 rounded-full transition-colors ${
                        u.is_active
                          ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}>
                        {u.is_active ? 'Aktif' : 'Pasif'}
                      </button>
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ROLE_COLOR[u.role]}`}>
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <form action={changeRole} className="flex gap-1">
                      <input type="hidden" name="userId" value={u.id} />
                      <select
                        name="role"
                        defaultValue={u.role}
                        className="bg-slate-800 border border-slate-700 text-slate-300 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-violet-500"
                      >
                        <option value="user">Kullanıcı</option>
                        <option value="clinic">Klinik</option>
                        <option value="vendor">Satıcı</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors"
                      >
                        Kaydet
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <div className="text-center py-12 text-slate-500">Henüz kullanıcı yok</div>
        )}
      </div>
    </div>
  )
}
