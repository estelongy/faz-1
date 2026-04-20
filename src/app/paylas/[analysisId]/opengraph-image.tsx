import { ImageResponse } from 'next/og'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const alt = 'Estelongy — Klinik Onaylı EGS Skoru'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function zoneFromScore(s: number) {
  if (s >= 90) return { name: 'Premium', color: '#00d4ff', label: 'Çok iyi' }
  if (s >= 75) return { name: 'Genç',    color: '#22c55e', label: 'Yaşından genç' }
  if (s >= 50) return { name: 'Normal',  color: '#f59e0b', label: 'Yaşında' }
  return          { name: 'Kritik',      color: '#ef4444', label: 'Yaşından yaşlı' }
}

export default async function ShareOGImage({ params }: { params: { analysisId: string } }) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('get_public_score_card', { p_analysis_id: params.analysisId })
  const card = Array.isArray(data) && data.length > 0 ? data[0] : null

  // Kart yoksa fallback görsel
  if (!card) {
    return new ImageResponse(
      (
        <div style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #0f172a)',
          fontSize: 64, fontWeight: 900, color: '#a78bfa',
        }}>
          Estelongy
        </div>
      ),
      { ...size }
    )
  }

  const score = card.score as number
  const zone = zoneFromScore(score)
  const firstName = card.first_name as string
  const clinicName = card.clinic_name as string

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, ${zone.color}20 100%)`,
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Üst — Estelongy branding */}
        <div style={{
          position: 'absolute',
          top: 40,
          left: 60,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: 14,
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div style={{
            fontSize: 36,
            fontWeight: 900,
            background: 'linear-gradient(90deg, #a78bfa, #c084fc)',
            backgroundClip: 'text',
            color: 'transparent',
            letterSpacing: '-0.5px',
          }}>
            Estelongy
          </div>
        </div>

        {/* Üst sağ — Klinik onaylı damga */}
        <div style={{
          position: 'absolute',
          top: 50,
          right: 60,
          padding: '10px 20px',
          borderRadius: 999,
          background: '#10b981',
          color: 'white',
          fontSize: 18,
          fontWeight: 900,
          letterSpacing: '1px',
        }}>
          ✦ KLİNİK ONAYLI ✦
        </div>

        {/* Orta — Skor kartı */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}>
          <div style={{
            fontSize: 28,
            color: '#94a3b8',
            marginBottom: 12,
          }}>
            Tebrikler
          </div>
          <div style={{
            fontSize: 56,
            fontWeight: 900,
            color: 'white',
            marginBottom: 40,
            letterSpacing: '-1px',
          }}>
            {firstName}
          </div>

          <div style={{
            fontSize: 20,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '3px',
            marginBottom: 10,
          }}>
            Gençlik Skoru
          </div>

          <div style={{
            fontSize: 200,
            fontWeight: 900,
            color: zone.color,
            lineHeight: 1,
            letterSpacing: '-6px',
            textShadow: `0 0 60px ${zone.color}80`,
          }}>
            {score}
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 24,
            padding: '10px 28px',
            borderRadius: 999,
            background: `${zone.color}20`,
            border: `2px solid ${zone.color}60`,
            color: zone.color,
          }}>
            <span style={{ fontSize: 24, fontWeight: 900 }}>{zone.name}</span>
            <span style={{ fontSize: 18, opacity: 0.85 }}>— {zone.label}</span>
          </div>
        </div>

        {/* Alt — Klinik + CTA */}
        <div style={{
          position: 'absolute',
          bottom: 40,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 8,
        }}>
          <div style={{
            fontSize: 20,
            color: '#cbd5e1',
            fontWeight: 600,
          }}>
            {clinicName}
          </div>
          <div style={{
            fontSize: 18,
            color: '#a78bfa',
            fontWeight: 700,
          }}>
            Senin skorun ne? → estelongy.com
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
