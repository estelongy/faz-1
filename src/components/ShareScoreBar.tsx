'use client'

import { useEffect, useState } from 'react'

interface ShareScoreBarProps {
  score: number
  color: string
}

export default function ShareScoreBar({ score, color }: ShareScoreBarProps) {
  const [displayed, setDisplayed] = useState(0)
  const [filled, setFilled]       = useState(0)

  useEffect(() => {
    // Kısa gecikme sonra animasyonu başlat
    const delay = setTimeout(() => {
      // Bar dolum animasyonu
      const barDuration = 1400
      const barStart = performance.now()
      const animateBar = (now: number) => {
        const t = Math.min((now - barStart) / barDuration, 1)
        const eased = 1 - Math.pow(1 - t, 3) // ease-out cubic
        setFilled(Math.round(eased * score))
        if (t < 1) requestAnimationFrame(animateBar)
      }
      requestAnimationFrame(animateBar)

      // Sayaç animasyonu
      const counterDuration = 1600
      const counterStart = performance.now()
      const animateCounter = (now: number) => {
        const t = Math.min((now - counterStart) / counterDuration, 1)
        const eased = 1 - Math.pow(1 - t, 3)
        setDisplayed(Math.round(eased * score))
        if (t < 1) requestAnimationFrame(animateCounter)
      }
      requestAnimationFrame(animateCounter)
    }, 300)

    return () => clearTimeout(delay)
  }, [score])

  return (
    <div className="w-full">
      {/* Skor sayacı */}
      <div className="flex items-end justify-center gap-1 mb-6">
        <span
          className="text-8xl font-black leading-none tabular-nums"
          style={{ color, textShadow: `0 0 40px ${color}60` }}
        >
          {displayed}
        </span>
        <span className="text-slate-400 text-2xl mb-2">/100</span>
      </div>

      {/* Bar */}
      <div className="relative w-full h-4 bg-slate-800 rounded-full overflow-hidden">
        {/* Arka plan izleri */}
        <div className="absolute inset-0 flex items-center">
          {[20, 40, 60, 80].map(mark => (
            <div
              key={mark}
              className="absolute w-px h-3 bg-slate-700"
              style={{ left: `${mark}%` }}
            />
          ))}
        </div>

        {/* Dolan bar */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-none"
          style={{
            width: `${filled}%`,
            background: `linear-gradient(90deg, #7c3aed, ${color})`,
            boxShadow: `0 0 12px ${color}80`,
            transition: 'width 0.05s linear',
          }}
        />

        {/* Shimmer efekti */}
        <div
          className="absolute top-0 left-0 h-full rounded-full overflow-hidden"
          style={{ width: `${filled}%` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.25) 50%, transparent 100%)',
              animation: 'shimmer 1.8s ease-in-out infinite',
              backgroundSize: '200% 100%',
            }}
          />
        </div>
      </div>

      {/* Yüzde göstergesi */}
      <div className="flex justify-between mt-2 text-xs text-slate-600">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
    </div>
  )
}
