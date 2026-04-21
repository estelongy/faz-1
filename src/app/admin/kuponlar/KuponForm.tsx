'use client'

import { useState, useTransition } from 'react'
import { kuponOlusturAction } from './kupon-actions'

export default function KuponForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [code, setCode]           = useState('')
  const [type, setType]           = useState<'percent' | 'fixed'>('percent')
  const [value, setValue]         = useState<number>(10)
  const [minOrder, setMinOrder]   = useState<number>(0)
  const [maxUses, setMaxUses]     = useState<number | ''>('')
  const [validUntil, setValidUntil] = useState('')

  function generate() {
    const chars = 'ABCDEFGHIJKLMNPQRSTUVWXYZ23456789'
    let result = ''
    for (let i = 0; i < 8; i++) result += chars[Math.floor(Math.random() * chars.length)]
    setCode(result)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null); setSuccess(null)
    startTransition(async () => {
      const res = await kuponOlusturAction({
        code, type, value, minOrder,
        maxUses: maxUses === '' ? null : maxUses,
        validUntil: validUntil || null,
      })
      if (!res.ok) { setError(res.error ?? 'Hata'); return }
      setSuccess(`Kupon oluşturuldu: ${code}`)
      setCode(''); setValue(10); setMinOrder(0); setMaxUses(''); setValidUntil('')
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
      {/* Kod */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Kupon Kodu</label>
        <div className="flex gap-2">
          <input
            type="text"
            required
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="ESTELONGY10"
            maxLength={20}
            className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm font-mono uppercase tracking-widest focus:outline-none focus:border-violet-500"
          />
          <button
            type="button"
            onClick={generate}
            className="px-3 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs rounded-xl transition-colors">
            Üret
          </button>
        </div>
      </div>

      {/* İndirim tipi + değer */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Tip</label>
          <select
            value={type}
            onChange={e => setType(e.target.value as 'percent' | 'fixed')}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
          >
            <option value="percent">Yüzde (%)</option>
            <option value="fixed">Sabit (₺)</option>
          </select>
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">
            {type === 'percent' ? 'Yüzde' : 'Tutar (₺)'}
          </label>
          <input
            type="number"
            required
            min={1}
            max={type === 'percent' ? 100 : undefined}
            value={value}
            onChange={e => setValue(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Min sipariş + Max kullanım */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Min. Sipariş (₺)</label>
          <input
            type="number"
            min={0}
            value={minOrder}
            onChange={e => setMinOrder(Number(e.target.value))}
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Max Kullanım <span className="text-slate-600">(boş=sınırsız)</span></label>
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={e => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="∞"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
          />
        </div>
      </div>

      {/* Geçerlilik tarihi */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Geçerlilik Tarihi <span className="text-slate-600">(boş=süresiz)</span></label>
        <input
          type="datetime-local"
          value={validUntil}
          onChange={e => setValidUntil(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500"
        />
      </div>

      {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
      {success && <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">{success}</div>}

      <button
        type="submit"
        disabled={isPending || !code}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all">
        {isPending ? 'Oluşturuluyor...' : 'Kuponu Oluştur'}
      </button>
    </form>
  )
}
