'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import { useCart } from '@/lib/cart'
import AdresForm from '../panel/adreslerim/AdresForm'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Address {
  id: string
  title: string
  full_name: string
  phone: string
  city: string
  district: string
  neighborhood: string | null
  address_line: string
  postal_code: string | null
  is_default: boolean
}

type Step = 'address' | 'payment' | 'success'

export default function OdemeFlow({ initialAddresses }: { initialAddresses: Address[] }) {
  const router = useRouter()
  const { items, subtotal, clear, hydrated } = useCart()

  const [addresses] = useState<Address[]>(initialAddresses)
  const [selectedAddrId, setSelectedAddrId] = useState<string | null>(
    initialAddresses.find(a => a.is_default)?.id ?? initialAddresses[0]?.id ?? null
  )
  const [addingAddress, setAddingAddress] = useState(false)
  const [step, setStep] = useState<Step>('address')
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderNumber, setOrderNumber] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const empty = hydrated && items.length === 0

  async function proceedToPayment() {
    if (!selectedAddrId) {
      setError('Lütfen bir adres seç')
      return
    }
    if (items.length === 0) return
    setError(null)
    setLoading(true)

    const res = await fetch('/api/checkout/create-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity })),
        addressId: selectedAddrId,
      }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Bir hata oluştu')
      return
    }

    setClientSecret(data.clientSecret)
    setOrderNumber(data.orderNumber)
    setStep('payment')
  }

  if (!hydrated) return <div className="py-24 text-center text-slate-600">Yükleniyor...</div>

  if (empty) {
    return (
      <div className="py-24 text-center">
        <div className="text-slate-700 text-5xl mb-4">🛒</div>
        <p className="text-slate-400 mb-4">Sepetin boş, önce ürün eklemelisin</p>
        <Link href="/magaza" className="inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl">
          Mağazaya Git →
        </Link>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        {/* Adım 1: Adres */}
        <div className={`bg-slate-800/50 border rounded-2xl p-6 ${step === 'address' ? 'border-violet-500/50' : 'border-slate-700'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-black ${step === 'address' ? 'bg-violet-600 text-white' : 'bg-emerald-500 text-white'}`}>
                {step === 'address' ? '1' : '✓'}
              </span>
              Teslimat Adresi
            </h2>
            {step !== 'address' && selectedAddrId && (
              <button onClick={() => setStep('address')}
                className="text-violet-400 hover:text-violet-300 text-xs transition-colors">
                Değiştir
              </button>
            )}
          </div>

          {step === 'address' ? (
            <div className="space-y-3">
              {addresses.map(a => (
                <label key={a.id}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    selectedAddrId === a.id
                      ? 'bg-violet-500/10 border-violet-500/50'
                      : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                  }`}>
                  <input type="radio" name="address" checked={selectedAddrId === a.id}
                    onChange={() => setSelectedAddrId(a.id)}
                    className="mt-1 accent-violet-600" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">{a.title}</span>
                      {a.is_default && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                          VARSAYILAN
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm mt-0.5">{a.full_name} · {a.phone}</p>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      {a.address_line}, {a.district} / {a.city}
                    </p>
                  </div>
                </label>
              ))}

              {addingAddress ? (
                <AdresForm
                  onClose={() => setAddingAddress(false)}
                  onSaved={(id) => {
                    setAddingAddress(false)
                    setSelectedAddrId(id)
                    router.refresh()
                  }}
                />
              ) : (
                <button onClick={() => setAddingAddress(true)}
                  className="w-full py-3 border border-dashed border-slate-600 hover:border-violet-500 rounded-xl text-slate-400 hover:text-violet-400 transition-all text-sm">
                  + Yeni Adres Ekle
                </button>
              )}

              <button onClick={proceedToPayment}
                disabled={!selectedAddrId || loading}
                className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl transition-all text-sm">
                {loading ? 'Hazırlanıyor...' : 'Ödemeye Geç →'}
              </button>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
              )}
            </div>
          ) : (
            selectedAddrId && (() => {
              const a = addresses.find(x => x.id === selectedAddrId)
              if (!a) return null
              return (
                <div className="text-sm">
                  <p className="text-white font-bold">{a.full_name}</p>
                  <p className="text-slate-400 mt-1">{a.phone}</p>
                  <p className="text-slate-400 mt-0.5">{a.address_line}, {a.district} / {a.city}</p>
                </div>
              )
            })()
          )}
        </div>

        {/* Adım 2: Ödeme */}
        <div className={`bg-slate-800/50 border rounded-2xl p-6 ${step === 'payment' ? 'border-violet-500/50' : 'border-slate-700'}`}>
          <h2 className="text-white font-bold flex items-center gap-2 mb-4">
            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-black ${step === 'payment' ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-400'}`}>
              2
            </span>
            Ödeme
          </h2>

          {step === 'payment' && clientSecret ? (
            <Elements stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: 'night',
                  variables: { colorPrimary: '#8b5cf6' },
                },
              }}>
              <StripePaymentForm orderNumber={orderNumber!} onSuccess={() => {
                clear()
                router.push(`/siparis/${orderNumber}?success=1`)
              }} />
            </Elements>
          ) : (
            <p className="text-slate-500 text-sm">Önce teslimat adresini onayla</p>
          )}
        </div>
      </div>

      {/* Sağ — Özet */}
      <div className="lg:col-span-1">
        <div className="sticky top-24 bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">Özet</h2>
          <div className="space-y-2 mb-4 text-sm max-h-64 overflow-y-auto">
            {items.map(item => (
              <div key={item.productId} className="flex gap-2">
                <span className="text-slate-500 text-xs shrink-0">{item.quantity}×</span>
                <span className="flex-1 text-slate-300 text-xs line-clamp-1">{item.name}</span>
                <span className="text-white text-xs font-medium shrink-0">
                  ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>
          <div className="space-y-2 pt-4 border-t border-slate-700 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Ara Toplam</span>
              <span className="text-white">₺{subtotal.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Kargo</span>
              <span className="text-slate-500 text-xs">Satıcıdan ücretsiz</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-700 mt-2">
              <span className="text-slate-300 font-medium">Toplam</span>
              <span className="text-white font-black text-xl">₺{subtotal.toLocaleString('tr-TR')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StripePaymentForm({ orderNumber, onSuccess }: { orderNumber: string; onSuccess: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const returnUrl = useMemo(() => {
    if (typeof window === 'undefined') return ''
    return `${window.location.origin}/siparis/${orderNumber}?success=1`
  }, [orderNumber])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setError(null)

    const { error: stripeErr } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    })

    if (stripeErr) {
      setError(stripeErr.message ?? 'Ödeme başarısız')
      setLoading(false)
      return
    }

    onSuccess()
  }

  useEffect(() => {
    // Stripe redirect'ten döndüğünde success (if_required bypass'ında onSuccess elle çağrılır)
  }, [])

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
      )}
      <button type="submit" disabled={!stripe || loading}
        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold rounded-xl transition-all text-sm shadow-lg shadow-violet-500/20">
        {loading ? 'Ödeme işleniyor...' : 'Ödemeyi Tamamla'}
      </button>
      <p className="text-slate-600 text-xs text-center">
        🔒 Stripe · PCI DSS sertifikalı · kart bilgin bize ulaşmaz
      </p>
    </form>
  )
}
