export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import MusaitlikForm from './MusaitlikForm'

export default async function MusaitlikPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { data: clinic } = await supabase
    .from('clinics')
    .select('id, name')
    .eq('user_id', user.id)
    .single()
  if (!clinic) redirect('/klinik/panel')

  const { data: availability } = await supabase
    .from('clinic_availability')
    .select('id, day_of_week, start_time, end_time, slot_duration_minutes, is_active')
    .eq('clinic_id', clinic.id)
    .order('day_of_week')

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 flex items-center gap-3">
        <Link href="/klinik/panel/takvim" className="text-slate-400 hover:text-white transition-colors text-sm">← Takvim</Link>
      </div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">Müsaitlik Takvimi</h1>
        <p className="text-slate-400 mt-0.5 text-sm">
          {clinic.name} — Hangi günler ve saatler randevu kabul ettiğinizi belirleyin.
          Bu bilgiler hastalar randevu alırken görünür.
        </p>
      </div>

      <MusaitlikForm
        clinicId={clinic.id}
        availability={(availability ?? []) as {
          id: string
          day_of_week: number
          start_time: string
          end_time: string
          slot_duration_minutes: number
          is_active: boolean
        }[]}
      />
    </div>
  )
}
