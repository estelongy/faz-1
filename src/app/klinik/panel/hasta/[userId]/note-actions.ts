'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

/** Hasta için klinik notu ekle. RLS klinik sahipliğini kontrol eder. */
export async function addNoteAction(
  userId: string,
  note: string,
  pinned: boolean = false,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  if (!note.trim()) return { ok: false, error: 'Not boş olamaz' }
  if (note.length > 2000) return { ok: false, error: 'Not 2000 karakteri geçemez' }

  // Klinik bul
  const { data: clinic } = await supabase
    .from('clinics')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (!clinic) return { ok: false, error: 'Klinik bulunamadı' }

  const { error } = await supabase.from('clinic_patient_notes').insert({
    clinic_id: clinic.id,
    user_id: userId,
    note: note.trim(),
    author_id: user.id,
    pinned,
  })

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/klinik/panel/hasta/${userId}`)
  return { ok: true }
}

/** Notu sil. RLS sadece klinik kendi notlarını silebilir. */
export async function deleteNoteAction(
  noteId: string,
  userId: string,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { error } = await supabase
    .from('clinic_patient_notes')
    .delete()
    .eq('id', noteId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/klinik/panel/hasta/${userId}`)
  return { ok: true }
}

/** Notu sabitle/sabitleme kaldır. */
export async function togglePinNoteAction(
  noteId: string,
  userId: string,
  pinned: boolean,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false, error: 'Oturum yok' }

  const { error } = await supabase
    .from('clinic_patient_notes')
    .update({ pinned, updated_at: new Date().toISOString() })
    .eq('id', noteId)

  if (error) return { ok: false, error: error.message }

  revalidatePath(`/klinik/panel/hasta/${userId}`)
  return { ok: true }
}
