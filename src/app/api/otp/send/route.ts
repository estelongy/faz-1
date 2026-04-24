import { NextRequest, NextResponse } from 'next/server'
import { redis, otpPerMinute, otpPerHour } from '@/lib/redis'
import { sendOtpSms, generateOtpCode, normalizePhone } from '@/lib/netgsm'

/**
 * OTP kodu gönder.
 *
 * Akış:
 *   1. Telefon normalize edilir (5XXXXXXXXX)
 *   2. Rate limit: aynı telefon dakikada 1, saatte 5
 *   3. 6 haneli kod üret, Redis'e TTL=300s ile yaz
 *   4. Önceki yanlış deneme sayacını sıfırla
 *   5. Netgsm'e SMS gönder
 *
 * GÜVENLİK: kodu ASLA response'a koyma.
 */
export async function POST(req: NextRequest) {
  try {
    const { phone } = await req.json() as { phone?: string }

    if (!phone) {
      return NextResponse.json({ error: 'Telefon numarası gerekli' }, { status: 400 })
    }

    const normalized = normalizePhone(phone)
    if (!normalized) {
      return NextResponse.json(
        { error: 'Geçersiz telefon numarası (5XXXXXXXXX formatında olmalı)' },
        { status: 400 }
      )
    }

    // Rate limit: dakika
    const minuteRes = await otpPerMinute.limit(normalized)
    if (!minuteRes.success) {
      return NextResponse.json(
        { error: 'Çok sık deneme. Lütfen 1 dakika bekleyin.' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    // Rate limit: saat
    const hourRes = await otpPerHour.limit(normalized)
    if (!hourRes.success) {
      return NextResponse.json(
        { error: 'Saatlik OTP isteği limiti doldu. Lütfen daha sonra tekrar deneyin.' },
        { status: 429, headers: { 'Retry-After': '3600' } }
      )
    }

    // Kod üret + Redis'e yaz (TTL 300 saniye)
    const code = generateOtpCode()
    await redis.set(`otp:code:${normalized}`, code, { ex: 300 })

    // Önceki denemeler varsa sıfırla
    await redis.del(`otp:attempts:${normalized}`)

    // SMS gönder
    const smsRes = await sendOtpSms(normalized, code)
    if (!smsRes.success) {
      // Redis'e yazılan kodu sil (yanlış durumda kalmasın)
      await redis.del(`otp:code:${normalized}`)
      console.error('[OTP Send] Netgsm hatası:', smsRes.error)
      return NextResponse.json(
        { error: 'SMS gönderilemedi. Lütfen tekrar deneyin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, jobid: smsRes.jobid })
  } catch (err) {
    console.error('[OTP Send] Beklenmedik hata:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
