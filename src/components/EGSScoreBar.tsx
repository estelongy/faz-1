'use client'

import { useEffect, useState, useRef } from 'react'

export type EGSPhase =
  | 'ai_analiz'
  | 'longevity_anketi'
  | 'randevu'
  | 'klinik_kabul'
  | 'klinik_anketi'
  | 'ileri_ai'
  | 'tetkik'
  | 'hekim_degerlendirme'
  | 'klinik_onayli'

interface EGSScoreBarProps {
  score: number
  previousScore?: number
  phase: EGSPhase
  age?: number
  isClinicView?: boolean
  animated?: boolean
}

const PHASES: { key: EGSPhase; label: string }[] = [
  { key: 'ai_analiz', label: 'AI Analiz' },
  { key: 'longevity_anketi', label: 'Anket' },
  { key: 'randevu', label: 'Randevu' },
  { key: 'klinik_kabul', label: 'Klinik Kabul' },
  { key: 'klinik_anketi', label: 'Klinik Anketi' },
  { key: 'ileri_ai', label: 'İleri AI' },
  { key: 'tetkik', label: 'Tetkik' },
  { key: 'hekim_degerlendirme', label: 'Hekim' },
  { key: 'klinik_onayli', label: 'Onaylı EGS' },
]

// SVG gauge hesaplamaları
const CX = 150
const CY = 158
const R = 118
const STROKE_W = 20

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function polar(cx: number, cy: number, r: number, angleDeg: number) {
  return {
    x: cx + r * Math.cos(toRad(angleDeg)),
    y: cy - r * Math.sin(toRad(angleDeg)),
  }
}

