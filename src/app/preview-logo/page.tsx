'use client'
import LogoIcon from '@/components/LogoIcon'

export default function PreviewLogoPage() {
  return (
    <div className="min-h-screen bg-[#050c18] flex flex-col gap-12 items-center py-16 px-8">
      <h1 className="text-slate-500 text-xs tracking-widest uppercase">Logo Önizleme</h1>

      {/* Nav bar simülasyonu */}
      <div className="w-full max-w-2xl bg-slate-900/80 border border-white/5 rounded-xl px-6 py-4 flex items-center gap-2 backdrop-blur">
        <LogoIcon size={36} />
        <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
          Estelongy
        </span>
      </div>

      {/* Büyük tek ikon */}
      <div className="flex flex-col items-center gap-3">
        <LogoIcon size={120} />
        <span className="text-slate-600 text-xs">120px</span>
      </div>

      {/* Farklı boyutlar */}
      <div className="flex items-end gap-8">
        {[80, 60, 48, 36, 24, 16].map(s => (
          <div key={s} className="flex flex-col items-center gap-2">
            <LogoIcon size={s} />
            <span className="text-slate-600 text-[10px]">{s}px</span>
          </div>
        ))}
      </div>

      {/* Açık arka plan testi */}
      <div className="bg-white rounded-2xl p-8 flex items-center gap-4">
        <LogoIcon size={48} />
        <div>
          <div className="text-xl font-bold text-slate-900">Estelongy</div>
          <div className="text-xs text-purple-600 tracking-widest">AESTHETIC &amp; LONGEVITY</div>
        </div>
      </div>
    </div>
  )
}
