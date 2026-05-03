import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import KlinikSidebar from '@/components/KlinikSidebar'
import Link from 'next/link'

async function handleSignOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/giris')
}

export default async function KlinikPanelLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'vendor') redirect(pathForRole(role))

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, approval_status, jeton_balance, free_appointments_remaining')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Klinik kaydı yok → başvuruya yönlendir
  if (!clinic) redirect('/klinik/basvur')

  // Onay bekliyor / reddedildi → bilgilendirme ekranı (sidebar'sız)
  if (clinic.approval_status !== 'approved') {
    const isPending = clinic.approval_status === 'pending'
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${isPending ? 'bg-amber-500/20' : 'bg-red-500/20'}`}>
            <svg className={`w-8 h-8 ${isPending ? 'text-amber-400' : 'text-red-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {isPending ? 'Başvurunuz İnceleniyor' : 'Başvurunuz Reddedildi'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {isPending
              ? 'Klinik başvurunuz admin onayı bekliyor. En kısa sürede değerlendirilecek.'
              : 'Başvurunuz onaylanmadı. Destek ekibiyle iletişime geçin.'}
          </p>
          <Link href="/panel" className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
            Kullanıcı Paneline Dön
          </Link>
        </div>
      </main>
    )
  }

  const totalCredit = (clinic.jeton_balance ?? 0) + (clinic.free_appointments_remaining ?? 0)
  const freeCredit = clinic.free_appointments_remaining ?? 0

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <KlinikSidebar
        clinicName={clinic.name}
        totalCredit={totalCredit}
        freeCredit={freeCredit}
      />

      {/* Ana içerik — sidebar offset */}
      <div className="lg:pl-64">
        {/* Üst bar (mobil için boşluk + çıkış) */}
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800 h-14 flex items-center justify-between px-4 lg:px-8">
          <div className="lg:hidden w-10" /> {/* mobile hamburger placeholder */}
          <div className="hidden lg:flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-1.5" />
              Estelongy Klinik Topluluğu
            </span>
          </div>
          <form action={handleSignOut}>
            <button type="submit" className="text-sm text-slate-400 hover:text-white transition-colors">
              Çıkış
            </button>
          </form>
        </header>

        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
