'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  clinicName: string
  clinicId: string
  jetonBalance: number
}

export default function KlinikWelcome({ clinicName, clinicId, jetonBalance }: Props) {
  const [copied, setCopied] = useState(false)

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://estelongy-faz1.vercel.app'
  const shareUrl = `${baseUrl}/randevu?k=${clinicId}`

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch { /* ignore */ }
  }

  return (
    <div className="space-y-6">
      {/* Hero karşılama */}
      <div className="relative overflow-hidden p-8 rounded-3xl bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-emerald-500/10 border border-violet-500/20">
        <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            KLİNİK ONAYLI
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white mb-3">
            Hoş geldiniz, <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">{clinicName}</span>
          </h2>
          <p className="text-slate-300 text-base max-w-xl">
            Kliniğiniz onaylandı. İlk hastanızı kabul etmek için hazırsınız — hesabınıza
            <strong className="text-emerald-400"> {jetonBalance} hediye jeton</strong> yüklendi.
          </p>
        </div>
      </div>

      {/* 3 Adım Rehberi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        {/* Adım 1 — Tamamlandı */}
        <div className="relative p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
            <span className="text-emerald-400 font-black text-lg">1</span>
          </div>
          <h3 className="text-white font-bold mb-1">Klinik Onaylandı</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Hesabınız aktif. {jetonBalance} başlangıç jetonu hediye olarak yüklendi.
            Her hasta kabulünde 1 jeton düşer — no-show durumunda jeton yanmaz.
          </p>
        </div>

        {/* Adım 2 — Paylaşım linki */}
        <div className="relative p-6 rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-violet-500/40 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center mb-3">
            <span className="text-violet-400 font-black text-lg">2</span>
          </div>
          <h3 className="text-white font-bold mb-1">Paylaşım Linkinizi Alın</h3>
          <p className="text-slate-400 text-xs leading-relaxed mb-4">
            Kliniğinize özel link. Web sitenize, sosyal medyanıza ve WhatsApp durumunuza
            ekleyin — hastalar direkt size yönlensin.
          </p>
          <button onClick={handleCopy}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              copied ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400' : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-violet-500/40'
            }`}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {copied ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              )}
            </svg>
            <span className="truncate font-mono text-[11px]">{shareUrl.replace('https://', '')}</span>
            <span className="ml-auto font-bold shrink-0">{copied ? 'Kopyalandı' : 'Kopyala'}</span>
          </button>
        </div>

        {/* Adım 3 — İlk randevuyu bekle */}
        <div className="relative p-6 rounded-2xl bg-slate-800/60 border border-slate-700">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
            <span className="text-amber-400 font-black text-lg">3</span>
          </div>
          <h3 className="text-white font-bold mb-1">İlk Randevunuzu Bekleyin</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Hasta randevu talebi gönderdiğinde burada anlık olarak görünür.
            Kabul ettiğinizde 5 adımlık klinik akışıyla Klinik Onaylı EGS sertifikası üretirsiniz.
          </p>
          <div className="mt-4 flex items-center gap-2 text-amber-400/70 text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            Randevu bekleniyor...
          </div>
        </div>
      </div>

      {/* Hızlı Aksiyonlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/klinik/panel/jeton"
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-bold">Jeton Yönetimi</div>
            <div className="text-slate-500 text-xs truncate">Paket satın al, işlem geçmişi</div>
          </div>
          <svg className="w-4 h-4 text-slate-500 group-hover:text-white ml-auto shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/hakkinda/sss"
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-bold">Nasıl Çalışır?</div>
            <div className="text-slate-500 text-xs truncate">SSS & klinik rehberi</div>
          </div>
          <svg className="w-4 h-4 text-slate-500 group-hover:text-white ml-auto shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>

        <Link href="/hakkinda/iletisim"
          className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 transition-colors group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-white text-sm font-bold">Destek</div>
            <div className="text-slate-500 text-xs truncate">klinik@estelongy.com</div>
          </div>
          <svg className="w-4 h-4 text-slate-500 group-hover:text-white ml-auto shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>

      {/* İpuçları şeridi */}
      <div className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-violet-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <div className="text-xs text-slate-400 leading-relaxed">
            <strong className="text-white">İpucu:</strong> Nihai skor kararı hekimdedir.
            Ön analiz ve anket sadece yol göstericidir. Klinik Onaylı EGS formülü:
            <span className="font-mono text-violet-300 ml-1">(Ön + Anket) × 0.85 + Hekim × 0.15</span>
          </div>
        </div>
      </div>
    </div>
  )
}
