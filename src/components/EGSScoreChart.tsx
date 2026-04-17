'use client'

import { useState } from 'react'

export interface ScorePoint {
  date: string          // ISO string
  score: number
  type: 'ai_analiz' | 'klinik_onayli'
}

interface EGSScoreChartProps {
  points: ScorePoint[]
}

// ── Sabitler ────────────────────────────────────────────────────
const W   = 580
const H   = 200
const PAD = { top: 20, right: 24, bottom: 44, left: 40 }
const CW  = W - PAD.left - PAD.right   // 516
const CH  = H - PAD.top  - PAD.bottom  // 136

const AI_COLOR     = '#a855f7'   // mor  — ön analiz
const CLINIC_COLOR = '#00d4ff'   // neon mavi — klinik onaylı

const ZONE_BANDS = [
  { min: 0,  max: 50,  fill: '#ef444414' },
  { min: 50, max: 75,  fill: '#f59e0b14' },
  { min: 75, max: 90,  fill: '#22c55e14' },
  { min: 90, max: 100, fill: '#00d4ff14' },
]

const Y_TICKS = [0, 25, 50, 75, 100]

// ── Yardımcılar ──────────────────────────────────────────────────
function sy(score: number) {
  return PAD.top + CH - (Math.min(Math.max(score, 0), 100) / 100) * CH
}

