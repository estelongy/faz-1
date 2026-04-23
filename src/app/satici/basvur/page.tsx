export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SaticiBasvurForm from '@/components/SaticiBasvurForm'

export const metadata: Metadata = {
  title: 'Satıcı Başvurusu',
  description: 'Cilt bakım ürünlerinizi Estelongy platformunda satışa sunun.',
}

async function submitApplication(formData: FormData) {
  'use server'
  const supabase = await createClient()
  let { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const firstName = (formData.get('first_name') as string)?.trim()
    const lastName  = (formData.get('last_name') as string)?.trim()
    const email     = (formData.get('email') as string)?.trim()
    const password  = formData.get('password') as string
    const birthYear = formData.get('birth_year') as string

    if (!firstName || !email || !password) redirect('/satici/basvur?error=eksik')

    const admin = createServiceClient()
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { first_name: firstName, last_name: lastName || '' },
    })
    if (createErr || !created.user) redirect('/satici/basvur?error=hesap')

    if (birthYear) {
      await admin.from('profiles').update({ birth_year: parseInt(birthYear) }).eq('id', created.user.id)
    }

    user = created.user
  }

  const company_name = formData.get('company_name') as string
  const tax_number   = formData.get('tax_number') as string
  const phone        = formData.get('phone') as string

  const insertClient = createServiceClient()
  const { error } = await insertClient.from('vendors').insert({
    user_id:         user.id,
    company_name,
    tax_number:      tax_number || null,
    phone:           phone || null,
    approval_status: 'pending',
    is_active:       false,
  })

  if (error) redirect('/satici/basvur?error=1')
  redirect('/satici/basvur?success=1')
}

export default async function SaticiBasvurPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params    = await searchParams
  const hasError  = !!params.error
  const isSuccess = params.success === '1'
  const supabase  = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: existing } = await supabase
      .from('vendors')
      .select('id, approval_status')
      .eq('user_id', user.id)
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {existing.approval_status === 'approved' ? 'Satıcı Hesabınız Aktif' :
               existing.approval_status === 'rejected' ? 'Başvurunuz Reddedildi' : 'Başvurunuz İnceleniyor'}
            </h2>
            <p className="text-slate-400 text-sm mb-6">
              {existing.approval_status === 'approved' ? 'Ürünlerinizi yönetebilirsiniz.' :
               existing.approval_status === 'rejected' ? 'Başvurunuz onaylanmadı. Destek ekibiyle iletişime geçin.' :
               'Başvurunuz admin onayı bekliyor. En kısa sürede değerlendirilecek.'}
            </p>
            <Link href={existing.approval_status === 'approved' ? '/satici/panel' : '/panel'}
              className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
              {existing.approval_status === 'approved' ? 'Satıcı Paneline Git' : 'Panele Dön'}
            </Link>
          </div>
        </main>
      )
    }
  }

  if (isSuccess) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/20 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Başvurunuz Alındı</h2>
          <p className="text-slate-400 text-sm mb-2">
            Başvurunuz incelemeye alındı. En kısa sürede değerlendirilecek.
          </p>
          <p className="text-slate-500 text-xs mb-6">
            Hesabınız oluşturuldu. Onay sonrası <strong className="text-slate-400">giriş yaparak</strong> satıcı panelinize erişebilirsiniz.
          </p>
          <Link href="/giris"
            className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
            Giriş Yap
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Geri
          </Link>
          <span className="text-white font-bold">Satıcı Başvurusu</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white mb-4">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Satıcı Olarak Katıl</h1>
          <p className="text-slate-400 text-sm mt-1">Başvurunuz admin onayından sonra aktive edilir</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🛍️', title: 'Hedefli Kitle', desc: 'Cilt sağlığına yatırım yapan hastalara ulaşın' },
            { icon: '✓',  title: 'Hekim Puanlı', desc: 'Ürünleriniz uzman değerlendirmesiyle öne çıkar' },
            { icon: '📊', title: 'Analitik', desc: 'Satış ve etkileşim verilerinizi takip edin' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-white text-sm font-medium">{title}</div>
              <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        <SaticiBasvurForm action={submitApplication} hasError={hasError} isLoggedIn={!!user} />
      </div>
    </main>
  )
}
