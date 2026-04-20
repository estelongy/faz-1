export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdresListe, { type Adres } from './AdresListe'

export const metadata: Metadata = { title: 'Adreslerim' }

export default async function AdreslerimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: addresses } = await supabase
    .from('addresses')
    .select('id, title, full_name, phone, city, district, neighborhood, address_line, postal_code, is_default')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/panel" className="text-slate-400 hover:text-white transition-colors text-sm">
            ← Panelim
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-white text-sm font-bold">Adreslerim</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">Adreslerim</h1>
          <p className="text-slate-400 text-sm mt-1">Sipariş teslim adreslerini yönet</p>
        </div>

        <AdresListe addresses={(addresses ?? []) as Adres[]} />
      </div>
    </main>
  )
}
