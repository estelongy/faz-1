export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import OdemeHesabiPanel from './OdemeHesabiPanel'

export const metadata: Metadata = { title: 'Ödeme Hesabı — Satıcı' }

export default async function OdemeHesabiPage({
  searchParams,
}: {
  searchParams: Promise<{ onboarded?: string; refresh?: string }>
}) {
  const sp = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role === 'admin' || role === 'clinic') redirect(pathForRole(role))

  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, company_name, approval_status, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted, commission_rate')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') notFound()

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/satici/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Satıcı Paneli</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Ödeme Hesabı</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Ödeme Hesabı</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ödemeler Stripe üzerinden güvenli şekilde banka hesabınıza aktarılır
          </p>
        </div>

        {/* Onboarding sonucu flash */}
        {sp.onboarded === '1' && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 text-sm">
            ✓ Bilgi girişin tamamlandı. Stripe hesabın inceleniyor — birkaç dakika içinde aktif olur.
          </div>
        )}
        {sp.refresh === '1' && (
          <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-amber-400 text-sm">
            ⚠ Oturum yenilendi. Lütfen süreci tekrar başlatın.
          </div>
        )}

        <OdemeHesabiPanel
          initial={{
            companyName: vendor.company_name,
            hasAccount: !!vendor.stripe_account_id,
            chargesEnabled: vendor.stripe_charges_enabled ?? false,
            payoutsEnabled: vendor.stripe_payouts_enabled ?? false,
            detailsSubmitted: vendor.stripe_details_submitted ?? false,
            commissionRate: Number(vendor.commission_rate ?? 0.15),
          }}
        />
      </div>
    </main>
  )
}
