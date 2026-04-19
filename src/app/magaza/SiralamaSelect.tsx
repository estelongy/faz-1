'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export default function SiralamaSelect({ current }: { current?: string }) {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('siralama', e.target.value)
    router.push(`/magaza?${params.toString()}`)
  }

  return (
    <select
      defaultValue={current ?? 'puan'}
      onChange={handleChange}
      className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-violet-500">
      <option value="puan">En Yüksek Puan</option>
      <option value="tercih">En Çok Tercih</option>
      <option value="fiyat_asc">Fiyat: Düşük → Yüksek</option>
      <option value="fiyat_desc">Fiyat: Yüksek → Düşük</option>
    </select>
  )
}
