import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Estelongy — Gençlik Skoru Platformu'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OGImage() {
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
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Logo area */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 80,
          height: 80,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          marginBottom: 24,
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>

        {/* Brand */}
        <div style={{
          fontSize: 52,
          fontWeight: 900,
          background: 'linear-gradient(90deg, #a78bfa, #c084fc)',
          backgroundClip: 'text',
          color: 'transparent',
          marginBottom: 16,
          letterSpacing: '-1px',
        }}>
          Estelongy
        </div>

        {/* Tagline */}
        <div style={{
          fontSize: 28,
          color: '#e2e8f0',
          fontWeight: 600,
          marginBottom: 12,
          textAlign: 'center',
        }}>
          Gençlik Skorunu Öğren
        </div>

        <div style={{
          fontSize: 18,
          color: '#94a3b8',
          textAlign: 'center',
          maxWidth: 600,
        }}>
          Ön analiz · Longevity anketi · Klinik onay — tek platformda EGS
        </div>

        {/* Score zones */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginTop: 40,
        }}>
          {[
            { label: '0-49', color: '#ef4444', name: 'Kritik' },
            { label: '50-74', color: '#f59e0b', name: 'Normal' },
            { label: '75-89', color: '#22c55e', name: 'Genç' },
            { label: '90-100', color: '#00d4ff', name: 'Premium' },
          ].map(z => (
            <div key={z.label} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '10px 20px',
              borderRadius: 12,
              background: `${z.color}20`,
              border: `1px solid ${z.color}40`,
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: z.color }}>{z.name}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{z.label}</div>
            </div>
          ))}
        </div>

        {/* URL */}
        <div style={{
          position: 'absolute',
          bottom: 32,
          fontSize: 16,
          color: '#475569',
        }}>
          estelongy.com
        </div>
      </div>
    ),
    { ...size }
  )
}
