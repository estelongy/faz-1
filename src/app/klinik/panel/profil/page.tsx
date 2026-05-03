export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Klinik Profilim',
}

export default async function KlinikProfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, location, bio, specialties, clinic_type, created_at')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/basvur')

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Klinik Profilim</h1>
        <p className="text-slate-400 mt-0.5 text-sm">Hastaların gördüğü kliniğinize ait bilgiler.</p>
      </div>

      {/* Profil kartı */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-white">{clinic.name}</h2>
              <p className="text-slate-400 text-sm">{clinic.clinic_type ?? 'Klinik'} · {clinic.location ?? '—'}</p>
            </div>
          </div>
          {/* EGP rozet placeholder — Hekim Dostu Model Faz 1 ile dolacak */}
          <div className="text-right">
            <div className="inline-flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl bg-slate-900/60 border border-slate-700">
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">EGP</span>
              <span className="text-2xl font-black text-slate-600">—</span>
              <span className="text-[9px] text-slate-600">Faz 1: Ölçüm Dönemi</span>
            </div>
          </div>
        </div>

        <div className="space-y-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Hakkında</p>
            <p className="text-slate-300 leading-relaxed">{clinic.bio ?? 'Henüz açıklama eklenmemiş.'}</p>
          </div>

          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Uzmanlık Alanları</p>
            <div className="flex flex-wrap gap-2">
              {((clinic.specialties as string[]) ?? []).length > 0
                ? (clinic.specialties as string[]).map(s => (
                    <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-violet-500/10 border border-violet-500/30 text-violet-300">
                      {s}
                    </span>
                  ))
                : <span className="text-slate-600 text-xs">—</span>}
            </div>
          </div>

          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Estelongy üyeliği</p>
            <p className="text-slate-300 text-sm">
              {new Date(clinic.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })} tarihinden beri
            </p>
          </div>
        </div>
      </div>

      {/* Hekim Dostu Model — Faz 1 önizleme */}
      <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5 mb-6">
        <div className="flex items-start gap-3">
          <div className="text-2xl shrink-0">🏆</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm mb-1">
              Estelongy Klinik Standartları
              <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Faz 1
              </span>
            </p>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              <strong className="text-emerald-300">Hekim Dostu Model</strong> — yorum platformu değil ölçüm platformuyuz.
              Hasta sonuçları (skor değişimi, NPS, operasyonel kalite) ölçülüyor.
              6-12 ay veri toplandıktan sonra <strong className="text-white">algoritmik EGP rozeti</strong> aktif olacak.
              Sonra <strong className="text-emerald-300">ELS sertifika kademeleri</strong> (Bronze/Silver/Gold/Platinum).
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span>📈 Sonuç Etkinliği</span>
              <span>·</span>
              <span>💚 Tavsiye (NPS)</span>
              <span>·</span>
              <span>🛡️ Doğru Endikasyon</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı linkler */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/klinik/panel/musaitlik"
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700 hover:border-violet-500/40 transition-colors">
          <span className="text-2xl">📅</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold">Müsaitlik Saatleri</p>
            <p className="text-slate-500 text-xs">Hangi gün/saat randevu alıyorsun</p>
          </div>
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700 opacity-70">
          <span className="text-2xl">✏️</span>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-bold">Profili Düzenle</p>
            <p className="text-slate-500 text-xs">Bio, fotoğraf, uzmanlık alanları</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
            Yakında
          </span>
        </div>
      </div>
    </div>
  )
}
