'use client'

import { useState, useEffect, useTransition } from 'react'

interface Initial {
  companyName: string
  hasAccount: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  commissionRate: number
}

interface StatusData {
  hasAccount: boolean
  accountId?: string
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requirements?: { currentlyDue: string[]; eventuallyDue: string[]; pastDue: string[] }
}

export default function OdemeHesabiPanel({ initial }: { initial: Initial }) {
  const [status, setStatus] = useState<StatusData>({
    hasAccount: initial.hasAccount,
    chargesEnabled: initial.chargesEnabled,
    payoutsEnabled: initial.payoutsEnabled,
    detailsSubmitted: initial.detailsSubmitted,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Hesap varsa canlı durum çek
  useEffect(() => {
    if (!initial.hasAccount) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/stripe/connect/account-status')
        const data = await res.json()
        if (!cancelled && res.ok) setStatus(data)
      } catch { /* ignore */ }
    })()
    return () => { cancelled = true }
  }, [initial.hasAccount])

  const fullyActive = status.hasAccount && status.chargesEnabled && status.payoutsEnabled && status.detailsSubmitted

  function createAccount() {
    setError(null)
    setLoading(true)
    startTransition(async () => {
      const res = await fetch('/api/stripe/connect/create-account', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Hesap oluşturulamadı')
        setLoading(false)
        return
      }
      setStatus(p => ({ ...p, hasAccount: true, accountId: data.accountId }))
      // Devamında onboarding link'e yönlendir
      await startOnboarding()
    })
  }

  async function startOnboarding() {
    setError(null)
    setLoading(true)
    const res = await fetch('/api/stripe/connect/onboarding-link', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setError(data.error ?? 'Bilgi girişi başlatılamadı')
      setLoading(false)
      return
    }
    window.location.href = data.url
  }

  return (
    <div className="space-y-6">
      {/* Durum kartı */}
      <div className={`p-6 rounded-2xl border ${
        fullyActive
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : status.hasAccount
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-slate-800/50 border-slate-700'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
            fullyActive ? 'bg-emerald-500/20' : status.hasAccount ? 'bg-amber-500/20' : 'bg-slate-700'
          }`}>
            {fullyActive ? '✓' : status.hasAccount ? '⏳' : '💳'}
          </div>
          <div className="flex-1">
            <h2 className="text-white font-bold text-lg">
              {fullyActive
                ? 'Ödemeler Aktif'
                : status.hasAccount
                  ? 'Hesap bilgisi eksik'
                  : 'Ödeme Hesabı Kur'}
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              {fullyActive
                ? 'Kart ödemesi alabilir ve banka hesabına çekim yapabilirsin. Her satış otomatik aktarılır.'
                : status.hasAccount
                  ? 'Stripe hesabın açıldı fakat bazı bilgiler eksik. Tamamlayınca satışa başlayabilirsin.'
                  : 'Müşteri ödemelerini alabilmen için Stripe üzerinden bir hesap oluşturman gerekiyor. 5 dakika sürer.'}
            </p>
          </div>
        </div>

        {/* Durum göstergeleri */}
        {status.hasAccount && (
          <div className="mt-5 pt-5 border-t border-white/10 grid grid-cols-3 gap-3 text-xs">
            <StatusDot active={status.detailsSubmitted} label="Bilgiler" />
            <StatusDot active={status.chargesEnabled}   label="Kart Ödemesi" />
            <StatusDot active={status.payoutsEnabled}   label="Banka Çekimi" />
          </div>
        )}

        {/* Gereksinimler */}
        {status.hasAccount && !fullyActive && status.requirements?.currentlyDue && status.requirements.currentlyDue.length > 0 && (
          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-amber-400 font-bold text-xs uppercase tracking-widest mb-2">Eksik Bilgiler</p>
            <ul className="text-slate-400 text-xs space-y-0.5 list-disc list-inside">
              {status.requirements.currentlyDue.map(r => (
                <li key={r} className="font-mono text-[11px]">{r}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Butonlar */}
        <div className="mt-6 flex gap-3">
          {!status.hasAccount ? (
            <button onClick={createAccount} disabled={loading || isPending}
              className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all">
              {loading ? 'Başlatılıyor...' : 'Stripe Hesabı Oluştur'}
            </button>
          ) : !fullyActive ? (
            <button onClick={startOnboarding} disabled={loading}
              className="flex-1 py-3 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all">
              {loading ? 'Yönlendiriliyor...' : 'Bilgileri Tamamla'}
            </button>
          ) : (
            <button onClick={startOnboarding} disabled={loading}
              className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 disabled:opacity-40 text-slate-300 font-medium rounded-xl text-sm transition-all">
              Stripe Ayarlarımı Düzenle
            </button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
        )}
      </div>

      {/* Bilgi kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <InfoCard icon="🏦" title="Güvenli Ödeme"
          desc="Kart bilgileri Stripe'ta saklanır, bize hiç ulaşmaz. PCI DSS sertifikalı." />
        <InfoCard icon="💸" title="Otomatik Çekim"
          desc="Satış sonrası ücret otomatik banka hesabına aktarılır (2-3 iş günü)." />
        <InfoCard icon={`%${(initial.commissionRate * 100).toFixed(0)}`} title="Platform Komisyonu"
          desc={`Satışın %${(initial.commissionRate * 100).toFixed(0)}'i platform komisyonu. Kalanı senin.`} />
      </div>

      {/* SSS */}
      <details className="p-5 bg-slate-800/30 border border-slate-700 rounded-2xl text-sm">
        <summary className="text-white font-semibold cursor-pointer">Hangi bilgileri gireceğim?</summary>
        <div className="mt-3 text-slate-400 space-y-2 leading-relaxed">
          <p>Stripe sizi doğrulamak için şunları ister:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Firma adı, vergi no, MERSIS</li>
            <li>Yetkili kişi (ad, TCKN, doğum tarihi, adres)</li>
            <li>Banka hesabı (TR IBAN)</li>
            <li>Kimlik doğrulaması (pasaport veya ehliyet fotoğrafı)</li>
          </ul>
          <p>Verilerin Stripe&apos;ta tutulur; Estelongy bu bilgileri görmez.</p>
        </div>
      </details>
    </div>
  )
}

function StatusDot({ active, label }: { active: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-400' : 'bg-slate-600'}`} />
      <span className={active ? 'text-slate-200' : 'text-slate-500'}>{label}</span>
    </div>
  )
}

function InfoCard({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-2xl">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-white font-bold text-sm mb-1">{title}</p>
      <p className="text-slate-500 text-xs leading-relaxed">{desc}</p>
    </div>
  )
}
