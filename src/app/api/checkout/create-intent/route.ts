import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2026-03-25.dahlia' })

// Checkout payload
interface CartLine {
  productId: string
  quantity: number
}

interface Payload {
  items: CartLine[]
  addressId: string
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum açık değil' }, { status: 401 })

    const body = (await req.json()) as Payload
    if (!body.items?.length) return NextResponse.json({ error: 'Sepet boş' }, { status: 400 })
    if (!body.addressId)     return NextResponse.json({ error: 'Adres seçilmedi' }, { status: 400 })

    // Adresi kendi adresi mi kontrol et
    const { data: address } = await supabase
      .from('addresses')
      .select('*')
      .eq('id', body.addressId)
      .eq('user_id', user.id)
      .single()
    if (!address) return NextResponse.json({ error: 'Adres bulunamadı' }, { status: 404 })

    // Ürünleri DB'den çek (fiyat doğrulama için — client'a güvenme)
    const productIds = body.items.map(i => i.productId)
    const { data: products } = await supabase
      .from('products')
      .select(`
        id, name, slug, price, stock, is_active, approval_status, images, vendor_id,
        vendors(company_name, commission_rate, stripe_account_id, stripe_charges_enabled)
      `)
      .in('id', productIds)
    if (!products || products.length !== productIds.length) {
      return NextResponse.json({ error: 'Bazı ürünler artık mevcut değil' }, { status: 400 })
    }

    // Satır satır işle
    const lines: Array<{
      product_id: string
      vendor_id: string | null
      product_snapshot: Record<string, unknown>
      quantity: number
      unit_price: number
      line_total: number
      commission_rate: number
      commission_amount: number
      vendor_payout: number
    }> = []
    let subtotal = 0
    // Destination charge için tek vendor gerekli — farklıysa platform hesabı toplar
    const vendorStripeAccounts = new Set<string>()
    for (const item of body.items) {
      const p = products.find(x => x.id === item.productId)
      if (!p) return NextResponse.json({ error: `Ürün bulunamadı: ${item.productId}` }, { status: 400 })
      if (!p.is_active || p.approval_status !== 'approved') {
        return NextResponse.json({ error: `Satışta değil: ${p.name}` }, { status: 400 })
      }
      if (p.stock != null && p.stock < item.quantity) {
        return NextResponse.json({ error: `Yetersiz stok: ${p.name}` }, { status: 400 })
      }
      const unit = Number(p.price ?? 0)
      if (unit <= 0) return NextResponse.json({ error: `Geçersiz fiyat: ${p.name}` }, { status: 400 })
      const lineTotal = unit * item.quantity
      const vendorInfo = (p.vendors as {
        company_name?: string
        commission_rate?: number
        stripe_account_id?: string | null
        stripe_charges_enabled?: boolean | null
      } | null)
      const commissionRate = Number(vendorInfo?.commission_rate ?? 0.15)
      const commissionAmount = Math.round(lineTotal * commissionRate * 100) / 100
      const vendorPayout = Math.round((lineTotal - commissionAmount) * 100) / 100
      if (vendorInfo?.stripe_account_id && vendorInfo?.stripe_charges_enabled) {
        vendorStripeAccounts.add(vendorInfo.stripe_account_id)
      }

      lines.push({
        product_id: p.id,
        vendor_id: p.vendor_id,
        product_snapshot: {
          id: p.id,
          name: p.name,
          slug: p.slug,
          image: p.images?.[0] ?? null,
          vendor_name: vendorInfo?.company_name ?? null,
        },
        quantity: item.quantity,
        unit_price: unit,
        line_total: lineTotal,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        vendor_payout: vendorPayout,
      })
      subtotal += lineTotal
    }

    const shippingFee = 0 // Şimdilik; satıcı anlaşması sonrası hesaplanacak
    const total = subtotal + shippingFee

    // Sipariş numarası üret (SECURITY DEFINER olmayan fonksiyon — herkes çağırabilir)
    const { data: orderNumRes } = await supabase.rpc('generate_order_number')
    const orderNumber = orderNumRes as string

    // Orders kaydı (pending)
    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .insert({
        user_id:         user.id,
        order_number:    orderNumber,
        address_id:      address.id,
        address_snapshot: address,
        subtotal,
        shipping_fee:    shippingFee,
        total,
        payment_status:  'pending',
        items:           body.items,
        total_amount:    total,
        status:          'pending',
      })
      .select('id, order_number')
      .single()
    if (orderErr || !order) {
      console.error('Sipariş oluşturulamadı:', orderErr)
      return NextResponse.json({ error: 'Sipariş oluşturulamadı' }, { status: 500 })
    }

    // Order items kaydı
    const itemsForInsert = lines.map(l => ({ ...l, order_id: order.id }))
    const { error: itemsErr } = await supabase.from('order_items').insert(itemsForInsert)
    if (itemsErr) {
      console.error('Order items hatası:', itemsErr)
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Sipariş kalemleri kaydedilemedi' }, { status: 500 })
    }

    // Tek satıcı + Connect hesabı aktif → destination charge
    // Çoklu satıcı veya Connect aktif değil → platform hesabı toplar, payout sonra manuel/cron
    const useDestinationCharge = vendorStripeAccounts.size === 1
    let destinationAccount: string | undefined
    let applicationFee: number | undefined
    if (useDestinationCharge) {
      destinationAccount = Array.from(vendorStripeAccounts)[0]
      // Platform komisyonu (kuruş) — tüm satırların commission toplamı
      const totalCommission = lines.reduce((s, l) => s + l.commission_amount, 0)
      applicationFee = Math.round(totalCommission * 100)
    }

    const intent = await stripe.paymentIntents.create({
      amount: Math.round(total * 100),
      currency: 'try',
      automatic_payment_methods: { enabled: true },
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        user_id: user.id,
        kind: 'marketplace_order',
      },
      ...(destinationAccount && applicationFee !== undefined ? {
        application_fee_amount: applicationFee,
        transfer_data: { destination: destinationAccount },
      } : {}),
    })

    await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: intent.id })
      .eq('id', order.id)

    return NextResponse.json({
      clientSecret: intent.client_secret,
      orderNumber: order.order_number,
      orderId: order.id,
      total,
    })
  } catch (err) {
    console.error('Checkout hatası:', err)
    return NextResponse.json({ error: 'Ödeme başlatılamadı' }, { status: 500 })
  }
}
