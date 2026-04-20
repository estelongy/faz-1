'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function getVendor() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor || vendor.approval_status !== 'approved') {
    return { ok: false as const, error: 'Yetkisiz' }
  }
  return { ok: true as const, supabase, vendor }
}

export async function kargoGuncelleAction(
  orderItemId: string,
  trackingNumber: string,
  carrier: string
): Promise<{ ok: boolean; error?: string }> {
  const r = await getVendor()
  if (!r.ok) return { ok: false, error: r.error }
  const { supabase, vendor } = r

  if (!trackingNumber.trim()) return { ok: false, error: 'Takip numarası gerekli' }

  const { error } = await supabase
    .from('order_items')
    .update({
      fulfillment_status: 'shipped',
      tracking_number:    trackingNumber.trim(),
      tracking_carrier:   carrier,
      shipped_at:         new Date().toISOString(),
    })
    .eq('id', orderItemId)
    .eq('vendor_id', vendor.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel/siparisler')
  return { ok: true }
}

export async function fulfillmentGuncelleAction(
  orderItemId: string,
  status: 'preparing' | 'delivered' | 'cancelled'
): Promise<{ ok: boolean; error?: string }> {
  const r = await getVendor()
  if (!r.ok) return { ok: false, error: r.error }
  const { supabase, vendor } = r

  const patch: Record<string, unknown> = { fulfillment_status: status }
  if (status === 'delivered') patch.delivered_at = new Date().toISOString()

  const { error } = await supabase
    .from('order_items')
    .update(patch)
    .eq('id', orderItemId)
    .eq('vendor_id', vendor.id)

  if (error) return { ok: false, error: error.message }

  revalidatePath('/satici/panel/siparisler')
  return { ok: true }
}
