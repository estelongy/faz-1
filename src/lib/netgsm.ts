/**
 * Netgsm OTP SMS client.
 *
 * API: https://api.netgsm.com.tr/sms/rest/v2/otp
 * Auth: HTTP Basic (base64(usercode:password))
 * Not: OTP endpoint Türkçe karakter DESTEKLEMİYOR — mesaj metninde ç/ğ/ı/ş/ö/ü YOK.
 * Telefon: 5XXXXXXXXX (10 hane, 5 ile başlar, 0/+90 yok)
 * Max mesaj: 155 karakter (alfanumerik başlık ile)
 */

const NETGSM_URL = 'https://api.netgsm.com.tr/sms/rest/v2/otp'
const NETGSM_BULK_URL = 'https://api.netgsm.com.tr/sms/rest/v2/send'

export interface NetgsmResult {
  success: boolean
  jobid?: string
  error?: string
  code?: string
}

/**
 * Telefon numarasını Netgsm formatına çevirir (5XXXXXXXXX).
 * Kabul edilen girdiler: '0532...', '+90532...', '90532...', '532...'
 * Geçersizse null döner.
 */
export function normalizePhone(phone: string): string | null {
  if (!phone) return null
  // Tüm harf/boşluk/tire/parantez vb. temizle
  let digits = phone.replace(/\D/g, '')

  // Başta 90 varsa kaldır
  if (digits.startsWith('90') && digits.length === 12) {
    digits = digits.slice(2)
  }
  // Başta 0 varsa kaldır
  else if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1)
  }

  // Şimdi 10 hane olmalı ve 5 ile başlamalı
  if (digits.length !== 10 || !digits.startsWith('5')) return null

  return digits
}

/**
 * 6 haneli rastgele numerik OTP kodu üretir.
 * crypto.randomInt Node.js'te mevcut.
 */
export function generateOtpCode(): string {
  // 100000 - 999999 arası
  const n = Math.floor(Math.random() * 900000) + 100000
  return n.toString()
}

/**
 * Netgsm hata kodlarını Türkçe açıklamalara çevirir.
 */
export function mapNetgsmError(code: string): string {
  const map: Record<string, string> = {
    '20': 'Mesaj metni hatalı veya karakter sınırı aşıldı',
    '30': 'Geçersiz kullanıcı adı / şifre veya yetki yok',
    '40': 'Gönderici adı (header) sistemde tanımlı değil',
    '41': 'Mesaj gönderim tipi hatalı',
    '50': 'Abonelik durdurulmuş (ödeme / IP / kontör)',
    '51': 'IP adresi tanımlı değil',
    '52': 'Kullanıcı API kullanımı pasif',
    '60': 'Gönderim için yeterli kontör yok',
    '70': 'Hatalı sorgulama — parametreler kontrol edilmeli',
    '100': 'Sistem hatası',
  }
  return map[code] ?? `Bilinmeyen Netgsm hatası (${code})`
}

/**
 * OTP SMS gönder. ÖNEMLİ: mesaj içinde Türkçe karakter OLMAMALI.
 */
export async function sendOtpSms(phone: string, code: string): Promise<NetgsmResult> {
  const normalized = normalizePhone(phone)
  if (!normalized) {
    return { success: false, error: 'Geçersiz telefon numarası (5XXXXXXXXX formatı bekleniyor)' }
  }

  const usercode = process.env.NETGSM_USERCODE
  const password = process.env.NETGSM_PASSWORD
  const msgheader = process.env.NETGSM_MSGHEADER

  if (!usercode || !password || !msgheader) {
    return { success: false, error: 'Netgsm env degiskenleri tanimli degil' }
  }

  // Türkçe karaktersiz mesaj (OTP endpoint Türkçe karakter desteklemiyor)
  const msg = `ESTELONGY ile Genclik yolculuguna hos geldiniz! Dogrulama kodunuz: ${code}`

  if (msg.length > 155) {
    return { success: false, error: 'Mesaj 155 karakteri asiyor' }
  }

  const auth = Buffer.from(`${usercode}:${password}`).toString('base64')

  try {
    const res = await fetch(NETGSM_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msgheader,
        msg,
        no: normalized,
      }),
    })

    const text = await res.text()
    let json: { code?: string; jobid?: string; description?: string } = {}
    try {
      json = JSON.parse(text)
    } catch {
      return { success: false, error: `Netgsm parse hatasi: ${text.slice(0, 100)}` }
    }

    if (json.code === '00') {
      return { success: true, jobid: json.jobid, code: json.code }
    }

    return {
      success: false,
      code: json.code,
      error: json.code ? mapNetgsmError(json.code) : (json.description ?? 'Netgsm bilinmeyen yanit'),
    }
  } catch (err) {
    // Password'ü loglama: sadece generic mesaj
    console.error('[Netgsm] Network hatasi:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Netgsm baglanti hatasi' }
  }
}

/**
 * Normal (bilgilendirme) SMS gönder.
 * Türkçe karakter OLMAMALI — OTP endpoint gibi GSM-7 bandı.
 * Randevu hatırlatma, bildirim vb. için.
 * @returns success bool — failed olsa da çağıran kuyrukta retry yönetir.
 */
export async function sendInfoSms(phone: string, message: string): Promise<NetgsmResult> {
  const normalized = normalizePhone(phone)
  if (!normalized) {
    return { success: false, error: 'Gecersiz telefon numarasi' }
  }

  const usercode = process.env.NETGSM_USERCODE
  const password = process.env.NETGSM_PASSWORD
  const msgheader = process.env.NETGSM_MSGHEADER

  if (!usercode || !password || !msgheader) {
    return { success: false, error: 'Netgsm env degiskenleri tanimli degil' }
  }

  // Türkçe karakterleri ASCII'ye düşür (güvenli mesaj)
  const cleaned = message
    .replace(/ı/g, 'i').replace(/İ/g, 'I')
    .replace(/ş/g, 's').replace(/Ş/g, 'S')
    .replace(/ğ/g, 'g').replace(/Ğ/g, 'G')
    .replace(/ü/g, 'u').replace(/Ü/g, 'U')
    .replace(/ö/g, 'o').replace(/Ö/g, 'O')
    .replace(/ç/g, 'c').replace(/Ç/g, 'C')
    .slice(0, 155)

  const auth = Buffer.from(`${usercode}:${password}`).toString('base64')

  try {
    const res = await fetch(NETGSM_BULK_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        msgheader,
        encoding: 'TR',
        messages: [{ msg: cleaned, no: normalized }],
      }),
    })

    const text = await res.text()
    let json: { code?: string; jobid?: string; description?: string } = {}
    try { json = JSON.parse(text) } catch {
      return { success: false, error: `Netgsm parse hatasi: ${text.slice(0, 100)}` }
    }

    if (json.code === '00') {
      return { success: true, jobid: json.jobid, code: json.code }
    }
    return {
      success: false,
      code: json.code,
      error: json.code ? mapNetgsmError(json.code) : (json.description ?? 'Netgsm bilinmeyen yanit'),
    }
  } catch (err) {
    console.error('[Netgsm/info] Network hatasi:', err instanceof Error ? err.message : err)
    return { success: false, error: 'Netgsm baglanti hatasi' }
  }
}
