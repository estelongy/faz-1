'use client'

import { useState, useEffect } from 'react'

interface Props {
  phone: string                      // normalize edilmiş veya 0-lı format fark etmez, backend normalize eder
  onVerified: () => void             // kod doğrulanınca çağrılır
  onBack?: () => void                // "geri dön, numarayı değiştir"
  autoSend?: boolean                 // true ise mount'ta otomatik OTP göndermeyi dener
}

type Phase = 'idle' | 'sending' | 'entering' | 'verifying' | 'verified' | 'error'

export default function PhoneOtpStep({ phone, onVerified, onBack, autoSend = true }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)   // saniye — tekrar gönder butonu kilidi

  // Cooldown sayacı
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  async function sendOtp() {
    setPhase('sending')
    setError(null)
    setInfo(null)
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPhase('error')
        setError(json.error ?? 'Kod gönderilemedi')
        return
      }
      setPhase('entering')
      setInfo('Kod telefonunuza gönderildi. SMS kutunuza bakın.')
      setCooldown(180)  // 3 dk kilit (backend rate limit ile uyumlu)
    } catch {
      setPhase('error')
      setError('Bağlantı hatası, tekrar deneyin.')
    }
  }

  // Mount'ta otomatik gönder
  useEffect(() => {
    if (autoSend) sendOtp()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function verifyCode() {
    if (code.length !== 6) return
    setPhase('verifying')
    setError(null)
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      })
      const json = await res.json()
      if (!res.ok) {
        setPhase('entering')
        setError(json.error ?? 'Kod hatalı')
        return
      }
      setPhase('verified')
      onVerified()
    } catch {
      setPhase('entering')
      setError('Bağlantı hatası, tekrar deneyin.')
    }
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center mb-3">
          <svg className="w-7 h-7 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.95.68l1.5 4.5a1 1 0 01-.5 1.21l-2.26 1.13a11 11 0 005.52 5.52l1.13-2.26a1 1 0 011.21-.5l4.5 1.5a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.72 21 3 14.28 3 6V5z" />
          </svg>
        </div>
        <h2 className="text-white text-xl font-bold mb-1">Telefon Doğrulama</h2>
        <p className="text-slate-400 text-sm">
          <span className="text-white font-medium">{phone}</span> numarasına gönderilen 6 haneli kodu girin
        </p>
      </div>

      {info && phase !== 'error' && (
        <p className="text-emerald-400 text-sm text-center">{info}</p>
      )}

      {phase === 'sending' && (
        <div className="text-center py-4">
          <div className="w-8 h-8 mx-auto rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <p className="text-slate-400 text-sm mt-2">Kod gönderiliyor…</p>
        </div>
      )}

      {(phase === 'entering' || phase === 'verifying' || phase === 'error') && (
        <>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="_ _ _ _ _ _"
            autoFocus
            onKeyDown={e => e.key === 'Enter' && verifyCode()}
            className="w-full px-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white text-center text-3xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-violet-500"
          />

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            onClick={verifyCode}
            disabled={code.length !== 6 || phase === 'verifying'}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 text-white font-semibold rounded-xl"
          >
            {phase === 'verifying' ? 'Doğrulanıyor…' : 'Doğrula ve Devam Et'}
          </button>

          <div className="flex items-center justify-between pt-2">
            <button
              onClick={sendOtp}
              disabled={cooldown > 0 || phase === 'verifying'}
              className="text-slate-400 hover:text-white text-sm disabled:opacity-40"
            >
              {cooldown > 0
                ? `Yeni kod gönder (${Math.floor(cooldown / 60)}:${String(cooldown % 60).padStart(2, '0')})`
                : 'Yeni kod gönder'}
            </button>
            {onBack && (
              <button onClick={onBack} className="text-slate-400 hover:text-white text-sm">
                ← Numarayı değiştir
              </button>
            )}
          </div>
        </>
      )}

      {phase === 'error' && !info && (
        <button
          onClick={sendOtp}
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl"
        >
          Tekrar Dene
        </button>
      )}
    </div>
  )
}
