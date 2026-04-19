export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import JetonSatinAl from './JetonSatinAl'

export const metadata: Metadata = {
  title: 'Jeton Yönetimi',
}

const TYPE_LABEL: Record<string, string> = {
  purchase: 'Satın Alma',
  usage:    'Kullanım',
  refund:   'İade',
  manual:   'Manuel Yükleme',
}
const TYPE_COLOR: Record<string, string> = {
  purchase: 'text-emerald-400',
  usage:    'text-red-400',
  refund:   'text-blue-400',
  manual:   'text-violet-400',
}

export default async function JetonPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; cancelled?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, jeton_balance')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/panel')

  const { data: transactions } = await supabase
    .from('jeton_transactions')
    .select('id, amount, type, description, created_at, appointment_id')
    .eq('clinic_id', clinic.id)
    .order('created_at', { ascending: false })
    .limit(100)

  const totalKullanim = (transactions ?? []).filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0)
  const totalYukleme  = (transactions ?? []).filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/klinik/panel" className="text-slate-400 hover:text-white transition-colors text-sm">← Panel</Link>
            <span className="text-slate-700">|</span>
            <span className="text-white font-bold text-sm">Jeton Yönetimi</span>
          </div>
          <span className="text-slate-500 text-xs hidden sm:block">{clinic.name}</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">

        {/* Başarı / İptal banner */}
        {params.success === '1' && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
            ✅ Ödeme başarılı! Jetonlarınız hesabınıza yüklendi.
          </div>
        )}
        {params.cancelled === '1' && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium">
            ⚠ Ödeme iptal edildi. İstediğiniz zaman tekrar deneyebilirsiniz.
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl font-black text-white">Jeton Yönetimi</h1>
          <p className="text-slate-400 mt-0.5 text-sm">Her hasta kabulünde 1 jeton düşülür.</p>
        </div>

        {/* Özet kartları */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
            <p className="text-slate-400 text-xs mb-1">Mevcut Bakiye</p>
            <p className={`text-4xl font-black ${
              clinic.jeton_balance === 0 ? 'text-red-400' :
              clinic.jeton_balance <= 3  ? 'text-amber-400' : 'text-emerald-400'
            }`}>{clinic.jeton_balance}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
            <p className="text-slate-400 text-xs mb-1">Toplam Yüklenen</p>
            <p className="text-4xl font-black text-violet-400">{totalYukleme}</p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
            <p className="text-slate-400 text-xs mb-1">Toplam Kullanılan</p>
            <p className="text-4xl font-black text-slate-300">{totalKullanim}</p>
          </div>
        </div>

        {clinic.jeton_balance === 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            ⚠ Jeton bakiyeniz sıfır. Hasta kabulü yapabilmek için jeton satın alın.
          </div>
        )}

        {/* Jeton Satın Al */}
        <div className="mb-8">
          <h2 className="text-white font-bold text-lg mb-4">Jeton Satın Al</h2>
          <JetonSatinAl />
        </div>

        {/* İşlem geçmişi */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-white font-bold">İşlem Geçmişi ({transactions?.length ?? 0})</h2>
          </div>

          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Tarih</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Tür</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Açıklama</th>
                    <th className="text-right px-4 py-3 text-slate-400 font-medium">Miktar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {transactions.map(t => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(t.created_at).toLocaleDateString('tr-TR', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium ${TYPE_COLOR[t.type] ?? 'text-slate-400'}`}>
                          {TYPE_LABEL[t.type] ?? t.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {t.description ?? '—'}
                        {t.appointment_id && (
                          <Link href={`/klinik/panel/randevu/${t.appointment_id}`}
                            className="ml-2 text-violet-400 hover:text-violet-300 transition-colors">
                            Randevuya Git →
                          </Link>
                        )}
                      </td>
                      <td className={`px-4 py-3 text-right font-black text-base ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {t.amount > 0 ? `+${t.amount}` : t.amount}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-600">
              Henüz jeton işlemi yok
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
