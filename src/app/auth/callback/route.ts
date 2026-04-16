import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/panel'

  // Open redirect önleme: next sadece kendi domain'imize izin ver
  const safePath = next.startsWith('/') && !next.startsWith('//') ? next : '/panel'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${safePath}`)
  }

  return NextResponse.redirect(`${origin}/giris?error=auth`)
}
