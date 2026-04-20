'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart, type CartItem } from '@/lib/cart'

interface Props {
  product: Omit<CartItem, 'quantity'>
  disabled?: boolean
  fullWidth?: boolean
}

export default function AddToCartButton({ product, disabled, fullWidth }: Props) {
  const router = useRouter()
  const { add } = useCart()
  const [added, setAdded] = useState(false)

  function handleAdd() {
    add(product, 1)
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  function handleBuyNow() {
    add(product, 1)
    router.push('/sepet')
  }

  const base = fullWidth ? 'w-full' : ''

  return (
    <div className={`flex gap-3 ${base}`}>
      <button
        onClick={handleAdd}
        disabled={disabled || added}
        className={`${fullWidth ? 'flex-1' : ''} inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all ${
          added
            ? 'bg-emerald-600 text-white'
            : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
        } disabled:opacity-40 disabled:cursor-not-allowed`}>
        {added ? (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Eklendi
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Sepete Ekle
          </>
        )}
      </button>
      <button
        onClick={handleBuyNow}
        disabled={disabled}
        className={`${fullWidth ? 'flex-1' : ''} inline-flex items-center justify-center px-5 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-violet-500/20 disabled:opacity-40`}>
        Hemen Al
      </button>
    </div>
  )
}
