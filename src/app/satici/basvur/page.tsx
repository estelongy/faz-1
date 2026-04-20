export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Satıcı Başvurusu',
  description: 'Cilt bakım ürünlerinizi Estelongy platformunda satışa sunun.',
}

async function submitApplication(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const company_name = formData.get('company_name') as string
  const tax_number = formData.get('tax_number') as string

  const { error } = await supabase.from('vendors').insert({
    user_id: user.id,
    company_name,
    tax_number: tax_number || null,
    approval_status: 'pending',
    is_active: false,
  })

  if (error) redirect('/satici/basvur?error=1')

  // Not: Rol (app_metadata.role) admin onay anında set_user_role RPC ile atanır.
  // Pending aşamasında rol "user" olarak kalır, panel erişimi approval_status'e bakar.

  redirect('/panel?basvuru=satici')
}

export default async function SaticiBasvurPage({
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
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()

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
          <Link href="/panel" className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
            Panele Dön
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
          <p className="text-slate-400 text-sm mt-1">Cilt bakım ürünlerinizi Estelongy&apos;de satın</p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🛍️', title: 'Geniş Kitle', desc: 'Binlerce aktif kullanıcıya ulaşın' },
            { icon: '🤖', title: 'AI Öneri', desc: 'Ürünleriniz AI tarafından önerilir' },
            { icon: '📊', title: 'Analitik', desc: 'Satış verilerinizi takip edin' },
          ].map(({ icon, title, desc }) => (
            <div key={title} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-center">
              <div className="text-2xl mb-2">{icon}</div>
              <div className="text-white text-sm font-medium">{title}</div>
              <div className="text-slate-500 text-xs mt-0.5">{desc}</div>
            </div>
          ))}
        </div>

        {hasError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
            <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-400 text-sm">
              Başvuru gönderilemedi. Bir hata oluştu. Lütfen tekrar deneyin.
            </p>
          </div>
        )}

        <form action={submitApplication} className="space-y-6">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Şirket / Marka Adı <span className="text-red-400">*</span></label>
            <input type="text" name="company_name" required placeholder="Örn: DermaCare Kozmetik A.Ş."
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Vergi Numarası</label>
            <input type="text" name="tax_number" placeholder="1234567890"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            <p className="text-slate-500 text-xs mt-1">Fatura işlemleri için gereklidir</p>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 text-sm">
              <strong>Not:</strong> Başvurunuz onaylandıktan sonra ürün ekleyebilir ve satışa başlayabilirsiniz.
            </p>
          </div>

          <button type="submit"
            className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-xl transition-all text-lg">
            Başvuruyu Gönder
          </button>
        </form>
      </div>
    </main>
  )
}
