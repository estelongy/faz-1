import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email, password, phone, first_name, last_name, birth_year, phone_verified,
      referral_code, // opsiyonel — davet eden kullanıcının kodu
    } = body

    if (!email || !password || !phone || !first_name) {
      return NextResponse.json({ error: 'Eksik alanlar.' }, { status: 400 })
    }

    const admin = createServiceClient()
    const fullName = `${first_name}${last_name ? ' ' + last_name : ''}`

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        full_name: fullName,
        first_name,
        last_name: last_name || '',
        phone,
        birth_year,
      },
    })

    if (error || !data.user) {
      const msg = error?.message?.includes('registered') ? 'Bu e-posta zaten kayıtlı.' : (error?.message || 'Hesap oluşturulamadı.')
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    // Profile'a ek alanları yaz
    const profileUpdate: Record<string, unknown> = { phone }
    if (birth_year) profileUpdate.birth_year = birth_year
    if (phone_verified === true) profileUpdate.phone_verified = true

    // Referral attribution (kod geçerliyse referrer'ı bul)
    let referrerUserId: string | null = null
    if (typeof referral_code === 'string' && referral_code.trim().length > 0) {
      const { data: refRow } = await admin
        .from('referral_codes')
        .select('user_id')
        .eq('code', referral_code.trim().toUpperCase())
        .maybeSingle()
      if (refRow && refRow.user_id !== data.user.id) {
        referrerUserId = refRow.user_id as string
        profileUpdate.referred_by = referrerUserId
      }
    }

    await admin.from('profiles').update(profileUpdate).eq('id', data.user.id)

    // Davet eden kullanıcıya kayıt bonusu (+10 puan)
    if (referrerUserId) {
      try {
        await admin.rpc('adjust_points', {
          p_user_id: referrerUserId,
          p_amount: 10,
          p_type: 'referral_signup',
          p_reference_type: 'profile',
          p_reference_id: data.user.id,
          p_description: `Yeni üye kaydı: ${fullName}`,
        })
      } catch (refErr) {
        console.error('[Kayıt] Referral bonus hatası:', refErr)
      }
    }

    // Welcome email (opsiyonel) — role göre panel linki
    try {
      const { sendWelcomeEmail } = await import('@/lib/welcome-email')
      await sendWelcomeEmail({ to: email, firstName: first_name, role: 'user' })
    } catch (mailErr) {
      console.error('[Kayıt] Welcome email hatası:', mailErr)
    }

    return NextResponse.json({ success: true, user_id: data.user.id, referred_by: referrerUserId })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
