import type { Metadata } from 'next'
import ScoreBar from '@/components/ScoreBar'
import ScoreBarV2 from '@/components/ScoreBarV2'

export const metadata: Metadata = {
  title: 'ScoreBar Önizleme',
  robots: { index: false, follow: false },
}

const SCORES = [40, 60, 70, 75, 80, 85, 92]

export default function PreviewSkorBarPage() {
  return (
    <main className="min-h-screen bg-slate-950 py-10 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">ScoreBar Önizleme</h1>
          <p className="text-slate-400 text-sm">
            Sol: <span className="text-amber-400">Mevcut (lineer)</span> · Sağ: <span className="text-emerald-400">Yeni (80 = 12 hizası, non-lineer)</span>
          </p>
        </div>

        <div className="space-y-12">
          {SCORES.map(s => (
            <div key={s} className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <div className="text-center mb-4">
                <span className="text-xs text-slate-500 uppercase tracking-widest">Skor</span>
                <div className="text-3xl font-black text-white">{s}</div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-slate-950/40 rounded-xl p-4">
                  <p className="text-center text-amber-400 text-xs font-semibold mb-2 uppercase tracking-widest">Mevcut</p>
                  <ScoreBar score={s} phase="ai_analiz" animated={false} />
                </div>
                <div className="bg-slate-950/40 rounded-xl p-4">
                  <p className="text-center text-emerald-400 text-xs font-semibold mb-2 uppercase tracking-widest">Yeni</p>
                  <ScoreBarV2 score={s} phase="ai_analiz" animated={false} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-slate-900/50 border border-slate-800 rounded-2xl p-6 text-slate-400 text-sm space-y-2">
          <p className="text-white font-bold mb-2">Yeni mapping mantığı</p>
          <p>• Skor → Yay konumu non-lineer:</p>
          <ul className="ml-4 space-y-1 text-xs">
            <li>0–55 → 0–25% (kırmızı, sol bölge — kalın)</li>
            <li>56–65 → 25–38% (mor, ~8:45–10:00)</li>
            <li>66–79 → 38–56.25% (sarı, ~10:00–12:00)</li>
            <li>80 → <span className="text-emerald-400 font-bold">56.25% (12 HİZASI)</span></li>
            <li>80–89 → 56.25–75% (yeşil)</li>
            <li>90–100 → 75–100% (cyan, sağ bölge — kalın)</li>
          </ul>
          <p className="pt-2">{`• 80'i geçen kullanıcı görsel olarak tepenin sağına geçer → "hedefi geçtim" hissi.`}</p>
        </div>
      </div>
    </main>
  )
}
