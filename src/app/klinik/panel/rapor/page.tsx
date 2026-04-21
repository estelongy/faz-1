export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = { title: 'Klinik Raporu' }

type MonthStats = {
  label: string
  year: number
  month: number // 0-11
  total: number
  completed: number
  cancelled: number
  noShow: number
  pending: number
  avgFinalScore: number | null
  avgScoreGain: number | null // ön analiz → final delta ortalaması
  jetonUsed: number
}

// Ay bazlı aggregate
function aggregate(
  appts: Array<{ status: string; appointment_date: string | null }>,
  scoreRows: Array<{ appointment_id: string | null; total_score: number | null; c250_base: number | null }>,
  jetonRows: Array<{ amount: number; created_at: string }>,
  year: number,
  month: number,
): MonthStats {
  const monthStart = new Date(year, month, 1).getTime()
  const monthEnd = new Date(year, month + 1, 1).getTime()

  const monthAppts = appts.filter(a => {
    if (!a.appointment_date) return false
    const t = new Date(a.appointment_date).getTime()
    return t >= monthStart && t < monthEnd
  })

  const completed = monthAppts.filter(a => a.status === 'completed').length
  const cancelled = monthAppts.filter(a => a.status === 'cancelled').length
  const noShow = monthAppts.filter(a => a.status === 'no_show').length
  const pending = monthAppts.filter(a => ['pending', 'confirmed', 'in_progress'].includes(a.status)).length

  // Ortalama final ve skor artışı (bu aya ait completed randevuların skorları)
  const monthApptIds = new Set(monthAppts.filter(a => a.status === 'completed').map(a => (a as { id?: string }).id).filter(Boolean) as string[])
  let avgFinal: number | null = null
  let avgGain: number | null = null

  const monthScores = scoreRows.filter(s => s.appointment_id && monthApptIds.has(s.appointment_id))
  if (monthScores.length > 0) {
    const finals = monthScores.map(s => Number(s.total_score ?? 0)).filter(n => n > 0)
    const gains = monthScores
      .map(s => Number(s.total_score ?? 0) - Number(s.c250_base ?? 0))
      .filter(n => !Number.isNaN(n))
    if (finals.length > 0) avgFinal = finals.reduce((a, b) => a + b, 0) / finals.length
    if (gains.length > 0) avgGain = gains.reduce((a, b) => a + b, 0) / gains.length
  }

  // Jeton kullanımı (usage tipi, bu aya ait)
  const jetonUsed = jetonRows
    .filter(j => {
      const t = new Date(j.created_at).getTime()
      return t >= monthStart && t < monthEnd
    })
    .reduce((sum, j) => sum + Math.abs(j.amount), 0)

  return {
    label: new Date(year, month, 1).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' }),
    year, month,
    total: monthAppts.length,
    completed,
    cancelled,
    noShow,
    pending,
    avgFinalScore: avgFinal,
    avgScoreGain: avgGain,
    jetonUsed,
  }
}

