'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

interface KuponInput {
  code: string
  type: 'percent' | 'fixed'
  value: number
  minOrder: number
  maxUses: number | null
  validUntil: string | null
}

export async function kuponOlusturAction(
  input: KuponInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') {
    return { ok: false, error: 'Yetkisiz' }
  }

  const code = input.code.trim().toUpperCase()
  if (!code || code.length < 3) return { ok: false, error: 'Geçersiz kupon kodu' }
  if (input.value <= 0) return { ok: false, error: 'İndirim değeri 0\'dan büyük olmalı' }
  if (input.type === 'percent' && input.value > 100) return { ok: false, error: 'Yüzde 100\'ü geçemez' }

  const { error } = await supabase.from('coupons').insert({
    code,
    discount_type:    input.type,
    discount_value:   input.value,
    min_order_amount: input.minOrder,
    max_uses:         input.maxUses,
    valid_until:      input.validUntil ? new Date(input.validUntil).toISOString() : null,
    is_active:        true,
    created_by:       user.id,
  })

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Bu kupon kodu zaten mevcut' }
    return { ok: false, error: error.message }
  }

  revalidatePath('/admin/kuponlar')
  return { ok: true }
}

export async function kuponAktiflikAction(
  couponId: string,
  isActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')
  if ((user.app_metadata as Record<string, string>)?.role !== 'admin') {
    return { ok: false, error: 'Yetkisiz' }
  }

  const { error } = await supabase
    .from('coupons')
    .update({ is_active: isActive })
    .eq('id', couponId)

  if (error) return { ok: false, error: error.message }
  revalidatePath('/admin/kuponlar')
  return { ok: true }
}
