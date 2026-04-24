/**
 * Upstash Redis client (REST) + Ratelimit helpers.
 *
 * OTP akışı için kullanılır:
 *   - otp:code:{phone}     → 6 haneli kod, TTL 300s
 *   - otp:attempts:{phone} → yanlış deneme sayacı, TTL 300s
 *
 * Rate limit limitleri:
 *   - otpPerMinute: aynı telefon 3 dakikada 1 OTP isteği
 *   - otpPerHour:   aynı telefon saatte 5 OTP isteği
 */

import { Redis } from '@upstash/redis'
import { Ratelimit } from '@upstash/ratelimit'

// Singleton Redis client — @upstash/redis REST tabanlı, Vercel edge ile uyumlu
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

/** Aynı telefon 3 dakikada 1 OTP isteği */
export const otpPerMinute = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(1, '3 m'),
  prefix: 'ratelimit:otp:min',
  analytics: false,
})

/** Aynı telefon saatte 5 OTP isteği */
export const otpPerHour = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  prefix: 'ratelimit:otp:hour',
  analytics: false,
})
