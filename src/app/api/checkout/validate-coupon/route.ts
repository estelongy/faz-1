import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimitCheckout, rateLimitResponse } from '@/lib/ratelimit'

interface Payload {
  code: string
  subtotal: number
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Oturum açık değil' }, { status: 401 })

    // Rate limit (kupon brute-force koruması)
    const rl = rateLimitCheckout(`coupon:${user.id}`)
    if (!rl.success) return rateLimitResponse(rl)

    const body = (await req.json()) as Payload
    const code = body.code?.trim().toUpperCase()
    const subtotal = Number(body.subtotal ?? 0)

    if (!code) return NextResponse.json({ valid: false, error: 'Kupon kodu boş' })
    if (subtotal <= 0) return NextResponse.json({ valid: false, error: 'Sepet tutarı geçersiz' })

    const { data: coupon } = await supabase
      .from('coupons')
      .select('id, code, discount_type, discount_value, min_order_amount, max_uses, used_count, valid_until, is_active')
      .eq('code', code)
      .maybeSingle()

    if (!coupon) {
      return NextResponse.json({ valid: false, error: 'Kupon bulunamadı' })
    }
    if (!coupon.is_active) {
      return NextResponse.json({ valid: false, error: 'Bu kupon aktif değil' })
    }
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json({ valid: false, error: 'Bu kuponun süresi dolmuş' })
    }
    if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: 'Bu kupon kullanım hakkı tükendi' })
    }
    if (subtotal < Number(coupon.min_order_amount ?? 0)) {
      return NextResponse.json({
        valid: false,
        error: `Minimum sepet tutarı ₺${Number(coupon.min_order_amount).toLocaleString('tr-TR')}`,
      })
    }

    // İndirim hesapla
    let discount: number
    if (coupon.discount_type === 'percent') {
      discount = Math.round(subtotal * Number(coupon.discount_value) / 100 * 100) / 100
    } else {
      discount = Math.min(Number(coupon.discount_value), subtotal)
    }

    return NextResponse.json({
      valid: true,
      code: coupon.code,
      discount,
      discountType: coupon.discount_type,
      discountValue: Number(coupon.discount_value),
    })
  } catch (err) {
    console.error('[validate-coupon]', err)
    return NextResponse.json({ valid: false, error: 'Doğrulama hatası' }, { status: 500 })
  }
}
