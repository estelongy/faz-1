'use client'

import { useState } from 'react'

interface Props {
  appointmentId: string
  clinicName: string
  appointmentDate: string | null
}

/**
 * Randevu QR modalı — hasta klinikte check-in için gösterir.
 * QR kod api.qrserver.com üzerinden üretilir (zero dependency).
 * Kodun içeriği randevu URL'idir; klinik okutunca detaya yönlenir.
 */
export default function RandevuQRModal({ appointmentId, clinicName, appointmentDate }: Props) {
  const [open, setOpen] = useState(false)

  // QR içeriği: klinik paneli randevu URL'i → okutunca detaya gider
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://estelongy-clean.vercel.app'
  const qrData = `${origin}/klinik/panel/randevu/${appointmentId}`
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(qrData)}`

  const shortId = appointmentId.slice(0, 8).toUpperCase()

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-violet-400 hover:bg-slate-700 transition-colors"
        title="Randevu QR kodu"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl"
          >
            {/* Başlık */}
            <div className="text-center mb-4">
              <p className="text-slate-500 text-xs uppercase tracking-wider font-bold">Klinik Check-in</p>
              <h2 className="text-slate-900 text-xl font-black mt-1">{clinicName}</h2>
              {appointmentDate && (
                <p className="text-slate-600 text-sm mt-1">
                  {new Date(appointmentDate).toLocaleDateString('tr-TR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>

            {/* QR */}
            <div className="bg-white rounded-2xl p-2 flex justify-center mb-4 border-2 border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrSrc} alt="Randevu QR kodu" width={320} height={320} className="w-full max-w-[280px]" />
            </div>

            {/* Kod bilgisi */}
            <div className="text-center mb-4">
              <p className="text-slate-500 text-xs">Randevu Kodu</p>
              <p className="text-slate-900 font-mono font-bold text-lg tracking-widest">{shortId}</p>
            </div>

            {/* Talimat */}
            <div className="bg-violet-50 rounded-xl p-3 mb-4 text-center">
              <p className="text-violet-900 text-xs">
                Kliniğe vardığında bu QR'ı resepsiyona göster.<br/>
                Klinik telefonuyla okutup seni sisteme kaydedecek.
              </p>
            </div>

            {/* Kapat */}
            <button
              onClick={() => setOpen(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-colors"
            >
              Kapat
            </button>
          </div>
        </div>
      )}
    </>
  )
}
