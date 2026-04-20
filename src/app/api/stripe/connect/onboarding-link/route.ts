import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, stripe_account_id')
      .eq('user_id', user.id)
      .single()
    if (!vendor?.stripe_account_id) {
      return NextResponse.json({ error: 'Stripe hesabı yok — önce oluşturun' }, { status: 400 })
    }

    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    const link = await stripe.accountLinks.create({
      account:     vendor.stripe_account_id,
      refresh_url: `${origin}/satici/panel/odeme-hesabi?refresh=1`,
      return_url:  `${origin}/satici/panel/odeme-hesabi?onboarded=1`,
      type:        'account_onboarding',
    })

    return NextResponse.json({ url: link.url })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
    console.error('Onboarding link error:', msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
