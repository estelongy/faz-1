export const dynamic = 'force-dynamic'

import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KlinikWelcome from '@/components/KlinikWelcome'
import { enqueueNotification } from '@/lib/notifications'

export const metadata: Metadata = {
  title: 'Klinik Paneli',
}

type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'

interface Appointment {
  id: string
  user_id: string
  appointment_date: string | null
  status: AppointmentStatus
  notes: string | null
  profiles: { full_name: string | null } | null
}

const STATUS_LABEL: Record<AppointmentStatus, string> = {
  pending:     'Beklemede',
  confirmed:   'Onaylandı',
  in_progress: 'Görüşmede',
  completed:   'Tamamlandı',
  cancelled:   'İptal',
  no_show:     'Gelmedi',
}

const STATUS_COLOR: Record<AppointmentStatus, string> = {
  pending:     'bg-amber-500/20 text-amber-400',
  confirmed:   'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-violet-500/20 text-violet-400',
  completed:   'bg-emerald-500/20 text-emerald-400',
  cancelled:   'bg-red-500/20 text-red-400',
  no_show:     'bg-slate-500/20 text-slate-400',
}

function scoreColorClass(s: number) {
  if (s >= 90) return 'text-[#00d4ff]'
  if (s >= 75) return 'text-emerald-400'
  if (s >= 50) return 'text-amber-400'
  return 'text-red-400'
}

async function updateAppointmentStatus(formData: FormData) {
  'use server'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: clinic } = await supabase.from('clinics').select('id').eq('user_id', user.id).single()
  if (!clinic) return

  const appointmentId = formData.get('appointmentId') as string
  const status = formData.get('status') as AppointmentStatus
  await supabase
    .from('appointments')
    .update({
      status,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
      ...(status === 'confirmed'  ? { confirmed_at: new Date().toISOString() } : {}),
      ...(status === 'no_show'    ? { no_show_at:   new Date().toISOString() } : {}),
    })
    .eq('id', appointmentId)
    .eq('clinic_id', clinic.id)

  // Onaylandıysa bildirim kuyruğuna ekle (e-posta + SMS — telefon doğrulanmışsa)
  if (status === 'confirmed') {
    try {
      const { data: appt } = await supabase
        .from('appointments')
        .select('user_id, appointment_date, clinics(name), profiles(full_name, phone, phone_verified)')
        .eq('id', appointmentId)
        .single()
      if (appt) {
        const clinicName = (appt.clinics as { name?: string } | null)?.name ?? 'Klinik'
        const profileObj = appt.profiles as { full_name?: string | null; phone?: string | null; phone_verified?: boolean } | null
        const patientName = profileObj?.full_name ?? 'Hasta'
        const phoneVerified = !!profileObj?.phone_verified
        const dateStr = appt.appointment_date
          ? new Date(appt.appointment_date).toLocaleString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
          : ''
        const payload = { patient_name: patientName, clinic_name: clinicName, date: dateStr }

        // 1) Anında onay bildirimi (e-posta + SMS)
        await enqueueNotification({ userId: appt.user_id, type: 'appointment_confirmed', channel: 'email', payload })
        if (phoneVerified) {
          await enqueueNotification({ userId: appt.user_id, type: 'appointment_confirmed', channel: 'sms', payload })
        }

        // 2) Hatırlatma — 24 saat öncesi (Hobby plan günde 1 cron, 1h hatırlatma yok)
        if (appt.appointment_date) {
          const apptTime = new Date(appt.appointment_date).getTime()
          const reminderAt = new Date(apptTime - 24 * 60 * 60 * 1000)
          if (reminderAt.getTime() > Date.now()) {
            await enqueueNotification({ userId: appt.user_id, type: 'appointment_reminder_24h', channel: 'email', payload, scheduledAt: reminderAt })
            if (phoneVerified) {
              await enqueueNotification({ userId: appt.user_id, type: 'appointment_reminder_24h', channel: 'sms', payload, scheduledAt: reminderAt })
            }
          }
        }
      }
    } catch (e) {
      console.error('Notification queue error:', e)
    }
  }

  redirect('/klinik/panel')
}

