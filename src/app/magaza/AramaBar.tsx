'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AramaBar() {
  const router = useRouter()
  const params = useSearchParams()
  const [q, setQ] = useState(params.get('q') ?? '')

  // URL değişirse state'i senkronize et
  useEffect(() => {
    setQ(params.get('q') ?? '')
  }, [params])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const sp = new URLSearchParams(Array.from(params.entries()))
    if (q.trim()) sp.set('q', q.trim())
    else sp.delete('q')
    router.push(`/magaza?${sp.toString()}`)
  }

  function clear() {
    setQ('')
    const sp = new URLSearchParams(Array.from(params.entries()))
    sp.delete('q')
    router.push(`/magaza?${sp.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
        fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Ürün, marka veya kategori ara..."
        className="w-full pl-10 pr-10 py-3 bg-slate-800/50 border border-slate-700 focus:border-violet-500 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none transition-colors"
      />
      {q && (
        <button type="button" onClick={clear}
          className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-500 hover:text-white transition-colors flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </form>
  )
}
