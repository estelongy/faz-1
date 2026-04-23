'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  action: (formData: FormData) => Promise<void>
  hasError: boolean
  isLoggedIn: boolean
}

function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('90')) return '+' + digits
  if (digits.startsWith('0')) return '+9' + digits
  return '+90' + digits
}

export default function SaticiBasvurForm({ action, hasError, isLoggedIn }: Props) {
  // OTP state
  const [otpStep, setOtpStep]         = useState(false)
  const [otpPhone, setOtpPhone]       = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const otpVerifiedRef                = useRef(false)
  const [otpCode, setOtpCode]         = useState('')
  const [otpLoading, setOtpLoading]   = useState(false)
  const [otpError, setOtpError]       = useState('')
  const [otpResend, setOtpResend]     = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (otpVerifiedRef.current) {
      const formData = new FormData(formRef.current!)
      await action(formData)
      return
    }
    const phoneInput = (formRef.current?.elements.namedItem('phone') as HTMLInputElement)?.value
    if (!phoneInput) {
      setOtpError('Telefon numarası giriniz.')
      return
    }

    const e164 = toE164(phoneInput)
    setOtpPhone(e164)
    setOtpLoading(true)
    setOtpError('')

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOtp({ phone: e164 })
      setOtpLoading(false)

      if (error) {
        setOtpError('SMS gönderilemedi: ' + error.message)
        return
      }
      setOtpStep(true)
      setOtpResend(false)
    } catch (err: unknown) {
      setOtpLoading(false)
      setOtpError('Beklenmeyen hata: ' + (err instanceof Error ? err.message : String(err)))
    }
  }

  async function handleVerify() {
    if (otpCode.length !== 6) return
    setOtpLoading(true)
    setOtpError('')
    const supabase = createClient()
    const { error } = await supabase.auth.verifyOtp({ phone: otpPhone, token: otpCode, type: 'sms' })
    setOtpLoading(false)
    if (error) {
      setOtpError('Kod hatalı veya süresi dolmuş.')
      return
    }
    otpVerifiedRef.current = true
    setOtpVerified(true)
    setOtpStep(false)
    const formData = new FormData(formRef.current!)
    await action(formData)
  }

  async function handleResend() {
    setOtpLoading(true)
    setOtpError('')
    const supabase = createClient()
    await supabase.auth.signInWithOtp({ phone: otpPhone })
    setOtpLoading(false)
    setOtpResend(true)
    setOtpCode('')
  }

  return (
    <>
      {hasError && (
        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-red-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-400 text-sm">
            Başvuru gönderilemedi. Zaten aktif bir başvurunuz olabilir veya bir hata oluştu. Lütfen tekrar deneyin.
          </p>
        </div>
      )}

      {otpStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-white font-bold text-lg mb-1">Telefon Doğrulama</h3>
            <p className="text-slate-400 text-sm mb-5">
              <span className="text-white font-medium">{otpPhone}</span> numarasına 6 haneli kod gönderdik.
            </p>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              placeholder="_ _ _ _ _ _"
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors mb-3"
              autoFocus
            />

            {otpError && <p className="text-red-400 text-sm mb-3">{otpError}</p>}
            {otpResend && <p className="text-emerald-400 text-sm mb-3">Kod tekrar gönderildi.</p>}

            <button
              type="button"
              onClick={handleVerify}
              disabled={otpCode.length !== 6 || otpLoading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all mb-3"
            >
              {otpLoading ? 'Doğrulanıyor...' : 'Doğrula'}
            </button>

            <div className="flex gap-2">
              <button type="button" onClick={handleResend} disabled={otpLoading}
                className="flex-1 py-2 text-slate-400 hover:text-white text-sm transition-colors">
                Tekrar Gönder
              </button>
              <button type="button" onClick={() => setOtpStep(false)}
                className="flex-1 py-2 text-slate-400 hover:text-white text-sm transition-colors">
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
        {!isLoggedIn && (
          <div className="space-y-4 p-5 rounded-xl bg-slate-800/60 border border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Hesap Bilgileri</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Ad <span className="text-red-400">*</span></label>
                <input type="text" name="first_name" required placeholder="Ahmet"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Soyad</label>
                <input type="text" name="last_name" placeholder="Yılmaz"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">E-posta <span className="text-red-400">*</span></label>
              <input type="email" name="email" required placeholder="ornek@email.com"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Şifre <span className="text-red-400">*</span></label>
              <input type="password" name="password" required placeholder="En az 8 karakter" minLength={8}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">Doğum Yılı</label>
              <input type="number" name="birth_year" placeholder="1985" min={1920} max={new Date().getFullYear() - 18}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-400 mb-2">Şirket / Marka Adı <span className="text-red-400">*</span></label>
          <input type="text" name="company_name" required placeholder="Örn: DermaCare Kozmetik A.Ş."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Telefon <span className="text-red-400">*</span>
            {otpVerified && <span className="ml-2 text-emerald-400 text-xs font-normal">✓ Doğrulandı</span>}
          </label>
          <input type="tel" name="phone" required placeholder="05XX XXX XX XX"
            disabled={otpVerified}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60" />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Vergi Numarası</label>
          <input type="text" name="tax_number" placeholder="1234567890"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
          <p className="text-slate-500 text-xs mt-1">Fatura işlemleri için gereklidir</p>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-300 text-sm">
            <strong>Not:</strong> Başvurunuz onaylandıktan sonra ürün ekleyebilir ve satışa başlayabilirsiniz.
          </p>
        </div>

        {otpError && !otpStep && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
            <p className="text-red-400 text-sm">{otpError}</p>
          </div>
        )}

        <button type="submit" disabled={otpLoading}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-lg">
          {otpLoading ? 'SMS Gönderiliyor...' : 'Başvuruyu Gönder'}
        </button>
      </form>
    </>
  )
}
