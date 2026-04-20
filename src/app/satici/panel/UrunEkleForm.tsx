'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { urunEkleAction } from './urun-ekle-action'

const CATEGORIES = [
  { value: 'botox',       label: 'Botoks' },
  { value: 'filler',      label: 'Dolgu' },
  { value: 'mezo',        label: 'Mezoterapi' },
  { value: 'laser',       label: 'Lazer' },
  { value: 'gold_needle', label: 'Altın İğne' },
  { value: 'peeling',     label: 'Peeling' },
  { value: 'serum',       label: 'Serum' },
  { value: 'supplement',  label: 'Takviye' },
  { value: 'device',      label: 'Cihaz' },
  { value: 'other',       label: 'Diğer' },
]

export default function UrunEkleForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const [name,          setName]          = useState('')
  const [category,      setCategory]      = useState('serum')
  const [treatmentType, setTreatmentType] = useState<'product' | 'treatment'>('product')
  const [description,   setDescription]   = useState('')
  const [price,         setPrice]         = useState('')
  const [ingredients,   setIngredients]   = useState('')

  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Ürün adı zorunludur.'); return }
    setError(null)
    setLoading(true)

    const ingsArr = ingredients
      ? ingredients.split(',').map(s => s.trim()).filter(Boolean)
      : []

    const res = await urunEkleAction({
      name: name.trim(),
      category,
      treatmentType,
      description: description.trim(),
      price: price ? Number(price) : null,
      ingredients: ingsArr,
    })

    if (!res.ok) {
      setError(res.error ?? 'Ürün eklenemedi.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setName(''); setDescription(''); setPrice(''); setIngredients('')
    router.refresh()
    setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-4 border border-dashed border-slate-600 hover:border-violet-500 rounded-2xl text-slate-400 hover:text-violet-400 transition-all text-sm font-medium">
        + Yeni Ürün / İşlem Ekle
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-slate-800/50 border border-violet-500/30 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold">Yeni Ürün / İşlem</h3>
        <button type="button" onClick={() => setOpen(false)} className="text-slate-500 hover:text-white text-sm">İptal</button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm">
          ✓ Ürün eklendi. Admin onayından sonra mağazada görünecek.
        </div>
      )}

      {/* Tür seçimi */}
      <div className="grid grid-cols-2 gap-2">
        {(['product', 'treatment'] as const).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setTreatmentType(t)}
            className={`py-2.5 rounded-xl text-sm font-medium border transition-all ${
              treatmentType === t
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'
            }`}>
            {t === 'product' ? '📦 Ürün' : '💉 Klinik İşlem'}
          </button>
        ))}
      </div>

      {/* Ad */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Ürün / İşlem Adı <span className="text-red-400">*</span></label>
        <input
          type="text" required value={name} onChange={e => setName(e.target.value)}
          placeholder="ör. Hyaluronik Asit Serum"
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Kategori */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Kategori</label>
        <select
          value={category} onChange={e => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-violet-500">
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </div>

      {/* Fiyat */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Fiyat (₺) <span className="text-slate-600">(isteğe bağlı)</span></label>
        <input
          type="number" min={0} value={price} onChange={e => setPrice(e.target.value)}
          placeholder="ör. 450"
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-colors"
        />
      </div>

      {/* Açıklama */}
      <div>
        <label className="block text-slate-400 text-xs mb-1">Açıklama <span className="text-slate-600">(isteğe bağlı)</span></label>
        <textarea
          value={description} onChange={e => setDescription(e.target.value)}
          placeholder="Ürün veya işlem hakkında kısa bilgi..."
          rows={3} maxLength={500}
          className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-colors resize-none"
        />
      </div>

      {/* İçerikler */}
      {treatmentType === 'product' && (
        <div>
          <label className="block text-slate-400 text-xs mb-1">İçerikler / Bileşenler <span className="text-slate-600">(virgülle ayır)</span></label>
          <input
            type="text" value={ingredients} onChange={e => setIngredients(e.target.value)}
            placeholder="ör. Hyaluronik Asit, Retinol, Niasinamid"
            className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-600 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      )}

      <p className="text-slate-600 text-xs">* Eklenen ürünler admin onayından sonra mağazada yayınlanır.</p>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}

      <button
        type="submit" disabled={loading}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-sm">
        {loading ? 'Ekleniyor...' : 'Ürünü Gönder'}
      </button>
    </form>
  )
}
