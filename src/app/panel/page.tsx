export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Panelim',
  description: 'Gençlik Skorunuzu takip edin, randevularınızı yönetin.',
}
import { createClient } from '@/lib/supabase/server'
import { pathForRole } from '@/lib/auth-redirect'
import ScoreBar from '@/components/ScoreBar'
import { getSkorDurumu, getScorePhase, getSkorDurumuLabel, getSkorDurumuColor } from '@/lib/skor-durum'
import PaylasModal from '@/components/PaylasModal'

export default async function PanelPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = await searchParams
  const basvuruSuccess = params.basvuru
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Rol bazlı yönlendirme — yalnızca user rolü bu sayfayı görür
  const role = (user.app_metadata as Record<string, string>)?.role
  if (role && role !== 'user') redirect(pathForRole(role))

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, birth_year, points_balance')
    .eq('id', user.id)
    .single()

  // Sadece en son analiz (panel sade kalsın)
  const { data: latestAnalysis } = await supabase
    .from('analyses')
    .select('id, web_overall, temp_overall, final_overall, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Aktif randevu (en son pending/confirmed/in_progress)
  const { data: activeAppt } = await supabase
    .from('appointments')
    .select('id, appointment_date, status, clinics(name)')
    .eq('user_id', user.id)
    .in('status', ['pending', 'confirmed', 'in_progress'])
    .order('appointment_date', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Kullanıcının kliniği var mı? (klinik paneli linki için)
  const { data: userClinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  const latestScore = latestAnalysis?.final_overall ?? latestAnalysis?.temp_overall ?? latestAnalysis?.web_overall ?? null

  // En son skor satırını çek (durumu hesaplamak için)
  const { data: latestScoreRow } = latestAnalysis
    ? await supabase
        .from('scores')
        .select('c250_base, hasta_anket_puani, klinik_anket_puani, tetkik_puani, hekim_degerlendirme, hekim_onay_puani')
        .eq('analysis_id', latestAnalysis.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null }

  const skorDurumu = getSkorDurumu(latestAnalysis, latestScoreRow, activeAppt as { status: string } | null)
  const skorDurumLabel = getSkorDurumuLabel(skorDurumu)
  const skorDurumColors = getSkorDurumuColor(skorDurumu)
  const currentPhase = getScorePhase(latestAnalysis, latestScoreRow, activeAppt as { status: string } | null)

  // ── Sıradaki Adım CTA — faza göre dinamik ──────────────────────────────
  const nextAction = (() => {
    // 1) Hiç analiz yok → ilk analiz
    if (!latestAnalysis) {
      return {
        emoji: '📸',
        title: 'İlk analizinizi yapın',
        desc: 'Selfie ile gençlik skorunuzu öğrenin',
        href: '/analiz',
        cta: 'Analizi Başlat →',
        gradient: 'from-violet-600 to-purple-600',
      }
    }
    // 2) Klinik onaylı → paylaş + 6 ay sonra yenile
    if (latestAnalysis.final_overall != null) {
      return {
        emoji: '🎉',
        title: 'Klinik onaylı skorun hazır',
        desc: 'Skorunuzu paylaşın veya 6 ay sonra yeniden ölçün',
        href: '/analiz',
        cta: 'Yeni Analiz Yap →',
        gradient: 'from-emerald-600 to-teal-600',
      }
    }
    // 3) Aktif randevu var → randevu detayına git
    if (activeAppt) {
      const apt = activeAppt as unknown as { id: string; appointment_date: string | null; status: string; clinics: { name: string } | null }
      const dateStr = apt.appointment_date
        ? new Date(apt.appointment_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
        : '—'
      return {
        emoji: '📅',
        title: `Randevunuz var: ${dateStr}`,
        desc: apt.clinics?.name ?? 'Klinik',
        href: '/panel/randevularim',
        cta: 'Randevuya Git →',
        gradient: 'from-blue-600 to-cyan-600',
      }
    }
    // 4) Anket dolduruldu, randevu yok → randevu al
    if (latestAnalysis.temp_overall != null) {
      return {
        emoji: '🏥',
        title: 'Klinik randevusu alın',
        desc: 'Hekim muayenesiyle skorunuzu kesinleştirin',
        href: '/randevu',
        cta: 'Randevu Al →',
        gradient: 'from-blue-600 to-cyan-600',
      }
    }
    // 5) Ön analiz var, anket yok → anket doldur
    if (latestAnalysis.web_overall != null) {
      return {
        emoji: '📋',
        title: 'Anketinizi doldurun, ek puan kazanın',
        desc: '5 soru, 3-5 dakika · maks +3.6 puan',
        href: `/skor?analysisId=${latestAnalysis.id}&open=anket`,
        cta: 'Anketi Aç →',
        gradient: 'from-amber-600 to-orange-600',
      }
    }
    // Fallback
    return {
      emoji: '📸',
      title: 'Yeni analiz yap',
      desc: 'Skorunuzu güncelleyin',
      href: '/analiz',
      cta: 'Analize Git →',
      gradient: 'from-violet-600 to-purple-600',
    }
  })()

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
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Estelongy</span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-slate-400 text-sm hidden sm:block">{profile?.full_name ?? user.email}</span>
              {userClinic && (
                <Link href="/klinik/panel" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors hidden sm:block">
                  Klinik Paneli →
                </Link>
              )}
              <form action={handleSignOut}>
                <button type="submit" className="text-sm text-slate-400 hover:text-white transition-colors">
                  Çıkış
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16 space-y-6">

        {/* Başvuru başarı mesajı */}
        {basvuruSuccess && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-emerald-300 font-medium text-sm">
                {basvuruSuccess === 'klinik' ? 'Klinik başvurunuz alındı!' : 'Satıcı başvurunuz alındı!'}
              </p>
              <p className="text-emerald-400/70 text-xs mt-0.5">
                Başvurunuz en kısa sürede incelenecek, onaylandığında bilgilendirileceksiniz.
              </p>
            </div>
          </div>
        )}

        {/* Hoşgeldin */}
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Merhaba,{' '}
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              {profile?.full_name?.split(' ')[0] ?? 'Kullanıcı'}
            </span>{' '}
            <span>👋</span>
          </h1>
          <p className="text-slate-400 text-sm">Cilt sağlığınızı takip edin</p>
        </div>

        {/* ─── BÖLGE 1: 3 KAPI — Hızlı Aksiyonlar (skorun üstünde) ── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Kapı 1 — Analiz */}
            <Link href="/analiz"
              className="group relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-600/15 via-purple-600/8 to-pink-500/5 p-5 transition-all hover:border-violet-400 hover:scale-[1.02]">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-violet-500/20 transition-all" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white mb-3 shadow-lg shadow-violet-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-base leading-tight mb-1">
                  {latestAnalysis ? 'Skoru Güncelle' : 'Skorunu Öğren'}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {latestAnalysis ? 'Yeni selfie ile skorunu yenile' : 'Selfie ile saniyeler içinde'}
                </p>
                <div className="mt-3 flex items-center gap-1 text-violet-300 text-xs font-semibold">
                  <span>{latestAnalysis ? 'Yeni Analiz' : 'Analizi Başlat'}</span>
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Kapı 2 — Randevu */}
            <Link href={activeAppt ? '/panel/randevularim' : '/randevu'}
              className="group relative overflow-hidden rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-600/15 via-cyan-600/8 to-teal-500/5 p-5 transition-all hover:border-blue-400 hover:scale-[1.02]">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white mb-3 shadow-lg shadow-blue-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-base leading-tight mb-1">
                  {activeAppt ? 'Aktif Randevun' : 'Klinikten Randevu Al'}
                </h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  {activeAppt ? 'Detayı görüntüle' : 'Onaylı estetik kliniklerinden'}
                </p>
                <div className="mt-3 flex items-center gap-1 text-blue-300 text-xs font-semibold">
                  <span>{activeAppt ? 'Randevuya Git' : 'Klinik Seç'}</span>
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Kapı 3 — Mağaza */}
            <Link href="/magaza"
              className="group relative overflow-hidden rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-600/15 via-orange-600/8 to-rose-500/5 p-5 transition-all hover:border-amber-400 hover:scale-[1.02]">
              <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-all" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-3 shadow-lg shadow-amber-500/30">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-white font-bold text-base leading-tight mb-1">Mağaza</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Estelongy puanlı bakım ürünleri
                </p>
                <div className="mt-3 flex items-center gap-1 text-amber-300 text-xs font-semibold">
                  <span>Ürünleri Gör</span>
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </section>

        {/* ─── BÖLGE 2: SKOR DURUMU ─────────────────────────────── */}
        <section className="p-6 rounded-2xl border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          {latestScore !== null && latestAnalysis ? (
            <>
              {/* Faz rozeti */}
              <div className="flex justify-center mb-3">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border"
                  style={{
                    color: skorDurumColors.fg,
                    background: skorDurumColors.bg,
                    borderColor: skorDurumColors.border,
                  }}
                >
                  {skorDurumu === 'klinik_onayli' && <span>✦</span>}
                  {skorDurumu === 'guncelleniyor' && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: skorDurumColors.fg }} />}
                  {skorDurumu === 'tahmini' && <span>ℹ</span>}
                  <span>{skorDurumLabel.toUpperCase()}</span>
                </div>
              </div>

              {/* Skor barı */}
              <ScoreBar score={latestScore} phase={currentPhase} animated={false} />

              {/* Aksiyon satırı */}
              <div className="mt-5 pt-5 border-t border-slate-700/50 flex flex-wrap items-center gap-3 justify-between">
                <div>
                  <p className="text-slate-500 text-xs">
                    {new Date(latestAnalysis.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/skor?analysisId=${latestAnalysis.id}`}
                    className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors"
                  >
                    Skor Detayı →
                  </Link>
                  <PaylasModal
                    analysisId={latestAnalysis.id}
                    score={latestScore}
                    firstName={profile?.full_name?.split(' ')[0] ?? 'Kullanıcı'}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <p className="text-white font-semibold mb-1">Gençlik Skorunuz Henüz Yok</p>
              <p className="text-slate-400 text-sm">Aşağıdaki butona tıklayarak ilk analizinizi yapın</p>
            </div>
          )}
        </section>

        {/* ─── BÖLGE 3: SIRADAKİ AKILLI ÖNERİ (kompakt) ───────────── */}
        <Link
          href={nextAction.href}
          className={`block p-4 rounded-xl bg-gradient-to-r ${nextAction.gradient} hover:opacity-95 transition-all shadow-md`}
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">{nextAction.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-[10px] uppercase tracking-widest font-bold">Sıradaki adım</p>
              <h3 className="text-white font-bold text-sm leading-tight">{nextAction.title}</h3>
            </div>
            <span className="text-white font-semibold text-xs shrink-0">{nextAction.cta}</span>
          </div>
        </Link>

        {/* ─── BÖLGE 3: YÖNETİM GRID ───────────────────────────── */}
        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 px-1">Yönetim</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            <YonetimKarti href="/panel/hesabim"      icon="👤" label="Hesabım" />
            <YonetimKarti href="/panel/analizlerim"  icon="📊" label="Analizlerim" />
            <YonetimKarti href="/panel/randevularim" icon="📅" label="Randevularım" />
            <YonetimKarti href="/panel/siparislerim" icon="📦" label="Siparişlerim" />
            <YonetimKarti href="/panel/iadelerim"    icon="↩" label="İadelerim" />
            <YonetimKarti href="/panel/adreslerim"   icon="📍" label="Adreslerim" />
            <YonetimKarti href="/panel/referral"     icon="🎁" label={profile?.points_balance ? `Puanım: ${profile.points_balance}` : 'Davet & Puan'} />
            <YonetimKarti href="/panel/leaderboard"  icon="🏆" label="Sıralama" />
          </div>
        </section>
      </div>
    </main>
  )
}

function YonetimKarti({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="p-4 rounded-2xl border border-slate-700 bg-slate-800/40 hover:bg-slate-800 hover:border-slate-600 hover:scale-[1.02] transition-all flex flex-col items-center text-center gap-2"
    >
      <span className="text-3xl">{icon}</span>
      <span className="text-white text-sm font-semibold leading-tight">{label}</span>
    </Link>
  )
}
