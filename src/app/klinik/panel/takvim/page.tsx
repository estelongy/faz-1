export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KlinikTakvimClient from './KlinikTakvimClient'

export default async function KlinikTakvimPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name, jeton_balance')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/panel')

  // Son 3 ay + önümüzdeki 3 ay
  const from = new Date()
  from.setMonth(from.getMonth() - 1)
  from.setDate(1)

  const to = new Date()
  to.setMonth(to.getMonth() + 3)
  to.setDate(0)

  const { data: appointments } = await supabase
    .from('appointments')
    .select('id, user_id, appointment_date, status, duration_minutes, profiles(full_name)')
    .eq('clinic_id', clinic.id)
    .gte('appointment_date', from.toISOString())
    .lte('appointment_date', to.toISOString())
    .order('appointment_date', { ascending: true })

  type RawAppt = {
    id: string
    user_id: string
    appointment_date: string | null
    status: string
    duration_minutes: number | null
    profiles: { full_name: string | null } | null
  }

  const appts = (appointments ?? []) as unknown as RawAppt[]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Takvim</h1>
        <Link href="/klinik/panel/musaitlik" className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors">
          ⚙ Müsaitlik Ayarları
        </Link>
      </div>
      <KlinikTakvimClient appointments={appts.map(a => ({
        id: a.id,
        userId: a.user_id,
        date: a.appointment_date ?? '',
        status: a.status,
        durationMinutes: a.duration_minutes ?? 30,
        patientName: (a.profiles as { full_name?: string | null } | null)?.full_name ?? 'Hasta',
      }))} />
    </div>
  )
}
