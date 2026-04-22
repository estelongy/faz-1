'use client'

import { useEffect, useState, useRef } from 'react'

export type ScorePhase =
  | 'ai_analiz' | 'longevity_anketi' | 'randevu' | 'klinik_kabul'
  | 'klinik_anketi' | 'ileri_ai' | 'tetkik' | 'hekim_degerlendirme' | 'klinik_onayli'

interface ScoreBarProps {
  score: number
  previousScore?: number
  phase: ScorePhase
  age?: number
  isClinicView?: boolean
  animated?: boolean
}

// ── Gauge sabitler ──────────────────────────────────────────────
const CX = 150, CY = 148          // merkez
const R  = 108                     // yarıçap
const SW = 18                      // stroke genişliği
const CIRC = 2 * Math.PI * R       // çevre ≈ 678.6

const ARC_DEG  = 240               // yayın toplam açısı (7:30 → 4:30)
const ARC_LEN  = (ARC_DEG / 360) * CIRC   // görünür yay uzunluğu
const GAP_LEN  = CIRC - ARC_LEN           // alt boşluk

// Dönüş: SVG çemberi 3'ten (sağ) başlar → 135° döndürünce 7:30'a gelir
const ROT = 135

// Standart açı hesabı (ibre için):  score 0 → 225°  score 100 → -15°
const START_MATH = 225             // 7:30 pozisyonu
function scoreToMathAngle(score: number) {
  return START_MATH - (Math.min(Math.max(score, 0), 100) / 100) * ARC_DEG
}

// Polar → Kartezyen (y-ekseni ters çevrilmiş SVG için)
function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy - r * Math.sin(rad) }
}

// ── Renk bölgeleri ──────────────────────────────────────────────
const ZONE_DEFS = [
  { pct: 0.55, color: '#ef4444', name: 'Çok Düşük', range: '0–55'   },
  { pct: 0.10, color: '#a855f7', name: 'Düşük',     range: '56–65'  },
  { pct: 0.14, color: '#f97316', name: 'Normal',    range: '66–79'  },
  { pct: 0.10, color: '#22c55e', name: 'İyi',       range: '80–89'  },
  { pct: 0.11, color: '#3b82f6', name: 'Çok İyi',   range: '90–100' },
]

// Her bölge için dasharray + dashoffset hesapla
let cumLen = 0
const ZONES = ZONE_DEFS.map(z => {
  const len   = z.pct * ARC_LEN
  const start = cumLen
  cumLen += len
  return {
    ...z,
    len,
    dasharray:  `${len} ${CIRC - len}`,
    dashoffset: CIRC - start,       // formül: C - startPos
  }
})

function getZone(score: number) {
  if (score >= 90) return ZONES[4]
  if (score >= 80) return ZONES[3]
  if (score >= 66) return ZONES[2]
  if (score >= 56) return ZONES[1]
  return ZONES[0]
}

// ── Tick işaretleri: sadece bölge sınırları, 0 ve 100 YOK ───────
const MAJOR_TICKS = [56, 66, 80, 90]
const MINOR_TICKS = [10, 20, 30, 40, 70]

// ── Aşamalar ────────────────────────────────────────────────────
const PHASES = [
  { key: 'ai_analiz',           label: 'Ön Analiz'   },
  { key: 'longevity_anketi',    label: 'Anket'       },
  { key: 'randevu',             label: 'Randevu'     },
  { key: 'klinik_kabul',        label: 'Kabul'       },
  { key: 'klinik_anketi',       label: 'Kl.Anketi'   },
  { key: 'ileri_ai',            label: 'İleri Analiz'},
  { key: 'tetkik',              label: 'Tetkik'      },
  { key: 'hekim_degerlendirme', label: 'Hekim'       },
  { key: 'klinik_onayli',       label: 'Klinik Onaylı' },
]

