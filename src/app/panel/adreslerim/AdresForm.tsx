'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { adresKaydetAction } from './adres-actions'

interface InitialAddress {
  id?: string
  title?: string | null
  full_name?: string | null
  phone?: string | null
  city?: string | null
  district?: string | null
  neighborhood?: string | null
  address_line?: string | null
  postal_code?: string | null
  is_default?: boolean | null
}

interface Props {
  initial?: InitialAddress
  onClose?: () => void
  onSaved?: (id: string) => void
}

export default function AdresForm({ initial, onClose, onSaved }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [title,     setTitle]     = useState(initial?.title ?? 'Ev')
  const [fullName,  setFullName]  = useState(initial?.full_name ?? '')
  const [phone,     setPhone]     = useState(initial?.phone ?? '')
  const [city,      setCity]      = useState(initial?.city ?? '')
  const [district,  setDistrict]  = useState(initial?.district ?? '')
  const [hood,      setHood]      = useState(initial?.neighborhood ?? '')
  const [addr,      setAddr]      = useState(initial?.address_line ?? '')
  const [postal,    setPostal]    = useState(initial?.postal_code ?? '')
  const [isDefault, setIsDefault] = useState(initial?.is_default ?? false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const res = await adresKaydetAction({
        id: initial?.id,
        title, full_name: fullName, phone,
        city, district, neighborhood: hood,
        address_line: addr, postal_code: postal,
        is_default: isDefault,
      })
      if (!res.ok) {
        setError(res.error ?? 'Kaydedilemedi.')
        return
      }
      router.refresh()
      if (res.id) onSaved?.(res.id)
      onClose?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="p-5 bg-slate-800/50 border border-violet-500/30 rounded-2xl space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-sm">{initial?.id ? 'Adresi Düzenle' : 'Yeni Adres'}</h3>
        {onClose && (
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-white text-sm">İptal</button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-xs mb-1">Adres Başlığı *</label>
          <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
            placeholder="Ev / İş"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">Ad Soyad *</label>
          <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      <div>
        <label className="block text-slate-400 text-xs mb-1">Telefon *</label>
        <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="+90 5XX XXX XX XX"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-slate-400 text-xs mb-1">İl *</label>
          <input type="text" required value={city} onChange={e => setCity(e.target.value)}
            placeholder="İstanbul"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>
        <div>
          <label className="block text-slate-400 text-xs mb-1">İlçe *</label>
          <input type="text" required value={district} onChange={e => setDistrict(e.target.value)}
            placeholder="Kadıköy"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
        </div>
      </div>

      <div>
        <label className="block text-slate-400 text-xs mb-1">Mahalle</label>
        <input type="text" value={hood} onChange={e => setHood(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>

      <div>
        <label className="block text-slate-400 text-xs mb-1">Açık Adres *</label>
        <textarea required value={addr} onChange={e => setAddr(e.target.value)}
          rows={2} placeholder="Sokak, No, Daire"
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 resize-none" />
      </div>

      <div>
        <label className="block text-slate-400 text-xs mb-1">Posta Kodu</label>
        <input type="text" value={postal} onChange={e => setPostal(e.target.value)}
          className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)}
          className="w-4 h-4 accent-violet-600" />
        <span className="text-sm text-slate-300">Varsayılan adres olarak ayarla</span>
      </label>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">{error}</div>
      )}

      <button type="submit" disabled={isPending}
        className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-sm">
        {isPending ? 'Kaydediliyor...' : 'Adresi Kaydet'}
      </button>
    </form>
  )
}
