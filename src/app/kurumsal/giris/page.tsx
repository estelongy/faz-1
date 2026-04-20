'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { pathForRole } from '@/lib/auth-redirect'

type AccountType = 'klinik' | 'satici' | null

export default function KurumsalGirisPage() {
  const router = useRouter()
  const [accountType, setAccountType] = useState<AccountType>(null)
  const [mode, setMode] = useState<'giris' | 'kayit'>('giris')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailSent, setEmailSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()

    if (mode === 'giris') {
      const { data: loginData, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) {
        setError('E-posta veya şifre hatalı.')
        setLoading(false)
        return
      }
      const role = (loginData.user?.app_metadata as Record<string, string>)?.role

      // Rol atanmışsa direkt ilgili panele git
      if (role === 'admin' || role === 'clinic' || role === 'vendor') {
        router.push(pathForRole(role))
        router.refresh()
        return
      }

      // Rol yok (user) → seçilen hesap tipine göre başvuru akışı
      if (accountType === 'klinik') {
        router.push('/klinik/basvur')
      } else if (accountType === 'satici') {
        router.push('/satici/basvur')
      } else {
        router.push('/panel')
      }
      router.refresh()
    } else {
      if (password.length < 6) { setError('Şifre en az 6 karakter olmalıdır.'); setLoading(false); return }
      const { data, error: err } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: `${location.origin}/auth/callback` },
      })
      if (err) { setError(err.message); setLoading(false); return }
      if (data.user && !data.session) {
        // E-posta doğrulanmadı — doğrulama mesajı göster, başvuruya yönlendirme
        setEmailSent(true)
        setLoading(false)
        return
      }
      router.push(accountType === 'klinik' ? '/klinik/basvur' : '/satici/basvur')
      router.refresh()
    }
  }

  async function handleGoogle() {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback?next=${accountType === 'klinik' ? '/klinik/basvur' : '/satici/basvur'}` },
    })
  }

  if (emailSent) return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700 text-center">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">E-postanızı doğrulayın</h2>
          <p className="text-slate-400 mb-2"><span className="text-violet-400 font-medium">{email}</span> adresine doğrulama bağlantısı gönderdik.</p>
          <p className="text-slate-500 text-sm mb-6">E-postanızı doğruladıktan sonra giriş yaparak başvurunuza devam edebilirsiniz.</p>
          <button onClick={() => { setEmailSent(false); setMode('giris') }}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
            Giriş Yap
          </button>
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/giris" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Normal girişe dön
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Kurumsal Giriş</h1>
          <p className="text-slate-400 text-sm mt-1">Klinik veya satıcı hesabınızla devam edin</p>
        </div>

        {/* Hesap tipi seçimi */}
        {!accountType ? (
          <div className="space-y-4">
            <button onClick={() => setAccountType('klinik')}
              className="w-full p-5 rounded-2xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">Klinik</div>
                  <div className="text-slate-400 text-sm">Dermatoloji, estetik veya sağlık kliniği</div>
                </div>
                <svg className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            <button onClick={() => setAccountType('satici')}
              className="w-full p-5 rounded-2xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all text-left group">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="text-white font-bold text-lg">Satıcı</div>
                  <div className="text-slate-400 text-sm">Cilt bakım ürünleri ve kozmetik markası</div>
                </div>
                <svg className="w-5 h-5 text-slate-500 group-hover:text-amber-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        ) : (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700">
            {/* Seçili hesap tipi göstergesi */}
            <div className={`flex items-center gap-3 p-3 rounded-xl mb-6 ${
              accountType === 'klinik' ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-amber-500/10 border border-amber-500/20'
            }`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 ${
                accountType === 'klinik' ? 'bg-gradient-to-br from-blue-500 to-cyan-600' : 'bg-gradient-to-br from-amber-500 to-orange-500'
              }`}>
                {accountType === 'klinik' ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                )}
              </div>
              <span className={`font-medium text-sm ${accountType === 'klinik' ? 'text-blue-300' : 'text-amber-300'}`}>
                {accountType === 'klinik' ? 'Klinik Hesabı' : 'Satıcı Hesabı'}
              </span>
              <button onClick={() => setAccountType(null)} className="ml-auto text-slate-500 hover:text-white transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Giriş / Kayıt toggle */}
            <div className="flex rounded-xl bg-slate-900 p-1 mb-6">
              <button onClick={() => setMode('giris')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'giris' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                Giriş Yap
              </button>
              <button onClick={() => setMode('kayit')}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'kayit' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}>
                Kayıt Ol
              </button>
            </div>

            {/* Google */}
            <button onClick={handleGoogle}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 border border-slate-600 rounded-xl text-white text-sm font-medium transition-colors mb-4">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google ile devam et
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-xs">veya e-posta ile</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === 'kayit' && (
                <input type="text" required value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="Ad Soyad"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
              )}
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="E-posta"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Şifre"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors text-sm" />
              {error && <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">{error}</div>}
              <button type="submit" disabled={loading}
                className={`w-full py-3 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-sm ${
                  accountType === 'klinik'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400'
                }`}>
                {loading ? 'Yükleniyor...' : mode === 'giris' ? 'Giriş Yap' : 'Devam Et'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  )
}
