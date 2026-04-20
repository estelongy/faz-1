export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import OdemeFlow from './OdemeFlow'

export const metadata: Metadata = { title: 'Ödeme' }

export default async function OdemePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris?next=/odeme')

  const { data: addresses } = await supabase
    .from('addresses')
    .select('id, title, full_name, phone, city, district, neighborhood, address_line, postal_code, is_default')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/sepet" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Sepete Dön
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Ödeme</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Ödemeyi Tamamla</h1>
          <p className="text-slate-400 text-sm mt-1">
            Güvenli ödeme — Stripe ile korunuyor. Kart bilgin sunucumuza kaydedilmez.
          </p>
        </div>

        <OdemeFlow initialAddresses={addresses ?? []} />
      </div>
    </main>
  )
}
