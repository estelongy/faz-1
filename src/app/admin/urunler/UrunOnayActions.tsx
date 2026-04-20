'use client'

import { useTransition } from 'react'

type ActionFn = (productId: string, status: 'approved' | 'rejected') => Promise<void>

export default function UrunOnayActions({
  productId,
  currentStatus,
  action,
}: {
  productId: string
  currentStatus?: string
  action: ActionFn
}) {
  const [pending, startTransition] = useTransition()

  function run(status: 'approved' | 'rejected') {
    startTransition(() => { action(productId, status) })
  }

  if (currentStatus === 'approved') {
    return (
      <button
        onClick={() => run('rejected')}
        disabled={pending}
        className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all disabled:opacity-40">
        Yayından Kaldır
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => run('approved')}
        disabled={pending}
        className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all disabled:opacity-40">
        Onayla
      </button>
      <button
        onClick={() => run('rejected')}
        disabled={pending}
        className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all disabled:opacity-40">
        Reddet
      </button>
    </div>
  )
}
