import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })

    // Satıcı kaydı
    const { data: vendor } = await supabase
      .from('vendors')
      .select('id, company_name, approval_status, stripe_account_id')
      .eq('user_id', user.id)
      .single()
    if (!vendor) return NextResponse.json({ error: 'Satıcı bulunamadı' }, { status: 404 })
    if (vendor.approval_status !== 'approved') {
      return NextResponse.json({ error: 'Önce admin onayını bekleyin' }, { status: 403 })
    }

    // Zaten hesap varsa onu dön
    if (vendor.stripe_account_id) {
      return NextResponse.json({ accountId: vendor.stripe_account_id, existing: true })
    }

    // Express hesap oluştur (Türkiye satıcısı)
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'TR',
      email: user.email ?? undefined,
      capabilities: {
        card_payments: { requested: true },
        transfers:     { requested: true },
      },
      business_profile: {
        name: vendor.company_name,
        mcc: '5977', // Cosmetic stores
      },
      metadata: {
        vendor_id: vendor.id,
        user_id: user.id,
      },
    })

    // DB'ye kaydet
    await supabase
      .from('vendors')
      .update({ stripe_account_id: account.id })
      .eq('id', vendor.id)

    return NextResponse.json({ accountId: account.id, existing: false })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Bilinmeyen hata'
    console.error('Connect create account error:', msg)
    // Connect platform aktif değilse özel mesaj
    if (msg.includes('Connect') || msg.includes('platform')) {
      return NextResponse.json({
        error: 'Stripe Connect platform ayarı yapılmamış. Platform yöneticisi Stripe Dashboard üzerinden Connect\'i aktive etmeli.',
      }, { status: 503 })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
