/**
 * Hafif bellek içi rate limiter (Edge / Node.js uyumlu)
 *
 * Production'da Upstash Redis ile değiştirilebilir.
 * Her pod yeniden başladığında sayaçlar sıfırlanır; bu MVP için yeterli.
 */

interface Entry {
  count: number
  resetAt: number
}

// Map<key, Entry> — bellek içi pencere
const store = new Map<string, Entry>()

// Periyodik temizlik: 5 dakikada bir süresi geçmiş kayıtları sil
if (typeof globalThis !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    store.forEach((entry, key) => {
      if (entry.resetAt < now) store.delete(key)
    })
  }, 5 * 60 * 1000)
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetAt: number
}

/**
 * @param key     Benzersiz anahtar (IP, user ID vb.)
 * @param limit   Pencere başına maksimum istek sayısı
 * @param windowMs Pencere süresi (milisaniye)
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now()
  let entry = store.get(key)

  if (!entry || entry.resetAt < now) {
    entry = { count: 1, resetAt: now + windowMs }
    store.set(key, entry)
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt }
  }

  entry.count++
  const remaining = Math.max(0, limit - entry.count)
  return {
    success: entry.count <= limit,
    remaining,
    resetAt: entry.resetAt,
  }
}

// ─── Önceden tanımlı limitler ─────────────────────────────────────────────

/** AI analiz endpoint'i: IP başına 5 istek / 60 dakika */
export function rateLimitAnaliz(ip: string) {
  return rateLimit(`analiz:${ip}`, 5, 60 * 60 * 1000)
}

/** Auth endpoint'i: IP başına 10 istek / 15 dakika */
export function rateLimitAuth(ip: string) {
  return rateLimit(`auth:${ip}`, 10, 15 * 60 * 1000)
}

/** Checkout endpoint'i: kullanıcı başına 20 istek / dakika */
export function rateLimitCheckout(userId: string) {
  return rateLimit(`checkout:${userId}`, 20, 60 * 1000)
}

/** Genel API: IP başına 100 istek / dakika */
export function rateLimitApi(ip: string) {
  return rateLimit(`api:${ip}`, 100, 60 * 1000)
}

/** Rate limit aşıldığında kullanılacak response yardımcısı */
export function rateLimitResponse(result: RateLimitResult): Response {
  return new Response(
    JSON.stringify({ error: 'Çok fazla istek. Lütfen bekleyin.' }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Remaining': String(result.remaining),
        'X-RateLimit-Reset': String(Math.ceil(result.resetAt / 1000)),
        'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
      },
    }
  )
}
