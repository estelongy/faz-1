'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart'

export default function CartButton({ className = '' }: { className?: string }) {
  const { count, hydrated } = useCart()

  return (
    <Link href="/sepet"
      className={`relative inline-flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-slate-800 transition-colors ${className}`}
      aria-label="Sepet">
      <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span className="text-sm text-slate-300 font-medium hidden sm:inline">Sepet</span>
      {hydrated && count > 0 && (
        <span className="absolute -top-1 -right-1 bg-violet-600 text-white text-[10px] font-black rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
          {count}
        </span>
      )}
    </Link>
  )
}