function arcPath(startDeg: number, endDeg: number, r: number = R) {
  const s = polar(CX, CY, r, startDeg)
  const e = polar(CX, CY, r, endDeg)
  const large = Math.abs(startDeg - endDeg) > 180 ? 1 : 0
  // sweepFlag=0 → saat yönünün tersine (azalan açı = sağa doğru)
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

// Score → gauge açısı (180°=sol/0puan → 0°=sağ/100puan)
function scoreToAngle(score: number) {
  return 180 - (Math.min(Math.max(score, 0), 100) / 100) * 180
}

// Renk bölgeleri: 180°→0° arasında
const COLOR_ZONES = [
  { from: 180, to: 180 - (49 / 100) * 180, color: '#ef4444', glow: '#ef444480', label: 'Kritik', range: '0–49' },
  { from: 180 - (49 / 100) * 180, to: 180 - (74 / 100) * 180, color: '#f59e0b', glow: '#f59e0b80', label: 'Gelişmeli', range: '50–74' },
  { from: 180 - (74 / 100) * 180, to: 180 - (89 / 100) * 180, color: '#22c55e', glow: '#22c55e80', label: 'İyi', range: '75–89' },
  { from: 180 - (89 / 100) * 180, to: 2, color: '#00d4ff', glow: '#00d4ff80', label: 'Mükemmel', range: '90–100' },
]

function getZone(score: number) {
  if (score >= 90) return COLOR_ZONES[3]
  if (score >= 75) return COLOR_ZONES[2]
  if (score >= 50) return COLOR_ZONES[1]
  return COLOR_ZONES[0]
}

function getAgeMessage(score: number, age?: number): string {
  if (!age) {
    if (score >= 90) return 'Olağanüstü gençlik skoru!'
    if (score >= 75) return 'Yaşınızdan genç görünüyorsunuz.'
    if (score >= 50) return 'Yaşınıza göre normal aralıkta.'
    return 'Uzman desteğiyle skorunuzu yükseltebilirsiniz.'
  }
  const diff = Math.round((score - 50) / 10)
  if (diff >= 7) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz! 🎉`
  if (diff >= 3) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz.`
  if (diff >= 1) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz.`
  return 'Yaşınıza tam uygun görünüyorsunuz.'
}

function getClinicMessage(score: number, previousScore?: number): string {
  if (previousScore !== undefined && previousScore !== score) {
    const diff = score - previousScore
    if (diff > 0) return `Hasta ${diff} puan kazandı — harika sonuç!`
    return `Skor ${Math.abs(diff)} puan düzeltildi.`
  }
  if (score >= 90) return 'İşlem gerektirmez — koruma protokolü öner.'
  if (score >= 75) return 'Hafif bakım programı yeterli.'
  if (score >= 50) return 'Tedavi planı için uygun profil.'
  return 'Kapsamlı tedavi protokolü gerekiyor.'
}

// Tick işaretleri
const MAJOR_TICKS = [0, 50, 75, 90, 100]
const MINOR_TICKS = Array.from({ length: 21 }, (_, i) => i * 5)

export default function EGSScoreBar({
  score,
  previousScore,
  phase,
  age,
  isClinicView = false,
  animated = true,
}: EGSScoreBarProps) {
  const [displayScore, setDisplayScore] = useState(animated ? 0 : score)
  const [needleAngle, setNeedleAngle] = useState(animated ? 180 : scoreToAngle(score))
  const [showDelta, setShowDelta] = useState(false)
  const animRef = useRef<number | null>(null)

  useEffect(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current)

    const startScore = animated ? 0 : score
    const endScore = score
    const duration = animated ? 1400 : 0
    const startTime = performance.now()

    if (!animated) {
      setDisplayScore(score)
      setNeedleAngle(scoreToAngle(score))
      return
    }

    const tick = (now: number) => {
      const elapsed = now - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      const current = startScore + (endScore - startScore) * eased
      setDisplayScore(Math.round(current))
      setNeedleAngle(scoreToAngle(current))
      if (progress < 1) {
        animRef.current = requestAnimationFrame(tick)
      } else {
        if (previousScore !== undefined && previousScore !== score) {
          setShowDelta(true)
          setTimeout(() => setShowDelta(false), 3000)
        }
      }
    }
    animRef.current = requestAnimationFrame(tick)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [score, animated, previousScore])

  const zone = getZone(displayScore)
  const phaseIndex = PHASES.findIndex(p => p.key === phase)
  const delta = previousScore !== undefined ? score - previousScore : null
  const isLastPhase = phase === 'klinik_onayli'

  // Needle ucu ve kuyruğu
  const needleTip = polar(CX, CY, R - 14, needleAngle)
  const needleLeft = polar(CX, CY, 14, needleAngle + 90)
  const needleRight = polar(CX, CY, 14, needleAngle - 90)
  const needleTail = polar(CX, CY, 22, needleAngle + 180)

  return (
    <div className="w-full select-none">
      {/* Başlık */}
      <div className="text-center mb-3">
        <p className="text-[11px] font-black tracking-[0.25em] uppercase"
          style={{ color: zone.color, textShadow: `0 0 20px ${zone.glow}` }}>
          {isLastPhase ? '✦ KLİNİK ONAYLI ✦' : 'ESTELONGY'}
        </p>
        <p className="text-[10px] font-semibold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
          Gençlik Skoru
        </p>
      </div>

      {/* SVG Göstergesi */}
      <div className="relative flex justify-center">
        <svg
          viewBox="0 0 300 185"
          className="w-full max-w-xs"
          style={{ filter: `drop-shadow(0 0 18px ${zone.glow})` }}
        >
          {/* Arka plan yayı (koyu gri) */}
          <path
            d={arcPath(180, 2)}
            fill="none"
            stroke="#1e293b"
            strokeWidth={STROKE_W + 4}
            strokeLinecap="round"
          />

          {/* Renk bölgeleri */}
          {COLOR_ZONES.map((z, i) => (
            <path
              key={i}
              d={arcPath(z.from, z.to)}
              fill="none"
              stroke={z.color}
              strokeWidth={STROKE_W}
              strokeLinecap={i === 0 ? 'round' : i === COLOR_ZONES.length - 1 ? 'round' : 'butt'}
              opacity={0.85}
            />
          ))}

          {/* Aktif parlama: skora kadar olan bölge */}
          {displayScore > 0 && (
            <path
              d={arcPath(180, scoreToAngle(displayScore))}
              fill="none"
              stroke={zone.color}
              strokeWidth={STROKE_W - 6}
              strokeLinecap="round"
              opacity={0.6}
              style={{ filter: `blur(3px)` }}
            />
          )}

          {/* Büyük tick işaretleri */}
          {MAJOR_TICKS.map(tick => {
            const angle = scoreToAngle(tick)
            const inner = polar(CX, CY, R - STROKE_W / 2 - 12, angle)
            const outer = polar(CX, CY, R + STROKE_W / 2 + 4, angle)
            const label = polar(CX, CY, R + STROKE_W / 2 + 16, angle)
            return (
              <g key={tick}>
                <line
                  x1={inner.x} y1={inner.y}
                  x2={outer.x} y2={outer.y}
                  stroke="#94a3b8" strokeWidth={2} strokeLinecap="round"
                />
                <text
                  x={label.x} y={label.y}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#64748b" fontSize="10" fontWeight="600"
                >
                  {tick}
                </text>
              </g>
            )
          })}

          {/* Küçük tick işaretleri */}
          {MINOR_TICKS.filter(t => !MAJOR_TICKS.includes(t)).map(tick => {
            const angle = scoreToAngle(tick)
            const inner = polar(CX, CY, R - STROKE_W / 2 - 5, angle)
            const outer = polar(CX, CY, R - STROKE_W / 2 - 1, angle)
            return (
              <line
                key={tick}
                x1={inner.x} y1={inner.y}
                x2={outer.x} y2={outer.y}
                stroke="#334155" strokeWidth={1.5} strokeLinecap="round"
              />
            )
          })}

          {/* İbre gölgesi */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleLeft.x},${needleLeft.y} ${needleTail.x},${needleTail.y} ${needleRight.x},${needleRight.y}`}
            fill="#000"
            opacity={0.3}
            transform="translate(2,3)"
          />

          {/* İbre */}
          <polygon
            points={`${needleTip.x},${needleTip.y} ${needleLeft.x},${needleLeft.y} ${needleTail.x},${needleTail.y} ${needleRight.x},${needleRight.y}`}
            fill="url(#needleGrad)"
          />

          {/* İbre merkez dairesi — dış */}
          <circle cx={CX} cy={CY} r={16} fill="#0f172a" stroke="#334155" strokeWidth={2} />
          {/* İbre merkez dairesi — iç parlak */}
          <circle cx={CX} cy={CY} r={9} fill={zone.color} opacity={0.9}
            style={{ filter: `drop-shadow(0 0 6px ${zone.color})` }} />
          <circle cx={CX} cy={CY} r={4} fill="#fff" opacity={0.6} />

          {/* Gradyanlar */}
          <defs>
            <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#f8fafc" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>

          {/* Merkez skor */}
          <text
            x={CX} y={CY - 38}
            textAnchor="middle"
            fill={zone.color}
            fontSize="48"
            fontWeight="900"
            fontFamily="system-ui"
            style={{ filter: `drop-shadow(0 0 12px ${zone.glow})` }}
          >
            {displayScore}
          </text>

          {/* /100 */}
          <text x={CX} y={CY - 20} textAnchor="middle" fill="#475569" fontSize="11" fontWeight="500">
            / 100
          </text>

          {/* Zone etiketi */}
          <text
            x={CX} y={CY + 8}
            textAnchor="middle"
            fill={zone.color}
            fontSize="12"
            fontWeight="700"
            letterSpacing="2"
            opacity={0.9}
          >
            {zone.label.toUpperCase()}
          </text>
        </svg>

        {/* Delta badge */}
        {showDelta && delta !== null && delta !== 0 && (
          <div className={`absolute top-2 right-2 text-lg font-black px-3 py-1 rounded-full animate-bounce
            ${delta > 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}>
            {delta > 0 ? `+${delta}` : delta}
          </div>
        )}
      </div>

      {/* Mesaj */}
      <div className="mt-1 mx-auto max-w-xs px-4 py-2.5 rounded-xl border text-center"
        style={{ borderColor: `${zone.color}40`, background: `${zone.color}0d` }}>
        <p className="text-sm font-medium" style={{ color: zone.color }}>
          {isClinicView
            ? getClinicMessage(score, previousScore)
            : getAgeMessage(score, age)}
        </p>
        {isLastPhase && (
          <p className="text-xs text-slate-500 mt-0.5">Hekim tarafından doğrulandı ✓</p>
        )}
      </div>

      {/* Aşama yolculuğu */}
      <div className="mt-4 px-1">
        <div className="flex items-center">
          {PHASES.map((p, i) => {
            const isDone = i < phaseIndex
            const isCurrent = i === phaseIndex
            const isLast = i === PHASES.length - 1
            return (
              <div key={p.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500 ${
                      isDone ? 'bg-emerald-500' : isCurrent ? '' : 'bg-slate-800 border border-slate-700'
                    }`}
                    style={isCurrent ? {
                      background: zone.color,
                      boxShadow: `0 0 10px ${zone.glow}`
                    } : undefined}
                  >
                    {isDone ? (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <div className={`w-1.5 h-1.5 rounded-full ${isCurrent ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
                    )}
                  </div>
                  <span className={`text-[8px] font-medium text-center leading-tight max-w-[36px] truncate ${
                    isDone ? 'text-emerald-400' : isCurrent ? '' : 'text-slate-700'
                  }`}
                    style={isCurrent ? { color: zone.color } : undefined}
                  >
                    {p.label}
                  </span>
                </div>
                {!isLast && (
                  <div className={`h-px flex-1 mx-0.5 mb-3 ${isDone ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
