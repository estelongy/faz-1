import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

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

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session

    const clinicId  = session.metadata?.clinic_id
    const jetons    = parseInt(session.metadata?.jetons ?? '0', 10)
    const packageId = session.metadata?.package_id

    if (!clinicId || !jetons) {
      return NextResponse.json({ error: 'Metadata eksik' }, { status: 400 })
    }

    const supabase = await createClient()

    // jeton_balance artır
    const { data: clinic, error: clinicErr } = await supabase
      .from('clinics')
      .select('jeton_balance')
      .eq('id', clinicId)
      .single()

    if (clinicErr || !clinic) {
      console.error('Clinic fetch error:', clinicErr)
      return NextResponse.json({ error: 'Klinik bulunamadı' }, { status: 404 })
    }

    const { error: updateErr } = await supabase
      .from('clinics')
      .update({ jeton_balance: (clinic.jeton_balance ?? 0) + jetons })
      .eq('id', clinicId)

    if (updateErr) {
      console.error('Jeton update error:', updateErr)
      return NextResponse.json({ error: 'Jeton güncellenemedi' }, { status: 500 })
    }

    // İşlem kaydı
    await supabase.from('jeton_transactions').insert({
      clinic_id:   clinicId,
      amount:      jetons,
      type:        'purchase',
      description: `Stripe ödeme: ${packageId} (${session.id})`,
    })
  }

  return NextResponse.json({ received: true })
}
