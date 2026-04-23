'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Randevu üzerine işlem notu ve hekim önerilerini kaydet.
 *  RLS: appointments_clinic_update — klinik kendi randevusunu günceller. */
export async function saveVisitNotesAction(
  appointmentId: string,
  userId: string,
  procedureNotes: string,
  recommendations: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  if (procedureNotes.length > 4000) return { ok: false, error: 'İşlem notu 4000 karakteri geçemez' }
  if (recommendations.length > 4000) return { ok: false, error: 'Öneriler 4000 karakteri geçemez' }

  const { error } = await supabase
    .from('appointments')
    .update({
      procedure_notes: procedureNotes.trim() || null,
      recommendations: recommendations.trim() || null,
    })
    .eq('id', appointmentId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/klinik/panel/hasta/${userId}`)
  revalidatePath('/panel')
  return { ok: true }
}
