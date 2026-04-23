'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Step = 'form' | 'otp' | 'verify'

export default function KayitPage() {
  const router = useRouter()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName]   = useState('')
  const [email, setEmail]         = useState('')
  const [phone, setPhone]         = useState('')
  const [password, setPassword]   = useState('')
  const [birthYear, setBirthYear] = useState('')
  const [agreed, setAgreed]       = useState(false)

  const [step, setStep]       = useState<Step>('form')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  // OTP state
  const [otpCode, setOtpCode]   = useState('')
  const [otpPhone, setOtpPhone] = useState('')
  const [otpResent, setOtpResent] = useState(false)

  function formatPhone(raw: string) {
    const d = raw.replace(/\D/g, '')
    if (d.startsWith('90')) return `+${d}`
    if (d.startsWith('0')) return `+90${d.slice(1)}`
    return `+90${d}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ad ve soyad zorunludur.')
      return
    }
    const birthYearNum = parseInt(birthYear)
    const currentYear = new Date().getFullYear()
    if (!birthYear || isNaN(birthYearNum) || birthYearNum < 1900 || birthYearNum > currentYear - 18) {
      setError('Geçerli bir doğum yılı girin (18 yaş ve üzeri).')
      return
    }
    if (phone.replace(/\D/g, '').length < 10) {
      setError('Geçerli bir telefon numarası girin.')
      return
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalıdır.')
      return
    }
    if (!agreed) {
      setError('Devam etmek için sözleşmeyi onaylamanız gerekiyor.')
      return
    }

    // SMS OTP geçici olarak devre dışı (Twilio provider hazır olunca açılacak)
    const OTP_ENABLED = false
    const e164 = formatPhone(phone)

    if (OTP_ENABLED) {
      setLoading(true)
      const supabase = createClient()
      const { error: otpErr } = await supabase.auth.signInWithOtp({ phone: e164 })
      setLoading(false)
      if (otpErr) {
        setError('SMS gönderilemedi: ' + otpErr.message)
        return
      }
      setOtpPhone(e164)
      setStep('otp')
      setOtpResent(false)
      return
    }

    // OTP kapalı → direkt API ile hesap oluştur
    setLoading(true)
    const birthYearNum = parseInt(birthYear)
    const res = await fetch('/api/kayit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        phone: e164,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_year: birthYearNum,
      }),
    })
    const result = await res.json()
    if (!res.ok) {
      setError(result.error || 'Hesap oluşturulamadı.')
      setLoading(false)
      return
    }
    const supabase = createClient()
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInErr) { setStep('verify'); return }
    router.push('/panel')
    router.refresh()
  }

  async function handleVerifyOtp() {
    if (otpCode.length !== 6) return
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: verErr } = await supabase.auth.verifyOtp({ phone: otpPhone, token: otpCode, type: 'sms' })
    if (verErr) {
      setError('Kod hatalı veya süresi dolmuş.')
      setLoading(false)
      return
    }

    // OTP doğrulandı → telefonla oluşan anonim session'u temizle
    await supabase.auth.signOut()

    // Admin API ile telefon + e-posta + şifre birlikte kayıt
    const birthYearNum = parseInt(birthYear)
    const res = await fetch('/api/kayit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
        phone: otpPhone,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        birth_year: birthYearNum,
      }),
    })
    const result = await res.json()

    if (!res.ok) {
      setError(result.error || 'Hesap oluşturulamadı.')
      setLoading(false)
      return
    }

    // Oluşan kullanıcıyla oturum aç
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (signInErr) { setStep('verify'); return }

    router.push('/panel')
    router.refresh()
  }

  async function handleResendOtp() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error: err } = await supabase.auth.signInWithOtp({ phone: otpPhone })
    setLoading(false)
    if (err) { setError('Tekrar gönderilemedi.'); return }
    setOtpResent(true)
    setOtpCode('')
  }

  async function handleResendEmail() {
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setError('E-posta tekrar gönderilemedi.')
    setLoading(false)
  }

  // ─── SMS OTP Doğrulama Ekranı ─────────────────────────────────────────
  if (step === 'otp') return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <div className="w-14 h-14 mx-auto rounded-xl bg-blue-500/20 flex items-center justify-center mb-5">
            <svg className="w-7 h-7 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center mb-1">Telefon Doğrulama</h2>
          <p className="text-slate-400 text-sm text-center mb-5">
            <span className="text-white font-medium">{otpPhone}</span> numarasına 6 haneli kod gönderdik.
          </p>

          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otpCode}
            onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
            placeholder="_ _ _ _ _ _"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors mb-3"
            autoFocus
          />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-3">{error}</div>
          )}
          {otpResent && !error && (
            <p className="text-emerald-400 text-sm text-center mb-3">Kod tekrar gönderildi.</p>
          )}

          <button onClick={handleVerifyOtp} disabled={otpCode.length !== 6 || loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all mb-3">
            {loading ? 'Doğrulanıyor...' : 'Doğrula ve Kayıt Ol'}
          </button>

          <div className="flex gap-2">
            <button onClick={handleResendOtp} disabled={loading}
              className="flex-1 py-2 text-slate-400 hover:text-white text-sm transition-colors">
              Tekrar Gönder
            </button>
            <button onClick={() => { setStep('form'); setOtpCode(''); setError(null) }}
              className="flex-1 py-2 text-slate-400 hover:text-white text-sm transition-colors">
              Geri
            </button>
          </div>
        </div>
      </div>
    </main>
  )

  // ─── E-posta Doğrulama Ekranı ──────────────────────────────────────────
  if (step === 'verify') return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">E-postanızı doğrulayın</h2>
          <p className="text-slate-400 mb-1">
            <span className="text-violet-400 font-medium">{email}</span> adresine doğrulama bağlantısı gönderdik.
          </p>
          <p className="text-slate-500 text-sm mb-6">Spam kutunuzu da kontrol edin.</p>
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm mb-4">{error}</div>
          )}
          <button onClick={handleResendEmail} disabled={loading}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white font-medium rounded-xl text-sm transition-colors mb-3">
            {loading ? 'Gönderiliyor...' : 'Tekrar gönder'}
          </button>
          <Link href="/giris" className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
            Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </main>
  )

  // ─── Kayıt Formu ───────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Geri
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Hesap Oluştur</h1>
            <p className="text-slate-400 text-sm mt-1">Cildinizi keşfetmeye başlayın</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Ad / Soyad */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Ad <span className="text-red-400">*</span></label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  placeholder="Adınız"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Soyad <span className="text-red-400">*</span></label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  placeholder="Soyadınız"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>

            {/* Doğum Yılı */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                Doğum Yılı <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                required
                min={1900}
                max={new Date().getFullYear() - 18}
                value={birthYear}
                onChange={e => setBirthYear(e.target.value)}
                placeholder={String(new Date().getFullYear() - 30)}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Telefon <span className="text-red-400">*</span></label>
              <div className="flex gap-2">
                <div className="flex items-center gap-1.5 px-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-300 text-sm shrink-0 select-none">
                  🇹🇷 <span>+90</span>
                </div>
                <input type="tel" required value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  placeholder="5xx xxx xx xx"
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>

            {/* E-posta */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">E-posta <span className="text-red-400">*</span></label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="ornek@email.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>

            {/* Şifre */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">Şifre <span className="text-red-400">*</span></label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="En az 6 karakter"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
              {password.length > 0 && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className={`flex-1 h-1 rounded-full transition-colors ${
                        password.length >= i * 3
                          ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-amber-500' : i <= 3 ? 'bg-emerald-500' : 'bg-[#00d4ff]'
                          : 'bg-slate-700'
                      }`} />
                    ))}
                  </div>
                  <p className="text-slate-500 text-xs">
                    {password.length < 3 ? 'Çok zayıf' : password.length < 6 ? 'Zayıf' : password.length < 9 ? 'Orta' : password.length < 12 ? 'Güçlü' : 'Çok güçlü'}
                  </p>
                </div>
              )}
            </div>

            {/* Sözleşme */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5 shrink-0">
                  <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
                    className="sr-only" />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    agreed ? 'bg-violet-600 border-violet-600' : 'border-slate-600 group-hover:border-slate-500'
                  }`}>
                    {agreed && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-slate-400 text-sm leading-relaxed">
                  <Link href="/hakkinda/sozlesme" target="_blank" className="text-violet-400 hover:text-violet-300 underline">Üyelik Sözleşmesi</Link>&apos;ni ve{' '}
                  <Link href="/hakkinda/aydinlatma" target="_blank" className="text-violet-400 hover:text-violet-300 underline">Hasta Aydınlatma Metni</Link>&apos;ni okudum, kabul ediyorum.
                </span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading || !agreed}
              className="w-full py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all mt-2">
              {loading ? 'SMS Gönderiliyor...' : 'Kayıt Ol'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-400 text-sm">
            Zaten hesabınız var mı?{' '}
            <Link href="/giris" className="text-violet-400 hover:text-violet-300 font-medium">Giriş yapın</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