export default async function KlinikPanelPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  // Layout zaten role kontrolü + clinic kaydı + approval_status kontrolünü yapıyor.
  // Burada yine clinic'i çekiyoruz çünkü sayfa içeriği için id/jeton bilgisi lazım.
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, jeton_balance, free_appointments_remaining')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!clinic) redirect('/klinik/basvur')

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, user_id, appointment_date, status, notes, profiles(full_name)')
    .eq('clinic_id', clinic.id)
    .order('appointment_date', { ascending: true })
    .limit(100)

  const appts = (appointments ?? []) as unknown as Appointment[]

  // ── Her kullanıcının son EGS skorunu çek ────────────────────
  const userIds = Array.from(new Set(appts.map(a => a.user_id).filter(Boolean)))
  const { data: latestAnalyses } = userIds.length > 0
    ? await supabase
        .from('analyses')
        .select('user_id, web_overall, temp_overall, final_overall')
        .in('user_id', userIds)
        .order('created_at', { ascending: false })
    : { data: [] }

  const scoreMap = new Map<string, { score: number; isFinal: boolean }>()
  for (const a of latestAnalyses ?? []) {
    if (!scoreMap.has(a.user_id)) {
      const score = a.final_overall ?? a.temp_overall ?? a.web_overall
      if (score != null) scoreMap.set(a.user_id, { score, isFinal: !!a.final_overall })
    }
  }

  const pendingCount   = appts.filter(a => a.status === 'pending').length
  const confirmedCount = appts.filter(a => a.status === 'confirmed').length
  const inProgCount    = appts.filter(a => a.status === 'in_progress').length
  const completedCount = appts.filter(a => a.status === 'completed').length

  const today = new Date().toISOString().split('T')[0]
  const todayAppts = appts.filter(a => a.appointment_date?.startsWith(today))

  return (
    <div className="max-w-7xl mx-auto">

        {/* ── İlk kullanım: hiç randevu yok → Welcome State ── */}
        {clinic && appts.length === 0 ? (
          <KlinikWelcome
            clinicName={clinic.name}
            clinicId={clinic.id}
            jetonBalance={clinic.jeton_balance ?? 0}
            freeBalance={(clinic as { free_appointments_remaining?: number }).free_appointments_remaining ?? 0}
          />
        ) : (
        <>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Klinik Paneli</h1>
          <p className="text-slate-400 mt-1">{clinic?.name ?? 'Kliniğiniz'} — randevu yönetimi</p>
        </div>

        {!clinic && (
          <div className="mb-8 p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-amber-400 font-bold mb-1">Klinik kaydı bulunamadı</h3>
                <p className="text-slate-400 text-sm">
                  Klinik başvurusu yapmak için{' '}
                  <Link href="/klinik/basvur" className="text-amber-400 hover:text-amber-300 font-medium">buraya tıklayın →</Link>
                </p>
              </div>
            </div>
          </div>
        )}

        {clinic && (() => {
          const freeBal = (clinic as { free_appointments_remaining?: number }).free_appointments_remaining ?? 0
          const totalBal = (clinic.jeton_balance ?? 0) + freeBal
          if (totalBal !== 0) return null
          return (
            <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-400 text-sm">
                  <strong>Krediniz tükendi.</strong> Hasta kabulü kapalı ve klinik randevu sisteminde gizlendiniz. Kredi yükleyin veya Estelongy ile iletişime geçin.
                </p>
              </div>
              <Link href="/klinik/panel/jeton"
                className="shrink-0 px-3 py-1.5 bg-red-500 hover:bg-red-400 text-white text-xs font-bold rounded-lg transition-colors">
                Kredi Al →
              </Link>
            </div>
          )
        })()}

        {clinic && (() => {
          const freeBal = (clinic as { free_appointments_remaining?: number }).free_appointments_remaining ?? 0
          const totalBal = (clinic.jeton_balance ?? 0) + freeBal
          if (totalBal === 0 || totalBal > 10) return null
          return (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p className="text-amber-400 text-sm">
                  Yalnızca <strong>{totalBal}</strong> krediniz kaldı. Tükendiğinde randevu kabulü kapanır.
                </p>
              </div>
              <Link href="/klinik/panel/jeton"
                className="shrink-0 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold rounded-lg transition-colors">
                Kredi Al →
              </Link>
            </div>
          )
        })()}

        {/* İstatistik kartları */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {[
            { label: 'Toplam',     value: appts.length,  color: 'from-violet-500 to-purple-600'   },
            { label: 'Bekleyen',   value: pendingCount,  color: 'from-amber-500 to-orange-600'    },
            { label: 'Onaylanan',  value: confirmedCount,color: 'from-blue-500 to-cyan-600'        },
            { label: 'Görüşmede',  value: inProgCount,   color: 'from-fuchsia-500 to-violet-600'  },
            { label: 'Tamamlanan', value: completedCount,color: 'from-emerald-500 to-teal-600'    },
          ].map(({ label, value, color }) => (
            <div key={label} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="text-3xl font-bold text-white mb-0.5">{value}</div>
              <div className={`text-sm bg-gradient-to-r ${color} bg-clip-text text-transparent font-medium`}>{label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bugün */}
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Bugün
              {todayAppts.length > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                  {todayAppts.length}
                </span>
              )}
            </h2>
            {todayAppts.length > 0 ? (
              <div className="space-y-3">
                {todayAppts.map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} scoreInfo={scoreMap.get(apt.user_id)} action={updateAppointmentStatus} compact />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Bugün randevu yok</p>
            )}
          </div>

          {/* Bekleyen onaylar */}
          <div className="lg:col-span-2 bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-white font-bold mb-4 flex items-center gap-2">
              {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              Bekleyen Randevular
              {pendingCount > 0 && (
                <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {pendingCount} onay bekliyor
                </span>
              )}
            </h2>
            {appts.filter(a => a.status === 'pending').length > 0 ? (
              <div className="space-y-3">
                {appts.filter(a => a.status === 'pending').map(apt => (
                  <AppointmentCard key={apt.id} apt={apt} scoreInfo={scoreMap.get(apt.user_id)} action={updateAppointmentStatus} />
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-sm text-center py-8">Bekleyen randevu yok</p>
            )}
          </div>
        </div>

        {/* Tüm randevular tablosu */}
        <div className="mt-6 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h2 className="text-white font-bold">Tüm Randevular ({appts.length})</h2>
          </div>
          {appts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800">
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Hasta</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Gençlik Skoru</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Tarih & Saat</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">Durum</th>
                    <th className="text-left px-4 py-3 text-slate-400 font-medium">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {appts.map(apt => {
                    const si = scoreMap.get(apt.user_id)
                    return (
                      <tr key={apt.id} className="hover:bg-slate-800/40 transition-colors group">
                        <td className="px-4 py-3">
                          <Link href={`/klinik/panel/hasta/${apt.user_id}`}
                            className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                              {(apt.profiles?.full_name ?? '?')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="text-white font-medium group-hover:text-violet-400 transition-colors">
                                {apt.profiles?.full_name ?? 'Hasta'}
                              </div>
                              {apt.notes && <div className="text-slate-500 text-xs truncate max-w-48">{apt.notes}</div>}
                            </div>
                          </Link>
                        </td>
                        <td className="px-4 py-3">
                          {si ? (
                            <div className="flex items-center gap-1">
                              <span className={`font-black text-base ${scoreColorClass(si.score)}`}>{si.score}</span>
                              {si.isFinal && <span className="text-[9px] text-[#00d4ff] font-bold">✦</span>}
                            </div>
                          ) : (
                            <span className="text-slate-700 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                          {apt.appointment_date
                            ? new Date(apt.appointment_date).toLocaleDateString('tr-TR', {
                                day: 'numeric', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                              })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[apt.status] ?? STATUS_COLOR.pending}`}>
                            {STATUS_LABEL[apt.status] ?? apt.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <AppointmentActions apt={apt} action={updateAppointmentStatus} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">Henüz randevu yok</div>
          )}
        </div>

        </>
        )}

    </div>
  )
}

function AppointmentCard({
  apt, scoreInfo, action, compact,
}: {
  apt: Appointment
  scoreInfo?: { score: number; isFinal: boolean }
  action: (f: FormData) => Promise<void>
  compact?: boolean
}) {
  return (
    <div className="p-3 bg-slate-900/50 rounded-xl">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2 min-w-0">
          <Link href={`/klinik/panel/hasta/${apt.user_id}`}
            className="text-white text-sm font-medium hover:text-violet-400 transition-colors truncate">
            {apt.profiles?.full_name ?? 'Hasta'}
          </Link>
          {scoreInfo && (
            <span className={`text-xs font-black shrink-0 ${scoreColorClass(scoreInfo.score)}`}>
              {scoreInfo.score}{scoreInfo.isFinal ? '✦' : ''}
            </span>
          )}
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLOR[apt.status]}`}>
          {STATUS_LABEL[apt.status]}
        </span>
      </div>
      <div className="text-slate-400 text-xs mb-2">
        {apt.appointment_date
          ? new Date(apt.appointment_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
          : '—'}
      </div>
      {!compact && <AppointmentActions apt={apt} action={action} />}
    </div>
  )
}

function AppointmentActions({
  apt, action,
}: {
  apt: Appointment
  action: (f: FormData) => Promise<void>
}) {
  if (apt.status === 'cancelled' || apt.status === 'completed' || apt.status === 'no_show') {
    return <span className="text-slate-600 text-xs">—</span>
  }
  return (
    <div className="flex gap-1 flex-wrap items-center">
      {(apt.status === 'confirmed' || apt.status === 'in_progress') && (
        <Link href={`/klinik/panel/randevu/${apt.id}`}
          className="px-2 py-1 bg-violet-600 hover:bg-violet-500 text-white text-xs rounded-lg transition-colors font-medium">
          {apt.status === 'in_progress' ? 'Devam →' : 'Başlat →'}
        </Link>
      )}
      {apt.status === 'pending' && (
        <form action={action}>
          <input type="hidden" name="appointmentId" value={apt.id} />
          <input type="hidden" name="status" value="confirmed" />
          <button type="submit" className="px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded-lg transition-colors">
            Onayla
          </button>
        </form>
      )}
      {apt.status === 'confirmed' && (
        <form action={action}>
          <input type="hidden" name="appointmentId" value={apt.id} />
          <input type="hidden" name="status" value="no_show" />
          <button type="submit" className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-400 text-xs rounded-lg transition-colors border border-slate-600">
            Gelmedi
          </button>
        </form>
      )}
      {apt.status !== 'in_progress' && (
        <form action={action}>
          <input type="hidden" name="appointmentId" value={apt.id} />
          <input type="hidden" name="status" value="cancelled" />
          <button type="submit" className="px-2 py-1 bg-red-900/50 hover:bg-red-800/50 text-red-400 text-xs rounded-lg transition-colors border border-red-800/50">
            İptal
          </button>
        </form>
      )}
    </div>
  )
}
