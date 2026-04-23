import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, phone, first_name, last_name, birth_year } = body

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

    if (birth_year) {
      await admin.from('profiles').update({ birth_year }).eq('id', data.user.id)
    }

    return NextResponse.json({ success: true, user_id: data.user.id })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Hata' }, { status: 500 })
  }
}
