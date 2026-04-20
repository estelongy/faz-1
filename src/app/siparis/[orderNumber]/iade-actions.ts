'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

export type IadeInput = {
  orderItemId: string
  reason: string
  description?: string
}

export async function iadeTalebiOlusturAction(input: IadeInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  if (!input.reason?.trim()) return { ok: false, error: 'İade sebebi zorunlu' }

  // Ownership + status kontrolü: fulfillment shipped/delivered olmalı
  const { data: item } = await supabase
    .from('order_items')
    .select('id, fulfillment_status, delivered_at, shipped_at, orders!inner(user_id, payment_status)')
    .eq('id', input.orderItemId)
    .single()

  const order = (item?.orders as unknown as { user_id: string; payment_status: string } | null)
  if (!item || !order || order.user_id !== user.id) {
    return { ok: false, error: 'Sipariş bulunamadı' }
  }
  if (order.payment_status !== 'paid') {
    return { ok: false, error: 'Ödenmemiş siparişin iadesi olmaz' }
  }
  if (!['shipped', 'delivered'].includes(item.fulfillment_status)) {
    return { ok: false, error: 'Kargoya verilmemiş ürünün iadesi için önce siparişi iptal etmelisin' }
  }

  // Mevcut aktif iade talebi var mı
  const { data: existing } = await supabase
    .from('returns')
    .select('id, status')
    .eq('order_item_id', input.orderItemId)
    .in('status', ['pending', 'approved'])
    .maybeSingle()
  if (existing) return { ok: false, error: 'Bu ürün için zaten bir iade talebin var' }

  const { data, error } = await supabase
    .from('returns')
    .insert({
      user_id: user.id,
      order_item_id: input.orderItemId,
      reason: input.reason.trim(),
      description: input.description?.trim() || null,
    })
    .select('id')
    .single()

  if (error) return { ok: false, error: error.message }

  revalidatePath('/siparis')
  revalidatePath('/panel/iadelerim')
  return { ok: true, id: data.id }
}

export async function iadeIptalAction(returnId: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const { error } = await supabase
    .from('returns')
    .update({ status: 'cancelled', resolved_at: new Date().toISOString() })
    .eq('id', returnId)
    .eq('user_id', user.id)
    .eq('status', 'pending')

  if (error) return { ok: false, error: error.message }
  revalidatePath('/panel/iadelerim')
  return { ok: true }
}

// Satıcı: iade onayla / reddet
export async function iadeKararAction(
  returnId: string,
  decision: 'approved' | 'rejected',
  note?: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  const isAdmin = role === 'admin'

  // İadeyi getir, yetki kontrol
  const { data: ret } = await supabase
    .from('returns')
    .select('id, status, order_item_id, order_items(vendor_id, line_total, product_id, quantity, commission_amount, vendors(user_id), orders(stripe_payment_intent_id))')
    .eq('id', returnId)
    .single()
  if (!ret) return { ok: false, error: 'İade bulunamadı' }
  if (ret.status !== 'pending') return { ok: false, error: 'Bu iade zaten karara bağlanmış' }

  const item = ret.order_items as unknown as {
    vendor_id?: string
    line_total?: number
    product_id?: string
    quantity?: number
    commission_amount?: number
    vendors?: { user_id?: string }
    orders?: { stripe_payment_intent_id?: string | null }
  } | null
  const isOwnerVendor = item?.vendors?.user_id === user.id
  if (!isAdmin && !isOwnerVendor) return { ok: false, error: 'Yetkisiz' }

  const patch: Record<string, unknown> = {
    status: decision,
    resolver_id: user.id,
    resolver_type: isAdmin ? 'admin' : 'vendor',
    resolver_note: note?.trim() || null,
    resolved_at: new Date().toISOString(),
  }
  if (decision === 'approved') {
    patch.refund_amount = item?.line_total ?? null
  }

  // ─── STRIPE REFUND (onay + payment intent varsa) ─────────
  let stripeRefundId: string | null = null
  let stripeErrorMsg: string | null = null
  if (decision === 'approved') {
    const pi = item?.orders?.stripe_payment_intent_id
    const amount = Number(item?.line_total ?? 0)
    if (pi && amount > 0) {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: pi,
          amount: Math.round(amount * 100),
          // Destination charge ise komisyonu da geri al (satıcı = aldığı kadar öder)
          refund_application_fee: true,
          reverse_transfer: true,
          metadata: { return_id: returnId, order_item_id: ret.order_item_id ?? '' },
        })
        stripeRefundId = refund.id
        patch.stripe_refund_id = refund.id
        patch.status = 'completed'  // refund başarılıysa completed'e geç
      } catch (err) {
        // Refund hatası — statüyü approved tut, manuel müdahale gerekir
        stripeErrorMsg = err instanceof Error ? err.message : 'Stripe refund hatası'
        patch.resolver_note = (note?.trim() ? note.trim() + ' · ' : '') + `[REFUND HATASI: ${stripeErrorMsg}]`
      }
    }
  }

  const { error } = await supabase.from('returns').update(patch).eq('id', returnId)
  if (error) return { ok: false, error: error.message }

  // Onaylandıysa item 'returned' + stok geri iade
  if (decision === 'approved' && ret.order_item_id) {
    const admin = createServiceClient()
    await admin
      .from('order_items')
      .update({ fulfillment_status: 'returned' })
      .eq('id', ret.order_item_id)

    // Stok iadesi (SECURITY DEFINER yoksa service ile +quantity)
    if (item?.product_id && item?.quantity) {
      const { data: prod } = await admin
        .from('products')
        .select('stock')
        .eq('id', item.product_id)
        .single()
      if (prod && prod.stock != null) {
        await admin
          .from('products')
          .update({ stock: prod.stock + item.quantity })
          .eq('id', item.product_id)
      }
    }
  }

  revalidatePath('/satici/panel/siparisler')
  revalidatePath('/satici/panel/iadeler')
  revalidatePath('/admin/iadeler')
  revalidatePath('/panel/iadelerim')
  return {
    ok: true,
    ...(stripeRefundId ? {} : stripeErrorMsg ? { error: `Onaylandı ama Stripe refund hata: ${stripeErrorMsg}` } : {}),
  }
}
