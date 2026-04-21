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

  // Kupon state
  const [couponInput, setCouponInput] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponLoading, setCouponLoading] = useState(false)
  const [couponError, setCouponError] = useState<string | null>(null)

  const empty = hydrated && items.length === 0

  // Kargo: ₺200 ve üstü ücretsiz, altı ₺29
  const FREE_SHIPPING_THRESHOLD = 200
  const SHIPPING_FEE = 29
  const shippingFee = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : (subtotal > 0 ? SHIPPING_FEE : 0)
  const remainingForFreeShip = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)

  const couponDiscount = appliedCoupon?.discount ?? 0
  const total = Math.max(0, subtotal + shippingFee - couponDiscount)

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponLoading(true)
    setCouponError(null)
    try {
      const res = await fetch('/api/checkout/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, subtotal }),
      })
      const data = await res.json()
      if (!data.valid) {
        setCouponError(data.error ?? 'Geçersiz kupon')
        return
      }
      setAppliedCoupon({ code: data.code, discount: data.discount })
      setCouponInput('')
    } catch {
      setCouponError('Doğrulama hatası')
    } finally {
      setCouponLoading(false)
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null)
    setCouponError(null)
  }

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
        couponCode: appliedCoupon?.code,
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
        <div className="sticky top-24 bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Özet</h2>

          {/* Ürün listesi */}
          <div className="space-y-2 text-sm max-h-48 overflow-y-auto">
            {items.map(item => (
              <div key={item.productId} className="flex gap-2 items-center">
                <div className="w-10 h-10 rounded bg-slate-900 border border-slate-700 shrink-0 overflow-hidden">
                  {item.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <span className="text-slate-500 text-xs shrink-0">{item.quantity}×</span>
                <span className="flex-1 text-slate-300 text-xs line-clamp-2">{item.name}</span>
                <span className="text-white text-xs font-medium shrink-0">
                  ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                </span>
              </div>
            ))}
          </div>

          {/* Kupon kodu */}
          <div className="pt-4 border-t border-slate-700">
            {appliedCoupon ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-emerald-400 text-xs font-bold">✓ {appliedCoupon.code}</p>
                  <p className="text-emerald-400/70 text-[10px] mt-0.5">−₺{appliedCoupon.discount.toLocaleString('tr-TR')} indirim</p>
                </div>
                <button onClick={removeCoupon}
                  className="text-slate-500 hover:text-red-400 text-xs transition-colors">
                  Kaldır
                </button>
              </div>
            ) : (
              <div>
                <label className="text-slate-400 text-xs mb-1.5 block">Kupon kodu</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponInput}
                    onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null) }}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                    placeholder="ÖRNEK10"
                    className="flex-1 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white text-sm font-mono uppercase tracking-wider focus:outline-none focus:border-violet-500" />
                  <button onClick={applyCoupon}
                    disabled={!couponInput.trim() || couponLoading}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors">
                    {couponLoading ? '...' : 'Uygula'}
                  </button>
                </div>
                {couponError && (
                  <p className="text-red-400 text-[11px] mt-1.5">✕ {couponError}</p>
                )}
              </div>
            )}
          </div>

          {/* Ücretsiz kargo barı */}
          {remainingForFreeShip > 0 && subtotal > 0 && (
            <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
              <p className="text-amber-400 text-[11px]">
                <strong>₺{remainingForFreeShip.toLocaleString('tr-TR')}</strong> daha ekle, kargo ücretsiz!
              </p>
              <div className="mt-1.5 h-1 bg-amber-500/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all"
                  style={{ width: `${Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Tutarlar */}
          <div className="space-y-2 pt-4 border-t border-slate-700 text-sm">
            <div className="flex justify-between text-slate-400">
              <span>Ara Toplam</span>
              <span className="text-white">₺{subtotal.toLocaleString('tr-TR')}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Kargo</span>
              <span className={shippingFee === 0 ? 'text-emerald-400 font-medium' : 'text-white'}>
                {shippingFee === 0 ? 'Ücretsiz ✓' : `₺${shippingFee}`}
              </span>
            </div>
            {couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>İndirim ({appliedCoupon?.code})</span>
                <span>−₺{couponDiscount.toLocaleString('tr-TR')}</span>
              </div>
            )}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-700 mt-2">
              <span className="text-slate-300 font-medium">Toplam</span>
              <span className="text-white font-black text-xl">₺{total.toLocaleString('tr-TR')}</span>
            </div>
          </div>

          {/* Güvenli ödeme rozeti */}
          <div className="flex items-start gap-2 text-slate-500 text-[11px] pt-2 border-t border-slate-700">
            <svg className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Stripe ile güvenli ödeme · 14 gün cayma hakkı</span>
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