function sx(idx: number, total: number) {
  if (total <= 1) return PAD.left + CW / 2
  return PAD.left + (idx / (total - 1)) * CW
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function buildPolyline(pts: { x: number; y: number }[]) {
  return pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
}

// ── Bileşen ──────────────────────────────────────────────────────
export default function EGSScoreChart({ points }: EGSScoreChartProps) {
  const [tooltip, setTooltip] = useState<{
    x: number; y: number; score: number; date: string; type: ScorePoint['type']
  } | null>(null)

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        Grafik için analiz verisi yok
      </div>
    )
  }

  // Sırala (tarih artan)
  const sorted = [...points].sort((a, b) => a.date.localeCompare(b.date))

  // İki seriye ayır
  const aiPts     = sorted.filter(p => p.type === 'ai_analiz')
  const clinicPts = sorted.filter(p => p.type === 'klinik_onayli')

  // X konumları — tüm noktalar aynı zaman ekseninde olsun
  const allDates = Array.from(new Set(sorted.map(p => p.date))).sort()
  const dateToX  = new Map(allDates.map((d, i) => [d, sx(i, allDates.length)]))

  const toXY = (p: ScorePoint) => ({ x: dateToX.get(p.date)!, y: sy(p.score) })

  const aiXY     = aiPts.map(toXY)
  const clinicXY = clinicPts.map(toXY)

  // X eksen etiketleri — çok kalabalık olmasın
  const xLabels = allDates.length <= 8
    ? allDates
    : allDates.filter((_, i) => i % Math.ceil(allDates.length / 8) === 0 || i === allDates.length - 1)

  return (
    <div className="relative select-none">
      {/* Legend */}
      <div className="flex items-center gap-5 mb-3 px-1">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 rounded-full" style={{ background: AI_COLOR }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: AI_COLOR }} />
          <span className="text-[11px] text-slate-400">Ön Analiz</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-0.5 rounded-full" style={{ background: CLINIC_COLOR }} />
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: CLINIC_COLOR }} />
          <span className="text-[11px] text-slate-400">Klinik Onaylı</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          {/* AI gradient */}
          <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={AI_COLOR} stopOpacity="0.25" />
            <stop offset="100%" stopColor={AI_COLOR} stopOpacity="0" />
          </linearGradient>
          {/* Clinic gradient */}
          <linearGradient id="clGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CLINIC_COLOR} stopOpacity="0.22" />
            <stop offset="100%" stopColor={CLINIC_COLOR} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* 1. Zon bantları */}
        {ZONE_BANDS.map(z => (
          <rect
            key={z.min}
            x={PAD.left} width={CW}
            y={sy(z.max)} height={sy(z.min) - sy(z.max)}
            fill={z.fill}
          />
        ))}

        {/* 2. Yatay grid çizgileri */}
        {Y_TICKS.map(t => (
          <line
            key={t}
            x1={PAD.left} x2={PAD.left + CW}
            y1={sy(t)} y2={sy(t)}
            stroke="#1e293b" strokeWidth={t === 0 ? 1 : 0.8}
            strokeDasharray={t === 0 ? undefined : '4 4'}
          />
        ))}

        {/* 3. Y ekseni etiketleri */}
        {Y_TICKS.map(t => (
          <text
            key={t}
            x={PAD.left - 8} y={sy(t)}
            textAnchor="end" dominantBaseline="middle"
            fill="#475569" fontSize="10">
            {t}
          </text>
        ))}

        {/* 4. X ekseni etiketleri */}
        {xLabels.map(d => (
          <text
            key={d}
            x={dateToX.get(d)!} y={PAD.top + CH + 18}
            textAnchor="middle"
            fill="#475569" fontSize="10">
            {fmtDate(d)}
          </text>
        ))}

        {/* 5a. AI doldurma alanı */}
        {aiXY.length >= 2 && (
          <polygon
            points={[
              ...aiXY.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
              `${aiXY[aiXY.length - 1].x.toFixed(1)},${(PAD.top + CH).toFixed(1)}`,
              `${aiXY[0].x.toFixed(1)},${(PAD.top + CH).toFixed(1)}`,
            ].join(' ')}
            fill="url(#aiGrad)"
          />
        )}

        {/* 5b. Klinik doldurma alanı */}
        {clinicXY.length >= 2 && (
          <polygon
            points={[
              ...clinicXY.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`),
              `${clinicXY[clinicXY.length - 1].x.toFixed(1)},${(PAD.top + CH).toFixed(1)}`,
              `${clinicXY[0].x.toFixed(1)},${(PAD.top + CH).toFixed(1)}`,
            ].join(' ')}
            fill="url(#clGrad)"
          />
        )}

        {/* 6a. AI çizgisi */}
        {aiXY.length >= 2 && (
          <polyline
            points={buildPolyline(aiXY)}
            fill="none"
            stroke={AI_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${AI_COLOR}80)` }}
          />
        )}

        {/* 6b. Klinik çizgisi */}
        {clinicXY.length >= 2 && (
          <polyline
            points={buildPolyline(clinicXY)}
            fill="none"
            stroke={CLINIC_COLOR}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${CLINIC_COLOR}80)` }}
          />
        )}

        {/* 7a. AI noktaları */}
        {aiXY.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={8} fill="transparent"
              onMouseEnter={() => setTooltip({
                x: p.x, y: p.y,
                score: aiPts[i].score,
                date: aiPts[i].date,
                type: 'ai_analiz',
              })} />
            <circle cx={p.x} cy={p.y} r={4} fill="#0f172a" stroke={AI_COLOR} strokeWidth={2}
              style={{ filter: `drop-shadow(0 0 4px ${AI_COLOR})` }} />
          </g>
        ))}

        {/* 7b. Klinik noktaları */}
        {clinicXY.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={8} fill="transparent"
              onMouseEnter={() => setTooltip({
                x: p.x, y: p.y,
                score: clinicPts[i].score,
                date: clinicPts[i].date,
                type: 'klinik_onayli',
              })} />
            <circle cx={p.x} cy={p.y} r={4} fill="#0f172a" stroke={CLINIC_COLOR} strokeWidth={2.5}
              style={{ filter: `drop-shadow(0 0 5px ${CLINIC_COLOR})` }} />
          </g>
        ))}

        {/* 8. Tooltip */}
        {tooltip && (() => {
          const bw  = 96, bh = 42
          const tx  = Math.min(Math.max(tooltip.x - bw / 2, PAD.left), PAD.left + CW - bw)
          const ty  = tooltip.y > PAD.top + 50 ? tooltip.y - bh - 10 : tooltip.y + 12
          const col = tooltip.type === 'klinik_onayli' ? CLINIC_COLOR : AI_COLOR
          const lbl = tooltip.type === 'klinik_onayli' ? 'Klinik Onaylı' : 'Ön Analiz'
          return (
            <g>
              <rect x={tx} y={ty} width={bw} height={bh} rx={6}
                fill="#0f172a" stroke={col} strokeWidth={0.8} opacity={0.95} />
              <text x={tx + bw / 2} y={ty + 14} textAnchor="middle"
                fill={col} fontSize="14" fontWeight="700">
                {tooltip.score}
              </text>
              <text x={tx + bw / 2} y={ty + 28} textAnchor="middle"
                fill="#64748b" fontSize="9">
                {lbl} · {fmtDate(tooltip.date)}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}
