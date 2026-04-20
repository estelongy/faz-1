'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Supabase şifre sıfırlama / magic link e-postaları bazen hash fragment
 * (#access_token=...) ile Site URL'e (kök sayfa) yönlendirir.
 * Bu bileşen hash'i yakalayıp doğru sayfaya iletir.
 */
export default function AuthHashHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (!hash.includes('access_token=')) return

    const params = new URLSearchParams(hash.replace('#', ''))
    const type = params.get('type')

    // Şifre sıfırlama → update-password sayfasına aktar
    if (type === 'recovery') {
      router.replace('/auth/update-password' + window.location.hash)
      return
    }

    // Magic link / diğer → confirm sayfasına aktar
    router.replace('/auth/confirm' + window.location.hash)
  }, [router])

  return null
}
