'use client'

import { useState } from 'react'
import { CLINIC_TYPES, TREATMENTS_BY_BRANCH } from '@/lib/randevu-filters'

interface Props {
  action: (formData: FormData) => Promise<void>
  hasError: boolean
}

export default function KlinikBasvurForm({ action, hasError }: Props) {
  const [clinicType, setClinicType] = useState('')
  const treatments = clinicType ? (TREATMENTS_BY_BRANCH[clinicType] ?? []) : []

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

      <form action={action} className="space-y-6">
        {/* Klinik Adı */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Klinik Adı <span className="text-red-400">*</span></label>
          <input type="text" name="name" required placeholder="Dr. Ahmet Yılmaz Dermatoloji Kliniği"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
        </div>

        {/* Konum */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Konum</label>
          <input type="text" name="location" placeholder="İstanbul, Kadıköy"
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
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
                <label
                  key={s}
                  className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-700 hover:border-slate-600 cursor-pointer transition-colors group"
                >
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

        <button type="submit"
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all text-lg">
          Başvuruyu Gönder
        </button>
      </form>
    </>
  )
}
