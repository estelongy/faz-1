import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
})

// Jeton paketleri
const JETON_PACKAGES = [
  { id: 'jeton_10',  label: '10 Jeton',  jetons: 10,  price: 4900,  currency: 'eur', popular: false },
  { id: 'jeton_25',  label: '25 Jeton',  jetons: 25,  price: 9900,  currency: 'eur', popular: true  },
  { id: 'jeton_50',  label: '50 Jeton',  jetons: 50,  price: 17900, currency: 'eur', popular: false },
  { id: 'jeton_100', label: '100 Jeton', jetons: 100, price: 29900, currency: 'eur', popular: false },
]

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { packageId } = await req.json()
    const pkg = JETON_PACKAGES.find(p => p.id === packageId)
    if (!pkg) {
      return NextResponse.json({ error: 'Geçersiz paket' }, { status: 400 })
    }

    // Kliniği bul
    const { data: clinic } = await supabase
      .from('clinics')
      .select('id, name')
      .eq('user_id', user.id)
      .single()
    if (!clinic) {
      return NextResponse.json({ error: 'Klinik bulunamadı' }, { status: 404 })
    }

    const origin = req.headers.get('origin') ?? 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: pkg.currency,
            product_data: {
              name: `Estelongy ${pkg.label}`,
              description: `${clinic.name} için ${pkg.jetons} jeton yüklemesi`,
            },
            unit_amount: pkg.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        clinic_id: clinic.id,
        user_id: user.id,
        package_id: pkg.id,
        jetons: String(pkg.jetons),
      },
      success_url: `${origin}/klinik/panel/jeton?success=1`,
      cancel_url:  `${origin}/klinik/panel/jeton?cancelled=1`,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('Stripe checkout error:', err)
    return NextResponse.json({ error: 'Ödeme başlatılamadı' }, { status: 500 })
  }
}
