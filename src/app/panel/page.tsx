export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import EGSScoreBar, { type EGSPhase } from '@/components/EGSScoreBar'
import EGSScoreChart, { type ScorePoint } from '@/components/EGSScoreChart'

const APT_STATUS_LABEL: Record<string, string> = {
  pending: 'Beklemede',
  confirmed: 'Onaylandı',
  completed: 'Tamamlandı',
  cancelled: 'İptal',
}

const APT_STATUS_COLOR: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  confirmed: 'bg-blue-500/20 text-blue-400',
  completed: 'bg-emerald-500/20 text-emerald-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

async function cancelAppointment(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const appointmentId = formData.get('appointmentId') as string
  await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId)
  redirect('/panel')
}

export default async function PanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: allAnalysesRaw } = await supabase
    .from('analyses')
    .select('id, web_overall, temp_overall, final_overall, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(30)

  // Son 5'i (azalan) liste için
  const analyses = [...(allAnalysesRaw ?? [])].reverse().slice(0, 5)

  // Grafik için tüm skor noktaları
  const chartPoints: ScorePoint[] = (allAnalysesRaw ?? []).flatMap(a => {
    const pts: ScorePoint[] = []
    const aiScore = a.web_overall ?? a.temp_overall
    if (aiScore != null) pts.push({ date: a.created_at, score: aiScore, type: 'ai_analiz' })
    if (a.final_overall != null) pts.push({ date: a.created_at, score: a.final_overall, type: 'klinik_onayli' })
    return pts
  })

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, appointment_date, status, clinics(name)')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: false })
    .limit(5)

  const latestAnalysis = analyses[0] ?? null
  const latestScore = latestAnalysis?.final_overall ?? latestAnalysis?.temp_overall ?? latestAnalysis?.web_overall ?? null

  // Mevcut EGS aşamasını belirle
  function getCurrentPhase(): EGSPhase {
    if (!latestAnalysis) return 'ai_analiz'
    if (latestAnalysis.final_overall) return 'klinik_onayli'
    if (latestAnalysis.temp_overall) return 'longevity_anketi'
    return 'ai_analiz'
  }
  const currentPhase = getCurrentPhase()

  async function handleSignOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect('/giris')
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Estelongy</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm hidden sm:block">{profile?.full_name ?? user.email}</span>
              <form action={handleSignOut}>
                <button type="submit" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        {/* Hoşgeldin */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">
            Merhaba, <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{profile?.full_name?.split(' ')[0] ?? 'Kullanıcı'}</span> 👋
          </h1>
          <p className="text-slate-400 mt-1">Cilt sağlığınızı takip edin</p>
        </div>

        {/* EGS Skor Kartı */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* EGS Bar — 2 kolon */}
          <div className="lg:col-span-2 p-6 rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            {latestScore !== null ? (
              <EGSScoreBar
                score={latestScore}
                phase={currentPhase}
                animated={false}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                </div>
                <p className="text-white font-semibold mb-1">EGS Skorunuz Henüz Yok</p>
                <p className="text-slate-400 text-sm mb-4">Selfie yükleyerek gençlik skorunuzu öğrenin</p>
                <a href="/analiz" className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity">
                  Analizi Başlat →
                </a>
              </div>
            )}
          </div>

          {/* Hızlı aksiyonlar */}
          <div className="flex flex-col gap-4">
            <a href="/analiz" className="flex-1 group p-5 rounded-2xl border border-violet-500/30 bg-violet-500/10 hover:bg-violet-500/20 hover:scale-[1.02] transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-3 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-0.5">{latestScore ? 'Yeni Analiz' : 'Analizi Başlat'}</h3>
              <p className="text-slate-400 text-xs">Skorunu güncelle</p>
            </a>

            {/* Longevity Anketi — sadece AI skoru var ama anket doldurmamışsa göster */}
            {latestAnalysis?.web_overall != null && !latestAnalysis?.temp_overall && (
              <a href="/anket" className="flex-1 group p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden">
                <div className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  +10 EGS
                </div>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-3 text-white">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="text-white font-bold mb-0.5">Longevity Anketi</h3>
                <p className="text-slate-400 text-xs">Yaşam tarzı → skor artır</p>
              </a>
            )}

            <a href="/randevu" className="flex-1 group p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 hover:scale-[1.02] transition-all cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-white font-bold mb-0.5">Randevu Al</h3>
              <p className="text-slate-400 text-xs">Skoru klinikle onayla</p>
            </a>
          </div>
        </div>

        {/* EGS Skor Geçmişi */}
        {chartPoints.length > 0 && (
          <div className="mb-6 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Skor Geçmişi</h2>
              <span className="text-xs text-slate-500">{chartPoints.length} veri noktası</span>
            </div>
            <EGSScoreChart points={chartPoints} />
          </div>
        )}

        {/* Son analizler */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <h2 className="text-lg font-bold text-white mb-4">Son Analizler</h2>
            {analyses && analyses.length > 0 ? (
              <div className="space-y-3">
                {analyses.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                    <div>
                      <div className="text-white text-sm font-medium">
                        Skor: {a.final_overall ?? a.temp_overall ?? a.web_overall ?? '—'}
                      </div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {new Date(a.created_at).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      a.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-violet-500/20 text-violet-400'
                    }`}>
                      {a.status === 'completed' ? 'Tamamlandı' : 'Beklemede'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Henüz analiz yok. <a href="/analiz" className="text-violet-400 hover:text-violet-300">İlk analizini yap →</a></p>
            )}
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Randevularım</h2>
              <a href="/randevu" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">+ Yeni Randevu</a>
            </div>
            {appointments && appointments.length > 0 ? (
              <div className="space-y-3">
                {(appointments as unknown as Array<{id: string; appointment_date: string | null; status: string; clinics: {name: string} | null}>).map((apt) => (
                  <div key={apt.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl">
                    <div className="min-w-0 flex-1">
                      <div className="text-white text-sm font-medium">{apt.clinics?.name ?? 'Klinik'}</div>
                      <div className="text-slate-500 text-xs mt-0.5">
                        {apt.appointment_date ? new Date(apt.appointment_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }) : '—'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${APT_STATUS_COLOR[apt.status] ?? APT_STATUS_COLOR.pending}`}>
                        {APT_STATUS_LABEL[apt.status] ?? apt.status}
                      </span>
                      {(apt.status === 'pending' || apt.status === 'confirmed') && (
                        <form action={cancelAppointment}>
                          <input type="hidden" name="appointmentId" value={apt.id} />
                          <button type="submit" className="text-slate-500 hover:text-red-400 transition-colors" title="İptal et">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </form>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-sm mb-3">Henüz randevunuz yok.</p>
                <a href="/randevu" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-xl transition-colors">
                  Randevu Al →
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}
