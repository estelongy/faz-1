import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Giriş gerektiren rotalar (prefix eşleşmesi)
const PROTECTED = ['/panel', '/klinik', '/admin', '/anket', '/analiz', '/randevu', '/test-skor']

// Giriş yapılmışsa erişilmemesi gereken rotalar (tam eşleşme)
const AUTH_ONLY = ['/giris', '/kayit', '/kurumsal/giris']

// Sadece admin rolüne açık rotalar (prefix eşleşmesi)
const ADMIN_ONLY = ['/formlestelongy', '/rehber/genclik-skoru-nasil-hesaplanir']

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Session refresh (cookie güncelleme)
  const { data: { session } } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Giriş yapılmamış → korumalı sayfaya erişim → /giris'e yönlendir
  const isProtected = PROTECTED.some(p => pathname.startsWith(p))
  if (!session && isProtected) {
    const url = request.nextUrl.clone()
    url.pathname = '/giris'
    return NextResponse.redirect(url)
  }

  // Admin-only rotalar: giriş yok → /giris, admin değil → /panel
  const isAdminOnly = ADMIN_ONLY.some(p => pathname.startsWith(p))
  if (isAdminOnly) {
    if (!session) {
      const url = request.nextUrl.clone()
      url.pathname = '/giris'
      return NextResponse.redirect(url)
    }
    const role = (session.user.app_metadata as Record<string, string>)?.role
    if (role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/panel'
      return NextResponse.redirect(url)
    }
  }

  // Giriş yapılmış → /giris veya /kayit → /panel'e yönlendir
  const isAuthOnly = AUTH_ONLY.includes(pathname)
  if (session && isAuthOnly) {
    const url = request.nextUrl.clone()
    url.pathname = '/panel'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Şunları hariç tut:
     * - _next/static (static dosyalar)
     * - _next/image (resim optimizasyonu)
     * - favicon.ico
     * - public klasörü (png, jpg, svg, webp vs.)
     * - auth/callback (Supabase OAuth)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$|auth/callback).*)',
  ],
}
