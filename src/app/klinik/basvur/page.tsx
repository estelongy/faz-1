export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import KlinikBasvurForm from '@/components/KlinikBasvurForm'

export const metadata: Metadata = {
  title: 'Klinik Başvurusu',
  description: 'Kliniğinizi Estelongy platformuna kaydedin. Hastaları kolayca yönetin.',
}

async function submitApplication(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const bio = formData.get('bio') as string
  const clinic_type = formData.get('clinic_type') as string
  const specialties = formData.getAll('specialties') as string[]

  const { error } = await supabase.from('clinics').insert({
    user_id: user.id,
    name,
    location: location || null,
    bio: bio || null,
    clinic_type: clinic_type || null,
    specialties: specialties.length > 0 ? specialties : null,
    approval_status: 'pending',
    is_active: false,
  })

  if (error) redirect('/klinik/basvur?error=1')

  redirect('/panel?basvuru=klinik')
}

export default async function KlinikBasvurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const hasError = params.error === '1'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: existing } = await supabase
    .from('clinics')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
            existing.approval_status === 'approved' ? 'bg-emerald-500/20' :
            existing.approval_status === 'rejected' ? 'bg-red-500/20' : 'bg-amber-500/20'
          }`}>
            <svg className={`w-8 h-8 ${
              existing.approval_status === 'approved' ? 'text-emerald-400' :
              existing.approval_status === 'rejected' ? 'text-red-400' : 'text-amber-400'
            }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {existing.approval_status === 'approved' ? 'Klinik Hesabınız Aktif' :
             existing.approval_status === 'rejected' ? 'Başvurunuz Reddedildi' : 'Başvurunuz İnceleniyor'}
          </h2>
          <p className="text-slate-400 text-sm mb-6">
            {existing.approval_status === 'approved' ? 'Klinik panelinize erişebilirsiniz.' :
             existing.approval_status === 'rejected' ? 'Başvurunuz onaylanmadı. Destek ekibiyle iletişime geçin.' :
             'Başvurunuz admin onayı bekliyor. En kısa sürede değerlendirilecek.'}
          </p>
          <Link href={existing.approval_status === 'approved' ? '/klinik/panel' : '/panel'}
            className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
            {existing.approval_status === 'approved' ? 'Klinik Paneline Git' : 'Panele Dön'}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/panel" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Geri
          </Link>
          <span className="text-white font-bold">Klinik Başvurusu</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Klinik Olarak Katıl</h1>
          <p className="text-slate-400 text-sm mt-1">Başvurunuz admin onayından sonra aktive edilir</p>
        </div>

        <KlinikBasvurForm action={submitApplication} hasError={hasError} />
      </div>
    </main>
  )
}
