'use client'

import { useState } from 'react'

interface Props {
  analysisId: string
  score: number
  firstName: string
  clinicName?: string
  trigger?: React.ReactNode
}

export default function PaylasModal({ analysisId, score, firstName, clinicName, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [instagramHint, setInstagramHint] = useState(false)

  const baseUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}`
    : 'https://estelongy-faz1.vercel.app'
  const shareUrl = `${baseUrl}/paylas/${analysisId}`
  const shareText = `Klinik onaylı Gençlik Skorum: ${score}/100 🌟 Seninki ne? Estelongy ile ücretsiz öğren:`

  async function handleNativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title: `Estelongy — ${firstName} ${score}/100`,
          text: shareText,
          url: shareUrl,
        })
      } catch {
        /* kullanıcı iptal etti */
      }
    } else {
      setOpen(true)
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  async function handleInstagram() {
    setDownloading(true)
    try {
      const imgUrl = `${baseUrl}/paylas/${analysisId}/opengraph-image`
      const res = await fetch(imgUrl)
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `estelongy-skor-${score}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setInstagramHint(true)
      setTimeout(() => setInstagramHint(false), 6000)
      // Mobilde Instagram uygulamasını da açmayı dene
      if (/iPhone|iPad|Android/i.test(navigator.userAgent)) {
        setTimeout(() => { window.location.href = 'instagram://story-camera' }, 500)
      }
    } catch {
      alert('Görsel indirilemedi. Link kopyalayıp Instagram\'dan paylaşabilirsin.')
    } finally {
      setDownloading(false)
    }
  }

  const encoded = encodeURIComponent(shareText + ' ' + shareUrl)
  const waUrl       = `https://wa.me/?text=${encoded}`
  const twitterUrl  = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
  const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`

  return (
    <>
      {/* Trigger */}
      <button onClick={handleNativeShare} className="contents">
        {trigger ?? (
          <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/20 cursor-pointer">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            Paylaş
          </span>
        )}
      </button>

      {/* Modal */}
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4"
          onClick={() => setOpen(false)}>
          <div
            className="w-full sm:max-w-md bg-slate-900 border border-slate-700 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-white font-black text-lg">Skorunu Paylaş</h3>
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Önizleme */}
            <div className="mb-6 p-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-center">
              <p className="text-slate-400 text-xs mb-1">Klinik Onaylı Gençlik Skoru</p>
              <p className="text-5xl font-black text-emerald-400 mb-1">{score}</p>
              <p className="text-slate-500 text-xs">{firstName}{clinicName ? ` · ${clinicName}` : ''}</p>
            </div>

            {/* Sosyal butonlar */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              <a href={waUrl} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366]/25 transition-colors">
                <svg className="w-6 h-6 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                <span className="text-[10px] text-slate-300">WhatsApp</span>
              </a>

              <button onClick={handleInstagram} disabled={downloading}
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-gradient-to-br from-[#833AB4]/20 via-[#FD1D1D]/20 to-[#FCB045]/20 hover:from-[#833AB4]/30 hover:via-[#FD1D1D]/30 hover:to-[#FCB045]/30 transition-colors disabled:opacity-50">
                <svg className="w-6 h-6" fill="url(#ig-grad)" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#833AB4"/>
                      <stop offset="50%" stopColor="#FD1D1D"/>
                      <stop offset="100%" stopColor="#FCB045"/>
                    </linearGradient>
                  </defs>
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                <span className="text-[10px] text-slate-300">{downloading ? '...' : 'Instagram'}</span>
              </button>

              <a href={twitterUrl} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-black/40 hover:bg-black/60 transition-colors">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                <span className="text-[10px] text-slate-300">X</span>
              </a>

              <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#1877F2]/15 hover:bg-[#1877F2]/25 transition-colors">
                <svg className="w-6 h-6 text-[#1877F2]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <span className="text-[10px] text-slate-300">Facebook</span>
              </a>

              <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
                className="flex flex-col items-center gap-1 p-2.5 rounded-xl bg-[#0088cc]/15 hover:bg-[#0088cc]/25 transition-colors">
                <svg className="w-6 h-6 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                <span className="text-[10px] text-slate-300">Telegram</span>
              </a>
            </div>

            {/* Instagram ipucu */}
            {instagramHint && (
              <div className="mb-3 p-3 rounded-xl bg-gradient-to-r from-[#833AB4]/15 via-[#FD1D1D]/15 to-[#FCB045]/15 border border-[#FD1D1D]/30">
                <p className="text-xs text-slate-200 font-medium mb-1">✓ Görsel indirildi</p>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Instagram uygulamasını aç → <strong>Hikaye</strong> veya <strong>Gönderi</strong> oluştur → indirilen görseli seç → <strong>estelongy.com/paylas/{analysisId.slice(0,8)}...</strong> linkini biyografine ekle
                </p>
              </div>
            )}

            {/* LinkedIn */}
            <a href={linkedinUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#0A66C2]/15 hover:bg-[#0A66C2]/25 rounded-xl transition-colors mb-3">
              <svg className="w-4 h-4 text-[#0A66C2]" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.063 2.063 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="text-sm text-slate-300">LinkedIn&apos;de Paylaş</span>
            </a>

            {/* Link kopyala */}
            <button onClick={handleCopy}
              className={`w-full flex items-center gap-2 p-3 rounded-xl transition-colors ${
                copied ? 'bg-emerald-500/20 border border-emerald-500/40' : 'bg-slate-800 hover:bg-slate-700 border border-slate-700'
              }`}>
              <svg className={`w-4 h-4 shrink-0 ${copied ? 'text-emerald-400' : 'text-slate-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {copied ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                )}
              </svg>
              <span className="flex-1 text-xs text-left font-mono truncate text-slate-400">
                {shareUrl}
              </span>
              <span className={`text-xs font-bold ${copied ? 'text-emerald-400' : 'text-violet-400'}`}>
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  )
}
