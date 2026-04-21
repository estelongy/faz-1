export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sıralama — Estelongy',
  description: 'Klinik onaylı EGS skorları sıralaması',
}

/** "Ahmet Yılmaz" → "A*** Y***" */
function anonymize(name: string | null | undefined): string {
  if (!name) return 'Anonim'
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(p => p.charAt(0).toUpperCase() + '***').join(' ')
}

function scoreColor(s: number): string {
  if (s >= 90) return '#00d4ff'
  if (s >= 75) return '#22c55e'
  if (s >= 50) return '#f59e0b'
  return '#ef4444'
}

function medalEmoji(rank: number): string {
  if (rank === 1) return '🥇'
  if (rank === 2) return '🥈'
  if (rank === 3) return '🥉'
  return `#${rank}`
}

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // En yüksek klinik onaylı skorlar — her kullanıcının son ve en yüksek skorunu al
  const { data: allScores } = await supabase
    .from('scores')
    .select('user_id, total_score, created_at, score_type')
    .in('score_type', ['klinik_onayli', 'doctor_approved', 'final'])
    .order('total_score', { ascending: false })
    .limit(500)

  // Kullanıcı başına en yüksek skor
  const bestByUser = new Map<string, { score: number; date: string }>()
  for (const s of allScores ?? []) {
    if (!s.user_id || s.total_score == null) continue
    const existing = bestByUser.get(s.user_id)
    const score = Number(s.total_score)
    if (!existing || score > existing.score) {
      bestByUser.set(s.user_id, { score, date: s.created_at })
    }
  }

  // Sıralama
  const ranked = Array.from(bestByUser.entries())
    .map(([userId, d]) => ({ userId, score: d.score, date: d.date }))
    .sort((a, b) => b.score - a.score)

  const top20 = ranked.slice(0, 20)

  // İsimleri çek
  const userIds = top20.map(r => r.userId)
  const myRank = ranked.findIndex(r => r.userId === user.id) + 1
  const myScore = ranked.find(r => r.userId === user.id)?.score ?? null

  // Kendi top 20'de değilse de bilgi göster
  const needMyProfile = myRank > 20 && myScore != null
  if (needMyProfile) userIds.push(user.id)

  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] as Array<{ id: string; full_name: string | null }> }
  const nameByUser = new Map((profiles ?? []).map(p => [p.id, p.full_name]))

  const totalPlayers = ranked.length

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/panel" className="text-slate-400 hover:text-white text-sm transition-colors">
            ← Panel
          </Link>
          <span className="text-slate-700">|</span>
          <span className="text-white font-bold text-sm">🏆 Sıralama</span>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-16">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-white mb-2">Klinik Onaylı EGS Sıralaması</h1>
          <p className="text-slate-400 text-sm">
            Hekim onaylı skorların top 20'si · Anonim olarak gösterilir
          </p>
          {totalPlayers > 0 && (
            <p className="text-slate-500 text-xs mt-2">
              {totalPlayers} kullanıcı skor almış
            </p>
          )}
        </div>

        {/* Kendi sıralaman */}
        {myScore != null ? (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/30">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-violet-400 text-xs font-bold uppercase tracking-wider mb-1">Senin Sıran</p>
                <p className="text-3xl font-black text-white">
                  {myRank > 0 ? `#${myRank}` : '—'}
                  <span className="text-slate-500 text-sm font-normal ml-2">
                    / {totalPlayers}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Skorun</p>
                <p className="text-4xl font-black" style={{ color: scoreColor(myScore) }}>
                  {myScore.toFixed(1)}
                </p>
              </div>
            </div>
            {myRank > 20 && (
              <p className="text-slate-500 text-xs mt-3">
                Top 20'ye girmek için <strong className="text-white">
                  {(top20[19]?.score - myScore).toFixed(1)} puan
                </strong> daha kazan
              </p>
            )}
          </div>
        ) : (
          <div className="mb-6 p-5 rounded-2xl bg-slate-800/50 border border-slate-700 text-center">
            <p className="text-slate-400 text-sm">Henüz klinik onaylı bir skorun yok</p>
            <Link href="/randevu" className="inline-block mt-3 text-violet-400 hover:text-violet-300 text-sm font-medium">
              Randevu al → skoru onayla →
            </Link>
          </div>
        )}

        {/* Top 20 */}
        {top20.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-slate-400">Henüz onaylı skor yok — ilk sırada sen olabilirsin!</p>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700 rounded-2xl overflow-hidden">
            {top20.map((r, i) => {
              const rank = i + 1
              const isMe = r.userId === user.id
              const name = anonymize(nameByUser.get(r.userId))
              return (
                <div
                  key={r.userId}
                  className={`flex items-center gap-4 p-4 border-b border-slate-700/50 last:border-b-0 ${
                    isMe ? 'bg-violet-500/10' : rank <= 3 ? 'bg-gradient-to-r from-amber-500/5 to-transparent' : ''
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-12 text-center text-2xl font-black shrink-0 ${
                    rank === 1 ? 'text-amber-400' :
                    rank === 2 ? 'text-slate-300' :
                    rank === 3 ? 'text-amber-700' :
                    'text-slate-600'
                  }`}>
                    {medalEmoji(rank)}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold truncate ${isMe ? 'text-violet-300' : 'text-white'}`}>
                      {isMe ? 'Sen 🙋' : name}
                    </p>
                    <p className="text-slate-500 text-xs">
                      {new Date(r.date).toLocaleDateString('tr-TR', { month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="text-2xl font-black" style={{ color: scoreColor(r.score) }}>
                      {r.score.toFixed(1)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Nasıl çıkarım */}
        <div className="mt-8 p-5 rounded-2xl bg-slate-800/30 border border-slate-700 text-sm">
          <h3 className="text-white font-bold mb-2">🎯 Sıralamada nasıl yükselirim?</h3>
          <ul className="space-y-2 text-slate-400 text-xs">
            <li className="flex gap-2">
              <span className="text-violet-400">1.</span>
              <span>AI ön analiz yap (fotoğraf → GPT-4 Vision)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400">2.</span>
              <span>Longevity anketini doldur (+10 puana kadar)</span>
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400">3.</span>
              <span>Klinik randevusu al — yüz yüze ankette skor güncellenir</span>
            </li>
            <li className="flex gap-2">
              <span className="text-violet-400">4.</span>
              <span>Tetkik + hekim onayı ile Klinik Onaylı EGS'ye ulaş</span>
            </li>
          </ul>
          <Link href="/randevu"
            className="inline-block mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors">
            Skorunu Yükselt →
          </Link>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          🔒 Tüm isimler gizlilik için anonimleştirilmiştir (A*** Y***)
        </p>
      </div>
    </main>
  )
}
