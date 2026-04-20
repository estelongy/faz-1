'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ş/g, 's')
    .replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export type UrunEkleInput = {
  name: string
  category: string
  treatmentType: 'product' | 'treatment'
  description?: string
  price?: number | null
  ingredients?: string[]
}

export async function urunEkleAction(input: UrunEkleInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'vendor') return { ok: false, error: 'Satıcı yetkisi gerekli.' }

  // Kendi vendor kaydını bul — frontend'den vendorId güvenilmez
  const { data: vendor } = await supabase
    .from('vendors')
    .select('id, approval_status')
    .eq('user_id', user.id)
    .single()
  if (!vendor) return { ok: false, error: 'Satıcı kaydı bulunamadı.' }
  if (vendor.approval_status !== 'approved') return { ok: false, error: 'Satıcı hesabınız onaylı değil.' }

  if (!input.name?.trim()) return { ok: false, error: 'Ürün adı zorunludur.' }

  const baseSlug = slugify(input.name)
  const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`

  const { error: insertErr } = await supabase.from('products').insert({
    vendor_id:       vendor.id,
    name:            input.name.trim(),
    slug,
    category:        input.category,
    treatment_type:  input.treatmentType,
    description:     input.description?.trim() || null,
    price:           input.price ?? null,
    ingredients:     input.ingredients && input.ingredients.length > 0 ? input.ingredients : null,
    is_active:       false,
    approval_status: 'pending',
  })

  if (insertErr) return { ok: false, error: insertErr.message }

  revalidatePath('/satici/panel')
  return { ok: true }
}
