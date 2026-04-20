'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type AdresInput = {
  id?: string
  title: string
  full_name: string
  phone: string
  city: string
  district: string
  neighborhood?: string
  address_line: string
  postal_code?: string
  is_default?: boolean
}

async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  return { supabase, user }
}

export async function adresKaydetAction(input: AdresInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const { supabase, user } = await getUser()

  if (!input.title?.trim() || !input.full_name?.trim() || !input.phone?.trim()
   || !input.city?.trim()  || !input.district?.trim()  || !input.address_line?.trim()) {
    return { ok: false, error: 'Zorunlu alanlar eksik.' }
  }

  const patch = {
    user_id:      user.id,
    title:        input.title.trim(),
    full_name:    input.full_name.trim(),
    phone:        input.phone.trim(),
    city:         input.city.trim(),
    district:     input.district.trim(),
    neighborhood: input.neighborhood?.trim() || null,
    address_line: input.address_line.trim(),
    postal_code:  input.postal_code?.trim() || null,
    is_default:   input.is_default ?? false,
  }

  // Default seçildiyse diğerlerini default'tan düşür
  if (patch.is_default) {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
  }

  if (input.id) {
    const { error } = await supabase.from('addresses')
      .update(patch)
      .eq('id', input.id)
      .eq('user_id', user.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath('/panel/adreslerim')
    revalidatePath('/odeme')
    return { ok: true, id: input.id }
  }

  const { data, error } = await supabase.from('addresses').insert(patch).select('id').single()
  if (error) return { ok: false, error: error.message }
  revalidatePath('/panel/adreslerim')
  revalidatePath('/odeme')
  return { ok: true, id: data.id }
}

export async function adresSilAction(addressId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await getUser()
  const { error } = await supabase.from('addresses').delete()
    .eq('id', addressId).eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/panel/adreslerim')
  revalidatePath('/odeme')
  return { ok: true }
}

export async function adresVarsayilanYapAction(addressId: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase, user } = await getUser()
  await supabase.from('addresses').update({ is_default: false }).eq('user_id', user.id)
  const { error } = await supabase.from('addresses')
    .update({ is_default: true })
    .eq('id', addressId).eq('user_id', user.id)
  if (error) return { ok: false, error: error.message }
  revalidatePath('/panel/adreslerim')
  revalidatePath('/odeme')
  return { ok: true }
}
