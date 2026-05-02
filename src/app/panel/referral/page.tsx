export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import ReferralClient from './ReferralClient'

export default async function ReferralPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Referral kodu al (yoksa üret)
  const { data: codeData } = await supabase.rpc('generate_referral_code', { p_user_id: user.id })
  const code = codeData as string

  // Profil → puan bakiyesi
  const { data: profile } = await supabase
    .from('profiles')
    .select('points_balance')
    .eq('id', user.id)
    .single()

  const pointsBalance = profile?.points_balance ?? 0

  // Davet edilen kullanıcı sayısı (bu kullanıcının referans verdiği kişiler)
  const { count: referredCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', user.id)

  // Puan hareketleri (ledger)
  const { data: transactions } = await supabase
    .from('point_transactions')
    .select('id, amount, type, description, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(30)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Panelim</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white font-bold text-sm">Davet & Puan</span>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Arkadaşını Davet Et, Puan Kazan</h1>
          <p className="text-slate-400 mt-1 text-sm">
            Referans kodunla davet et — arkadaşın kayıt olunca, randevu yapınca ve alışveriş yapınca puan kazan.
          </p>
        </div>

        <ReferralClient
          code={code ?? ''}
          pointsBalance={pointsBalance}
          referredCount={referredCount ?? 0}
          transactions={(transactions ?? []).map(t => ({
            id: t.id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            createdAt: t.created_at,
          }))}
        />
      </div>
    </main>
  )
}
