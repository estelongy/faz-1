'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CLINIC_TYPES, TREATMENTS_BY_BRANCH, LOCATIONS } from '@/lib/randevu-filters'

interface Props {
  action: (formData: FormData) => Promise<void>
  hasError: boolean
  isLoggedIn: boolean
}

// Türkçe karakter duyarlı normalize (İ→i, ı→i gibi sorunları çözer)
function trNorm(s: string) {
  return s.replace(/İ/g, 'i').replace(/I/g, 'i').replace(/ı/g, 'i').toLowerCase()
}

// Türkiye telefon numarasını E.164 formatına çevir
function toE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('90')) return '+' + digits
  if (digits.startsWith('0')) return '+9' + digits
  return '+90' + digits
}

export default function KlinikBasvurForm({ action, hasError, isLoggedIn }: Props) {
  const [clinicType, setClinicType] = useState('')
  const treatments = clinicType ? (TREATMENTS_BY_BRANCH[clinicType] ?? []) : []

  // OTP state
  const [otpStep, setOtpStep]         = useState(false)
  const [otpPhone, setOtpPhone]       = useState('')
  const [otpVerified, setOtpVerified] = useState(false)
  const otpVerifiedRef                = useRef(false)   // sync ref — state async olduğu için
  const [otpCode, setOtpCode]         = useState('')
  const [otpLoading, setOtpLoading]   = useState(false)
  const [otpError, setOtpError]       = useState('')
  const [otpResend, setOtpResend]     = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Konum autocomplete
  const [locQuery, setLocQuery] = useState('')
  const [locValue, setLocValue] = useState('')
  const [locOpen, setLocOpen]   = useState(false)
  const locRef = useRef<HTMLDivElement>(null)
  const locSuggestions = locQuery.trim().length >= 1
    ? LOCATIONS.filter(l => trNorm(l).includes(trNorm(locQuery))).slice(0, 10)
    : []
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (locRef.current && !locRef.current.contains(e.target as Node)) setLocOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Form submit → OTP gönder
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (otpVerifiedRef.current) {
      // Doğrulama tamam, server action'a gönder
      const formData = new FormData(formRef.current!)
      await action(formData)
      return
    }
    const phoneInput = (formRef.current?.elements.namedItem('phone') as HTMLInputElement)?.value
    if (!phoneInput) return

    const e164 = toE164(phoneInput)
    setOtpPhone(e164)
    setOtpLoading(true)
    setOtpError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({ phone: e164 })
    setOtpLoading(false)

    if (error) {
      setOtpError('SMS gönderilemedi: ' + error.message)
      return
    }
    setOtpStep(true)
    setOtpResend(false)
  }

  // OTP doğrula
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
    // Gerçek submit — ref üzerinden kontrol edilecek
    const formData = new FormData(formRef.current!)
    await action(formData)
  }

  // Tekrar gönder
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

      {/* OTP Ekranı — overlay */}
      {otpStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-slate-800 rounded-2xl border border-slate-700 p-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors mb-3"
              autoFocus
            />

            {otpError && (
              <p className="text-red-400 text-sm mb-3">{otpError}</p>
            )}
            {otpResend && (
              <p className="text-emerald-400 text-sm mb-3">Kod tekrar gönderildi.</p>
            )}

            <button
              type="button"
              onClick={handleVerify}
              disabled={otpCode.length !== 6 || otpLoading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all mb-3"
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
        {/* Hesap Bilgileri — sadece giriş yapılmamışsa */}
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

        {/* Klinik Adı */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Klinik Adı <span className="text-red-400">*</span></label>
          <input type="text" name="name" required placeholder="Dr. Ahmet Yılmaz Dermatoloji Kliniği"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
        </div>

        {/* Telefon */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Telefon <span className="text-red-400">*</span>
            {otpVerified && (
              <span className="ml-2 text-emerald-400 text-xs font-normal">✓ Doğrulandı</span>
            )}
          </label>
          <input type="tel" name="phone" required placeholder="05XX XXX XX XX"
            disabled={otpVerified}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-60" />
        </div>

        {/* Konum */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Konum</label>
          <input type="hidden" name="location" value={locValue} />
          <div ref={locRef} className="relative">
            {locValue ? (
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-violet-500/40 rounded-xl">
                <svg className="w-4 h-4 text-violet-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-white text-sm flex-1">{locValue}</span>
                <button type="button" onClick={() => { setLocValue(''); setLocQuery('') }}
                  className="text-slate-500 hover:text-white transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl focus-within:border-violet-500/60 transition-colors">
                <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  value={locQuery}
                  onChange={e => { setLocQuery(e.target.value); setLocOpen(true) }}
                  onFocus={() => { if (locQuery.trim().length >= 1) setLocOpen(true) }}
                  placeholder="İstanbul, Kadıköy"
                  className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none"
                />
                {locQuery && (
                  <button type="button" onClick={() => { setLocQuery(''); setLocOpen(false) }}
                    className="text-slate-500 hover:text-white transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            )}
            {locOpen && locSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                {locSuggestions.map(s => (
                  <button key={s} type="button"
                    onMouseDown={() => { setLocValue(s); setLocQuery(''); setLocOpen(false) }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700/50 last:border-0">
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Klinik Tipi */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">
            Klinik Tipi <span className="text-red-400">*</span>
          </label>
          <select
            name="clinic_type"
            required
            value={clinicType}
            onChange={e => setClinicType(e.target.value)}
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-violet-500 transition-colors appearance-none cursor-pointer"
          >
            <option value="" disabled>Branşınızı seçin...</option>
            {CLINIC_TYPES.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Klinik Hakkında */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Klinik Hakkında</label>
          <textarea name="bio" rows={4} placeholder="Kliniğiniz hakkında kısa bir tanıtım yazısı..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
        </div>

        {/* Tedavi / Hizmetler */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Hizmetleriniz
            {clinicType && <span className="ml-2 text-xs text-slate-500">— {treatments.length} seçenek</span>}
          </label>
          {!clinicType ? (
            <div className="p-4 rounded-xl border border-slate-700/50 border-dashed text-center text-slate-500 text-sm">
              Önce Klinik Tipi seçin
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {treatments.map(s => (
                <label key={s} className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors group">
                  <input type="checkbox" name="specialties" value={s} className="accent-violet-500 w-4 h-4 shrink-0" />
                  <span className="text-slate-400 group-hover:text-white text-sm transition-colors leading-snug">{s}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-amber-300 text-sm">
            <strong>Not:</strong> Başvurunuz onaylandıktan sonra klinik panelinize erişebilir ve randevu almaya başlayabilirsiniz.
          </p>
        </div>

        <button type="submit" disabled={otpLoading}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-lg">
          {otpLoading ? 'SMS Gönderiliyor...' : 'Başvuruyu Gönder'}
        </button>
      </form>
    </>
  )
}
