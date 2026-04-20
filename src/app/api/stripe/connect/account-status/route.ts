import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled, stripe_details_submitted')
      .eq('user_id', user.id)
      .single()
    if (!vendor) return NextResponse.json({ error: 'Satıcı yok' }, { status: 404 })

    if (!vendor.stripe_account_id) {
      return NextResponse.json({
        hasAccount: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
      })
    }

    // Stripe'tan güncel durumu çek
    const account = await stripe.accounts.retrieve(vendor.stripe_account_id)
    const charges   = !!account.charges_enabled
    const payouts   = !!account.payouts_enabled
    const submitted = !!account.details_submitted

    // DB ile senkronize tut
    if (
      charges   !== vendor.stripe_charges_enabled ||
      payouts   !== vendor.stripe_payouts_enabled ||
      submitted !== vendor.stripe_details_submitted
    ) {
      await supabase
        .from('vendors')
        .update({
          stripe_charges_enabled:   charges,
          stripe_payouts_enabled:   payouts,
          stripe_details_submitted: submitted,
        })
        .eq('id', vendor.id)
    }

    return NextResponse.json({
      hasAccount: true,
      accountId: vendor.stripe_account_id,
      chargesEnabled: charges,
      payoutsEnabled: payouts,
      detailsSubmitted: submitted,
      requirements: {
        currentlyDue:  account.requirements?.currently_due ?? [],
        eventuallyDue: account.requirements?.eventually_due ?? [],
        pastDue:       account.requirements?.past_due ?? [],
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
    console.error('Account status error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