// ── Mesajlar ─────────────────────────────────────────────────────
function getMsg(score: number, isClinic: boolean, age?: number, prev?: number): string {
  if (isClinic) {
    if (prev !== undefined && prev !== score) {
      const d = score - prev
      return d > 0 ? `Hasta ${d} puan kazandı — harika sonuç!` : `Skor ${Math.abs(d)} puan düzeltildi.`
    }
    if (score >= 90) return 'Koruma protokolü öner.'
    if (score >= 75) return 'Hafif bakım yeterli.'
    if (score >= 50) return 'Tedavi için uygun profil.'
    return 'Kapsamlı protokol gerekiyor.'
  }
  if (!age) {
    if (score >= 90) return 'Olağanüstü gençlik skoru! 🎉'
    if (score >= 75) return 'Yaşınızdan genç görünüyorsunuz.'
    if (score >= 50) return 'Yaşınıza göre normal aralıkta.'
    return 'Uzman desteğiyle skorunuzu yükseltebilirsiniz.'
  }
  const diff = Math.max(0, Math.round((score - 50) / 8))
  if (diff >= 5) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz! 🎉`
  if (diff >= 1) return `Yaşınızdan ${diff} yaş genç görünüyorsunuz.`
  return 'Yaşınıza tam uygun görünüyorsunuz.'
}

// ── Bileşen ──────────────────────────────────────────────────────
export default function ScoreBar({
  score, previousScore, phase, age, isClinicView = false, animated = true,
}: ScoreBarProps) {
  const [disp, setDisp] = useState(animated ? 0 : score)
  const [ang,  setAng]  = useState(animated ? START_MATH : scoreToMathAngle(score))
  const [showDelta, setShowDelta] = useState(false)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    if (!animated) { setDisp(score); setAng(scoreToMathAngle(score)); return }

    const dur = 1400, t0 = performance.now()
    const tick = (now: number) => {
      const prog = Math.min((now - t0) / dur, 1)
      const ease = 1 - Math.pow(1 - prog, 3)
      const s    = Math.round(ease * score)
      setDisp(s); setAng(scoreToMathAngle(s))
      if (prog < 1) { rafRef.current = requestAnimationFrame(tick) }
      else if (previousScore !== undefined && previousScore !== score) {
        setShowDelta(true)
        setTimeout(() => setShowDelta(false), 3000)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [score, animated, previousScore])

  const zone     = getZone(disp)
  const phaseIdx = PHASES.findIndex(p => p.key === phase)
  const delta    = previousScore !== undefined ? score - previousScore : null
  const isLast   = phase === 'klinik_onayli'

  // İbre geometrisi
  const tip  = polar(CX, CY, R - 12, ang)
  const lPt  = polar(CX, CY, 8,  ang + 90)
  const rPt  = polar(CX, CY, 8,  ang - 90)
  const tail = polar(CX, CY, 15, ang + 180)

  // Aktif glow uzunluğu (score'a kadar olan yay)
  const glowLen = (disp / 100) * ARC_LEN

  return (
    <div className="w-full select-none">

      {/* ── Başlık ── */}
      <div className="text-center mb-1">
        <p className="text-[11px] font-black tracking-[0.3em] uppercase"
           style={{ color: zone.color, textShadow: `0 0 14px ${zone.color}70` }}>
          ESTELONGY
        </p>
        <p className="text-[9px] font-semibold tracking-[0.18em] uppercase mt-0.5"
           style={{ color: isLast ? '#34d399' : phase === 'ai_analiz' ? '#fbbf24' : '#94a3b8' }}>
          {isLast
            ? '✦ KLİNİK ONAYLI ✦'
            : phase === 'ai_analiz'
              ? 'ÖN ANALİZ — TAHMİNİ'
              : 'Gençlik Skoru'}
        </p>
      </div>

      {/* ── SVG Gauge ── */}
      <div className="relative flex justify-center"
           style={{ filter: `drop-shadow(0 2px 16px ${zone.color}35)` }}>
        <svg viewBox="0 0 300 250" className="w-full max-w-xs">
          <defs>
            <linearGradient id="ng" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#475569" />
              <stop offset="60%"  stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>

          {/* 1. Arka plan yayı */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="#1e293b" strokeWidth={SW + 8}
            strokeDasharray={`${ARC_LEN} ${GAP_LEN}`}
            strokeDashoffset={CIRC}
            strokeLinecap="butt"
            transform={`rotate(${ROT},${CX},${CY})`} />

          {/* 2. Renk bölgesi yayları */}
          {ZONES.map((z, i) => (
            <circle key={i} cx={CX} cy={CY} r={R} fill="none"
              stroke={z.color} strokeWidth={SW}
              strokeDasharray={z.dasharray}
              strokeDashoffset={z.dashoffset}
              strokeLinecap="butt"
              transform={`rotate(${ROT},${CX},${CY})`}
              opacity={0.88} />
          ))}

          {/* 3. Yuvarlatılmış başlangıç ucu */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="#ef4444" strokeWidth={SW}
            strokeDasharray={`1 ${CIRC - 1}`}
            strokeDashoffset={CIRC}
            strokeLinecap="round"
            transform={`rotate(${ROT},${CX},${CY})`} />

          {/* 4. Yuvarlatılmış bitiş ucu */}
          <circle cx={CX} cy={CY} r={R} fill="none"
            stroke="#3b82f6" strokeWidth={SW}
            strokeDasharray={`1 ${CIRC - 1}`}
            strokeDashoffset={CIRC - ARC_LEN + 0.5}
            strokeLinecap="round"
            transform={`rotate(${ROT},${CX},${CY})`} />

          {/* 5. Aktif skor glow */}
          {disp > 0 && (
            <circle cx={CX} cy={CY} r={R} fill="none"
              stroke={zone.color} strokeWidth={SW - 10}
              strokeDasharray={`${glowLen} ${CIRC - glowLen}`}
              strokeDashoffset={CIRC}
              strokeLinecap="butt"
              transform={`rotate(${ROT},${CX},${CY})`}
              opacity={0.4}
              style={{ filter: 'blur(4px)' }} />
          )}

          {/* 6. Major tick çizgileri */}
          {MAJOR_TICKS.map(ts => {
            const a    = scoreToMathAngle(ts)
            const inn  = polar(CX, CY, R - SW / 2 - 12, a)
            const out  = polar(CX, CY, R + SW / 2 + 5,  a)
            const lbl  = polar(CX, CY, R + SW / 2 + 18, a)
            return (
              <g key={ts}>
                <line x1={inn.x} y1={inn.y} x2={out.x} y2={out.y}
                  stroke="#fff" strokeWidth={2.5} strokeLinecap="round" opacity={0.65} />
                <text x={lbl.x} y={lbl.y} textAnchor="middle" dominantBaseline="middle"
                  fill="#64748b" fontSize="10" fontWeight="700">{ts}</text>
              </g>
            )
          })}

          {/* 7. Minor tick çizgileri */}
          {MINOR_TICKS.map(ts => {
            const a   = scoreToMathAngle(ts)
            const inn = polar(CX, CY, R - SW / 2 - 4, a)
            const out = polar(CX, CY, R - SW / 2,     a)
            return (
              <line key={ts} x1={inn.x} y1={inn.y} x2={out.x} y2={out.y}
                stroke="#334155" strokeWidth={1.5} strokeLinecap="round" />
            )
          })}

          {/* 8. İbre gölgesi */}
          <polygon
            points={`${tip.x},${tip.y} ${lPt.x},${lPt.y} ${tail.x},${tail.y} ${rPt.x},${rPt.y}`}
            fill="#000" opacity={0.3} transform="translate(2,3)" />

          {/* 9. İbre */}
          <polygon
            points={`${tip.x},${tip.y} ${lPt.x},${lPt.y} ${tail.x},${tail.y} ${rPt.x},${rPt.y}`}
            fill="url(#ng)" />

          {/* 10. Merkez hub */}
          <circle cx={CX} cy={CY} r={16} fill="#0f172a" stroke="#334155" strokeWidth={2} />
          <circle cx={CX} cy={CY} r={9}  fill={zone.color} opacity={0.9}
            style={{ filter: `drop-shadow(0 0 6px ${zone.color})` }} />
          <circle cx={CX} cy={CY} r={4}  fill="#fff" opacity={0.55} />

          {/* 11. Skor sayısı — ibre altındaki gap alanında */}
          <text x={CX} y={CY + 38} textAnchor="middle"
            fill={zone.color} fontSize="52" fontWeight="900" fontFamily="system-ui"
            style={{ filter: `drop-shadow(0 0 10px ${zone.color}80)` }}>
            {disp}
          </text>
          <text x={CX} y={CY + 57} textAnchor="middle"
            fill="#475569" fontSize="10" fontWeight="500">
            / 100
          </text>
          <text x={CX} y={CY + 74} textAnchor="middle"
            fill={zone.color} fontSize="11" fontWeight="700" letterSpacing="1" opacity={0.9}>
            {zone.name}
          </text>
        </svg>

        {/* Delta badge */}
        {showDelta && delta !== null && delta !== 0 && (
          <div className={`absolute top-2 right-2 text-base font-black px-2.5 py-1 rounded-full animate-bounce
            ${delta > 0
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-400 border border-red-500/40'}`}>
            {delta > 0 ? `+${delta}` : delta}
          </div>
        )}
      </div>

      {/* ── Mesaj kutusu ── */}
      <div className="mt-1 mx-auto max-w-xs px-4 py-2.5 rounded-xl border text-center"
        style={{ borderColor: `${zone.color}40`, background: `${zone.color}0d` }}>
        <p className="text-sm font-medium" style={{ color: zone.color }}>
          {getMsg(score, isClinicView, age, previousScore)}
        </p>
        {isLast && (
          <p className="text-xs text-slate-500 mt-0.5">Hekim tarafından doğrulandı ✓</p>
        )}
      </div>

      {/* ── Aşama yolculuğu ── */}
      <div className="mt-4 px-1">
        <div className="flex items-center">
          {PHASES.map((p, i) => {
            const done = i < phaseIdx, curr = i === phaseIdx, last = i === PHASES.length - 1
            return (
              <div key={p.key} className="flex items-center flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-500
                      ${done ? 'bg-emerald-500' : curr ? '' : 'bg-slate-800 border border-slate-700'}`}
                    style={curr ? { background: zone.color, boxShadow: `0 0 10px ${zone.color}60` } : undefined}>
                    {done
                      ? <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      : <div className={`w-1.5 h-1.5 rounded-full ${curr ? 'bg-white animate-pulse' : 'bg-slate-700'}`} />
                    }
                  </div>
                  <span
                    className={`text-[8px] font-medium text-center leading-tight max-w-[36px] truncate
                      ${done ? 'text-emerald-400' : curr ? '' : 'text-slate-700'}`}
                    style={curr ? { color: zone.color } : undefined}>
                    {p.label}
                  </span>
                </div>
                {!last && (
                  <div className={`h-px flex-1 mx-0.5 mb-3 ${done ? 'bg-emerald-500/40' : 'bg-slate-800'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
