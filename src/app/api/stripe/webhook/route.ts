import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig  = req.headers.get('stripe-signature')

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Webhook secret eksik' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature error:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // ─── Jeton Ödemesi (Checkout Session) ───────────────────────
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const clinicId  = session.metadata?.clinic_id
    const jetons    = parseInt(session.metadata?.jetons ?? '0', 10)
    const packageId = session.metadata?.package_id

    if (clinicId && jetons) {
      const supabase = await createClient()
      const { error } = await supabase.rpc('add_jeton', {
        p_clinic_id:      clinicId,
        p_amount:         jetons,
        p_description:    `Stripe ödeme: ${packageId} (${session.id})`,
        p_stripe_session: session.id,
      })
      if (error) {
        console.error('add_jeton RPC error:', error)
        return NextResponse.json({ error: 'Jeton güncellenemedi' }, { status: 500 })
      }
    }
  }

  // ─── Marketplace Sipariş Ödemesi (Payment Intent) ──────────
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    if (pi.metadata?.kind === 'marketplace_order') {
      const orderId = pi.metadata.order_id
      if (!orderId) {
        console.error('Order ID metadata eksik')
        return NextResponse.json({ error: 'Metadata eksik' }, { status: 400 })
      }

      // Service client — RLS bypass (webhook'ta auth yok)
      const admin = createServiceClient()

      // İdempotent: zaten paid ise geç
      const { data: existing } = await admin
        .from('orders')
        .select('id, payment_status')
        .eq('id', orderId)
        .single()
      if (!existing) {
        console.error('Sipariş bulunamadı:', orderId)
        return NextResponse.json({ error: 'Sipariş yok' }, { status: 404 })
      }
      if (existing.payment_status === 'paid') {
        return NextResponse.json({ received: true, note: 'already paid' })
      }

      // Paid olarak işaretle
      await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'paid',
          paid_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      // Stok düşüm — order_items'tan
      const { data: items } = await admin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', orderId)
      if (items) {
        for (const it of items) {
          if (!it.product_id) continue
          // RLS bypass + atomic decrement via SQL
          await admin.rpc('decrement_product_stock', {
            p_product_id: it.product_id,
            p_amount: it.quantity,
          })
        }
      }

      console.log(`Sipariş ödendi: ${orderId} (${pi.metadata.order_number})`)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    if (pi.metadata?.kind === 'marketplace_order' && pi.metadata.order_id) {
      const admin = createServiceClient()
      await admin
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', pi.metadata.order_id)
    }
  }

  // ─── Connect Account Güncellendi ───────────────────────────
  if (event.type === 'account.updated') {
    const account = event.data.object as Stripe.Account
    const admin = createServiceClient()
    await admin
      .from('vendors')
      .update({
        stripe_charges_enabled:   !!account.charges_enabled,
        stripe_payouts_enabled:   !!account.payouts_enabled,
        stripe_details_submitted: !!account.details_submitted,
      })
      .eq('stripe_account_id', account.id)
  }

  return NextResponse.json({ received: true })
}
