'use client'

import ScoreBar from '@/components/ScoreBar'

export default function PreviewSkorPage() {
  return (
    <div className="min-h-screen bg-[#0a0f1a] py-10 px-4 flex flex-col gap-10 items-center">
      <h1 className="text-white text-xl font-bold tracking-widest">SCOREBAR PREVIEW</h1>

      <div className="w-full max-w-xs">
        <p className="text-slate-500 text-xs mb-2 text-center">Normal — 73</p>
        <ScoreBar score={73} phase="ai_analiz" animated={false} />
      </div>

      <div className="w-full max-w-xs">
        <p className="text-slate-500 text-xs mb-2 text-center">İyi — 85</p>
        <ScoreBar score={85} phase="longevity_anketi" animated={false} />
      </div>

      <div className="w-full max-w-xs">
        <p className="text-slate-500 text-xs mb-2 text-center">Klinik Onaylı — 91</p>
        <ScoreBar score={91} phase="klinik_onayli" animated={false} />
      </div>

      <div className="w-full max-w-xs">
        <p className="text-slate-500 text-xs mb-2 text-center">Düşük — 60</p>
        <ScoreBar score={60} phase="randevu" animated={false} />
      </div>
    </div>
  )
}
