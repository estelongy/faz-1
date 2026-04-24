'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import RandevuFlow from '@/components/RandevuFlow'

function RandevuInner() {
  const searchParams = useSearchParams()
  return (
    <RandevuFlow
      preselectedClinicId={searchParams.get('k')}
      preselectedTip={searchParams.get('tip')}
    />
  )
}

export default function RandevuPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400">Yükleniyor…</p>
        </div>
      </main>
    }>
      <RandevuInner />
    </Suspense>
  )
}
