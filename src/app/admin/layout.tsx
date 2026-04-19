import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import AdminNavLink from '@/components/AdminNavLink'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: {
    default: 'Admin Paneli',
    template: '%s | Admin — Estelongy',
  },
}

const NAV = [
  { href: '/admin', label: 'Dashboard', exact: true, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )},
  { href: '/admin/kullanicilar', label: 'Kullanıcılar', exact: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )},
  { href: '/admin/klinikler', label: 'Klinikler', exact: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  )},
  { href: '/admin/saticilar', label: 'Satıcılar', exact: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
    </svg>
  )},
  { href: '/admin/urunler', label: 'Ürünler', exact: false, icon: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  )},
]

async function handleSignOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/giris')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/giris')

  const role = (user.app_metadata as Record<string, string>)?.role
  if (role !== 'admin') redirect('/panel')

  return (
    <div className="min-h-screen bg-slate-950 flex">

      {/* ── Mobile top bar (< lg) ──────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-800">
        {/* Logo row */}
        <div className="flex items-center gap-2 h-12 px-4">
          <div className="w-6 h-6 bg-gradient-to-br from-red-500 to-orange-600 rounded-md flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="text-white text-sm font-bold flex-1">Admin Panel</span>
          <span className="text-slate-600 text-xs">Estelongy</span>
        </div>
        {/* Nav row */}
        <nav className="flex gap-1 px-3 pb-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map(({ href, label, icon, exact }) => (
            <AdminNavLink key={href} href={href} label={label} icon={icon} exact={exact} mobile />
          ))}
          <Link href="/panel"
            className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-300 transition-all shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Panel
          </Link>
          <form action={handleSignOut} className="shrink-0">
            <button type="submit"
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-slate-500 hover:text-red-400 transition-all w-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış
            </button>
          </form>
        </nav>
      </div>

      {/* ── Desktop sidebar (≥ lg) ─────────────────────────────── */}
      <aside className="hidden lg:flex w-56 shrink-0 bg-slate-900 border-r border-slate-800 flex-col fixed top-0 left-0 h-full z-40">
        <div className="p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <div className="text-white text-sm font-bold">Admin Panel</div>
              <div className="text-slate-500 text-xs">Estelongy</div>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV.map(({ href, label, icon, exact }) => (
            <AdminNavLink key={href} href={href} label={label} icon={icon} exact={exact} />
          ))}
        </nav>

        <div className="p-3 border-t border-slate-800 space-y-2">
          <Link
            href="/panel"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all text-xs"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kullanıcı Paneline Dön
          </Link>
          <form action={handleSignOut}>
            <button type="submit" className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition-all text-xs text-left">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Çıkış Yap
            </button>
          </form>
        </div>
      </aside>

      {/* ── Main content ───────────────────────────────────────── */}
      <main className="flex-1 lg:ml-56 min-h-screen pt-[88px] lg:pt-0">
        {children}
      </main>
    </div>
  )
}
