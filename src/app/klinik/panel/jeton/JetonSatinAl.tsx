'use client'

import { useState } from 'react'

const PACKAGES = [
  { id: 'jeton_10',  label: '10 Jeton',  jetons: 10,  priceEur: 49,  pricePerJeton: '€4.90', popular: false },
  { id: 'jeton_25',  label: '25 Jeton',  jetons: 25,  priceEur: 99,  pricePerJeton: '€3.96', popular: true  },
  { id: 'jeton_50',  label: '50 Jeton',  jetons: 50,  priceEur: 179, pricePerJeton: '€3.58', popular: false },
  { id: 'jeton_100', label: '100 Jeton', jetons: 100, priceEur: 299, pricePerJeton: '€2.99', popular: false },
]

export default function JetonSatinAl() {
  const [loading, setLoading] = useState<string | null>(null)

  async function handleBuy(packageId: string) {
    setLoading(packageId)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error ?? 'Bir hata oluştu')
      }
    } catch {
      alert('Bağlantı hatası')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {PACKAGES.map(pkg => (
        <div
          key={pkg.id}
          className={`relative p-5 rounded-2xl border text-center transition-all ${
            pkg.popular
              ? 'bg-violet-600/20 border-violet-500/50'
              : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
          }`}
        >
          {pkg.popular && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
              En Popüler
            </span>
          )}

          <p className="text-white font-black text-2xl mb-1">{pkg.jetons}</p>
          <p className="text-slate-400 text-xs mb-3">Jeton</p>

          <p className="text-white font-bold text-xl mb-1">€{pkg.priceEur}</p>
          <p className="text-slate-500 text-xs mb-4">({pkg.pricePerJeton} / jeton)</p>

          <button
            onClick={() => handleBuy(pkg.id)}
            disabled={loading === pkg.id}
            className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
              pkg.popular
                ? 'bg-violet-600 hover:bg-violet-500 text-white'
                : 'bg-slate-700 hover:bg-slate-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading === pkg.id ? 'Yönlendiriliyor...' : 'Satın Al'}
          </button>
        </div>
      ))}
    </div>
  )
}
