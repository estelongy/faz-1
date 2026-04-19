'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function UrunOnayActions({
  productId,
  currentStatus,
}: {
  productId: string
  currentStatus?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: 'approved' | 'rejected') {
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('products')
      .update({ approval_status: status, is_active: status === 'approved' })
      .eq('id', productId)
    router.refresh()
    setLoading(false)
  }

  if (currentStatus === 'approved') {
    return (
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all disabled:opacity-40">
        Yayından Kaldır
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => updateStatus('approved')}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl transition-all disabled:opacity-40">
        Onayla
      </button>
      <button
        onClick={() => updateStatus('rejected')}
        disabled={loading}
        className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl transition-all disabled:opacity-40">
        Reddet
      </button>
    </div>
  )
}
