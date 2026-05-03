'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  href: string
  icon: string
  label: string
  badge?: 'new' | 'soon' | number
  exact?: boolean
}

interface NavGroup {
  title?: string
  items: NavItem[]
}

const NAV_GROUPS: NavGroup[] = [
  {
    items: [
      { href: '/klinik/panel',           icon: '🏠', label: 'Panel', exact: true },
      { href: '/klinik/panel/randevular', icon: '📅', label: 'Randevular' },
      { href: '/klinik/panel/hastalarim', icon: '👥', label: 'Hastalarım' },
      { href: '/klinik/panel/jeton',      icon: '💳', label: 'Krediler' },
      { href: '/klinik/panel/rapor',      icon: '📊', label: 'Raporlar' },
    ],
  },
  {
    title: 'Topluluk',
    items: [
      { href: '/klinik/panel/akademi',    icon: '📰', label: 'Akademi',     badge: 'soon' },
      { href: '/klinik/panel/pazarlama',  icon: '📱', label: 'Pazarlama',   badge: 'soon' },
      { href: '/klinik/panel/topluluk',   icon: '💬', label: 'Topluluk',    badge: 'soon' },
      { href: '/klinik/panel/destek',     icon: '🛟', label: 'Destek' },
    ],
  },
  {
    title: 'Klinik',
    items: [
      { href: '/klinik/panel/profil',     icon: '🏥', label: 'Klinik Profilim' },
    ],
  },
]

interface Props {
  clinicName: string
  totalCredit: number
  freeCredit: number
}

export default function KlinikSidebar({ clinicName, totalCredit, freeCredit }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const creditColor =
    totalCredit === 0 ? 'text-red-400 bg-red-500/10 border-red-500/30' :
    totalCredit <= 10 ? 'text-amber-400 bg-amber-500/10 border-amber-500/30' :
    'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'

  return (
    <>
      {/* Mobil hamburger */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-slate-800 border border-slate-700 text-white shadow-lg"
        aria-label="Menü"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileOpen
            ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          }
        </svg>
      </button>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div onClick={() => setMobileOpen(false)} className="lg:hidden fixed inset-0 bg-black/50 z-40" />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 bottom-0 w-64 bg-slate-900 border-r border-slate-800 z-50 overflow-y-auto transition-transform duration-200 ${
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      } lg:translate-x-0`}>

        {/* Klinik kimlik kartı */}
        <div className="p-4 border-b border-slate-800">
          <Link href="/klinik/panel" className="flex items-center gap-2.5 mb-3 group" onClick={() => setMobileOpen(false)}>
            <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm truncate group-hover:text-violet-400 transition-colors">{clinicName}</p>
              <p className="text-slate-500 text-[10px] uppercase tracking-widest">Estelongy Klinik</p>
            </div>
          </Link>

          {/* Kredi rozeti */}
          <Link href="/klinik/panel/jeton" onClick={() => setMobileOpen(false)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs transition-opacity hover:opacity-80 ${creditColor}`}>
            <div className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span className="font-bold">{totalCredit} Kredi</span>
            </div>
            {freeCredit > 0 && <span className="opacity-70 text-[10px]">{freeCredit} hediye</span>}
          </Link>
        </div>

        {/* Navigasyon */}
        <nav className="p-3 space-y-5">
          {NAV_GROUPS.map((group, gi) => (
            <div key={gi}>
              {group.title && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-1.5 px-2">{group.title}</p>
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const active = isActive(item.href, item.exact)
                  return (
                    <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm transition-colors ${
                        active
                          ? 'bg-violet-500/15 text-white border border-violet-500/30'
                          : 'text-slate-400 hover:bg-slate-800/60 hover:text-white border border-transparent'
                      }`}>
                      <span className="text-base">{item.icon}</span>
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.badge === 'soon' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-700/60 text-slate-400 uppercase tracking-wider">Yakında</span>
                      )}
                      {item.badge === 'new' && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">Yeni</span>
                      )}
                      {typeof item.badge === 'number' && item.badge > 0 && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white">{item.badge}</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Alt: Estelongy bağlantıları */}
        <div className="p-3 mt-4 border-t border-slate-800 space-y-1">
          <Link href="/panel" className="block px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors">
            ← Hasta Paneline Geç
          </Link>
          <Link href="/" className="block px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/40 transition-colors">
            Anasayfa
          </Link>
        </div>
      </aside>
    </>
  )
}
