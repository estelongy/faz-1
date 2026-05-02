import { NextRequest, NextResponse } from 'next/server'

/**
 * Referans linki: estelongy.com/r/AHMET123
 *  → cookie 'estelongy_ref' set edilir (30 gün)
 *  → /kayit sayfasına ?ref=AHMET123 ile yönlendirilir
 *  → Kayıt sırasında otomatik doldurulur, davet eden +10 puan kazanır
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> },
) {
  const { code } = await params
  const clean = (code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 12)

  const url = new URL('/kayit', _req.url)
  if (clean) url.searchParams.set('ref', clean)

  const res = NextResponse.redirect(url, 302)
  if (clean) {
    res.cookies.set('estelongy_ref', clean, {
      maxAge: 60 * 60 * 24 * 30, // 30 gün
      path: '/',
      sameSite: 'lax',
    })
  }
  return res
}