export default async function KlinikRaporPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, jeton_balance')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/panel')

  // Son 6 ay randevuları
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const { data: appts } = await supabase
    .from('appointments')
    .select('id, status, appointment_date')
    .eq('clinic_id', clinic.id)
    .gte('appointment_date', sixMonthsAgo.toISOString())

  const apptIds = (appts ?? []).map(a => a.id)

  const { data: scoreRows } = apptIds.length > 0
    ? await supabase
        .from('scores')
        .select('appointment_id, total_score, c250_base')
        .in('appointment_id', apptIds)
    : { data: [] as Array<{ appointment_id: string | null; total_score: number | null; c250_base: number | null }> }

  const { data: jetonRows } = await supabase
    .from('jeton_transactions')
    .select('amount, created_at, type')
    .eq('clinic_id', clinic.id)
    .eq('type', 'usage')
    .gte('created_at', sixMonthsAgo.toISOString())

  // Son 6 ayın her biri için aggregate
  const now = new Date()
  const months: MonthStats[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(aggregate(
      (appts ?? []) as Array<{ id: string; status: string; appointment_date: string | null }>,
      (scoreRows ?? []) as Array<{ appointment_id: string | null; total_score: number | null; c250_base: number | null }>,
      (jetonRows ?? []) as Array<{ amount: number; created_at: string }>,
      d.getFullYear(),
      d.getMonth(),
    ))
  }

  const current = months[months.length - 1]
  const previous = months[months.length - 2]

  // Trendler
  function trend(curr: number, prev: number): { delta: number; up: boolean; pct: number } {
    const delta = curr - prev
    const pct = prev > 0 ? (delta / prev) * 100 : 0
    return { delta, up: delta >= 0, pct }
  }

  const trendTotal = trend(current.total, previous.total)
  const trendCompleted = trend(current.completed, previous.completed)

  // Kabul oranı (completed / (completed + cancelled + noShow))
  const finalized = current.completed + current.cancelled + current.noShow
  const acceptRate = finalized > 0 ? (current.completed / finalized) * 100 : 0

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/klinik/panel" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Klinik Paneli
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-white font-bold text-sm">Aylık Rapor</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white">{clinic.name}</h1>
          <p className="text-slate-400 mt-1 text-sm">Son 6 ay performans raporu</p>
        </div>

        {/* Bu Ay Özet Kartları */}
        <h2 className="text-white font-bold mb-4">Bu Ay ({current.label})</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {/* Toplam Randevu */}
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
            <p className="text-slate-500 text-xs mb-1">Toplam Randevu</p>
            <p className="text-3xl font-black text-white">{current.total}</p>
            <p className={`text-xs mt-2 ${trendTotal.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendTotal.up ? '↑' : '↓'} geçen aya göre {Math.abs(trendTotal.delta)}
              {previous.total > 0 && ` (${trendTotal.up ? '+' : ''}${trendTotal.pct.toFixed(0)}%)`}
            </p>
          </div>

          {/* Tamamlanan */}
          <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
            <p className="text-emerald-400/70 text-xs mb-1">Tamamlanan</p>
            <p className="text-3xl font-black text-emerald-400">{current.completed}</p>
            <p className={`text-xs mt-2 ${trendCompleted.up ? 'text-emerald-400' : 'text-red-400'}`}>
              {trendCompleted.up ? '↑' : '↓'} {Math.abs(trendCompleted.delta)}
            </p>
          </div>

          {/* Kabul Oranı */}
          <div className="p-5 rounded-2xl bg-violet-500/5 border border-violet-500/20">
            <p className="text-violet-400/70 text-xs mb-1">Kabul Oranı</p>
            <p className="text-3xl font-black text-violet-400">{acceptRate.toFixed(0)}%</p>
            <p className="text-xs text-slate-500 mt-2">
              {current.completed} / {finalized} finalize
            </p>
          </div>

          {/* Jeton Kullanımı */}
          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20">
            <p className="text-amber-400/70 text-xs mb-1">Jeton Kullanımı</p>
            <p className="text-3xl font-black text-amber-400">{current.jetonUsed}</p>
            <p className="text-xs text-slate-500 mt-2">
              Bakiye: {(clinic as { jeton_balance?: number }).jeton_balance ?? 0}
            </p>
          </div>
        </div>

        {/* Skor Metrikleri */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
            <p className="text-slate-500 text-xs mb-1">Ortalama Klinik Onaylı EGS</p>
            <p className="text-4xl font-black text-white">
              {current.avgFinalScore != null ? current.avgFinalScore.toFixed(1) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Bu ay hekim onayı verilen randevuların ortalaması
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
            <p className="text-slate-500 text-xs mb-1">Ortalama Skor Artışı</p>
            <p className={`text-4xl font-black ${(current.avgScoreGain ?? 0) > 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
              {current.avgScoreGain != null
                ? `${current.avgScoreGain > 0 ? '+' : ''}${current.avgScoreGain.toFixed(1)}`
                : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Ön analiz skorundan klinik onaylı skora fark ortalaması
            </p>
          </div>
        </div>

        {/* Aylık Dağılım Tablosu */}
        <h2 className="text-white font-bold mb-4">6 Aylık Dağılım</h2>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="px-4 py-3 text-left">Ay</th>
                  <th className="px-4 py-3 text-center">Toplam</th>
                  <th className="px-4 py-3 text-center">✓ Tamam</th>
                  <th className="px-4 py-3 text-center">✕ İptal</th>
                  <th className="px-4 py-3 text-center">○ Gelmedi</th>
                  <th className="px-4 py-3 text-center">⏳ Aktif</th>
                  <th className="px-4 py-3 text-right">Ort. EGS</th>
                  <th className="px-4 py-3 text-right">Jeton</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {[...months].reverse().map((m, i) => (
                  <tr key={`${m.year}-${m.month}`} className={i === 0 ? 'bg-violet-500/5' : ''}>
                    <td className="px-4 py-3 text-white font-medium">{m.label}</td>
                    <td className="px-4 py-3 text-center text-white">{m.total}</td>
                    <td className="px-4 py-3 text-center text-emerald-400">{m.completed}</td>
                    <td className="px-4 py-3 text-center text-red-400">{m.cancelled}</td>
                    <td className="px-4 py-3 text-center text-slate-500">{m.noShow}</td>
                    <td className="px-4 py-3 text-center text-amber-400">{m.pending}</td>
                    <td className="px-4 py-3 text-right text-white font-bold">
                      {m.avgFinalScore != null ? m.avgFinalScore.toFixed(1) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-400">{m.jetonUsed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Boş durum */}
        {current.total === 0 && previous.total === 0 && (
          <div className="mt-8 p-5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm">
            ℹ Henüz yeterli veri yok. Randevular arttıkça rapor zenginleşecek.
          </div>
        )}
      </div>
    </main>
  )
}
