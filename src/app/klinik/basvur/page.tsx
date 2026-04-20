export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Klinik Başvurusu',
  description: 'Kliniğinizi Estelongy platformuna kaydedin. Hastaları kolayca yönetin.',
}

const SPECIALTIES = [
  'Cilt Bakımı', 'Lazer Tedavisi', 'Botoks & Dolgu', 'PRP Tedavisi',
  'Kimyasal Peeling', 'Mezoterapi', 'Leke Tedavisi', 'Akne Tedavisi',
  'Skar Tedavisi', 'Saç Ekimi', 'Epilasyon', 'Antiaging',
]

async function submitApplication(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const name = formData.get('name') as string
  const location = formData.get('location') as string
  const bio = formData.get('bio') as string
  const specialties = formData.getAll('specialties') as string[]

  const { error } = await supabase.from('clinics').insert({
    user_id: user.id,
    name,
    location: location || null,
    bio: bio || null,
    specialties: specialties.length > 0 ? specialties : null,
    approval_status: 'pending',
    is_active: false,
  })

  if (error) redirect('/klinik/basvur?error=1')

  // Not: Rol (app_metadata.role) admin onay anında set_user_role RPC ile atanır.
  // Pending aşamasında rol "user" olarak kalır, panel erişimi approval_status'e bakar.

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

        {hasError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">
              Başvuru gönderilemedi. Zaten aktif bir başvurunuz olabilir veya bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          </div>
        )}

        <form action={submitApplication} className="space-y-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Klinik Adı <span className="text-red-400">*</span></label>
            <input type="text" name="name" required placeholder="Dr. Ahmet Yılmaz Dermatoloji Kliniği"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Konum</label>
            <input type="text" name="location" placeholder="İstanbul, Kadıköy"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Klinik Hakkında</label>
            <textarea name="bio" rows={4} placeholder="Kliniğiniz hakkında kısa bir tanıtım yazısı..."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-3">Uzmanlık Alanları</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SPECIALTIES.map(s => (
                <label key={s} className="flex items-center gap-2 p-3 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors group">
                  <input type="checkbox" name="specialties" value={s} className="accent-violet-500 w-4 h-4" />
                  <span className="text-slate-400 group-hover:text-white text-sm transition-colors">{s}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 text-sm">
              <strong>Not:</strong> Başvurunuz onaylandıktan sonra klinik panelinize erişebilir ve randevu almaya başlayabilirsiniz.
            </p>
          </div>

          <button type="submit"
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all text-lg">
            Başvuruyu Gönder
          </button>
        </form>
      </div>
    </main>
  )
}
