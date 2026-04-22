interface LogoIconProps {
  size?: number
  className?: string
}

/**
 * Estelongy marka ikonu — dairesel metalik çerçeve + yüz profili + altın DNA sarmalı
 */
export default function LogoIcon({ size = 32, className = '' }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Metalik gümüş halka */}
        <linearGradient id="lg_ring1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#e2e8f0" />
          <stop offset="30%"  stopColor="#93c5fd" />
          <stop offset="70%"  stopColor="#c0cfe8" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        {/* İkinci halka — biraz daha koyu */}
        <linearGradient id="lg_ring2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#93c5fd" />
        </linearGradient>
        {/* Altın DNA */}
        <linearGradient id="lg_dna_l" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fef08a" />
          <stop offset="40%"  stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        <linearGradient id="lg_dna_r" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#fcd34d" />
          <stop offset="50%"  stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        {/* Gümüş yüz */}
        <linearGradient id="lg_face" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stopColor="#f1f5f9" />
          <stop offset="60%"  stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
        {/* Mavi parıltı */}
        <radialGradient id="rg_star" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#bfdbfe" stopOpacity="1" />
          <stop offset="60%"  stopColor="#3b82f6" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="rg_glow2" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#fbbf24" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* ══ DIŞ METALİK HALKA (kırık hilal) ══ */}
      {/* Kalın dış yay */}
      <path
        d="M 18 72 A 38 38 0 1 1 82 72"
        stroke="url(#lg_ring1)"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* İnce iç yay — derinlik için */}
      <path
        d="M 22 74 A 33 33 0 1 1 78 74"
        stroke="url(#lg_ring2)"
        strokeWidth="1.8"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />
      {/* Halka bitiş noktaları — küçük toplar */}
      <circle cx="18" cy="72" r="3" fill="url(#lg_ring1)" opacity="0.9" />
      <circle cx="82" cy="72" r="2.2" fill="#f59e0b" opacity="0.8" />

      {/* ══ ALTIN DNA SARMALI (merkez-sol) ══ */}
      {/* Sol strand */}
      <path
        d="M 34 20 C 27 30 43 37 34 47 C 25 57 41 64 34 74"
        stroke="url(#lg_dna_l)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Sağ strand */}
      <path
        d="M 44 20 C 51 30 35 37 44 47 C 53 57 37 64 44 74"
        stroke="url(#lg_dna_r)"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      {/* Çapraz bağ barları */}
      <line x1="34" y1="22" x2="44" y2="22" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
      <line x1="37" y1="29" x2="41" y2="29" stroke="#fcd34d" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="34" y1="36" x2="44" y2="36" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
      <line x1="37" y1="43" x2="41" y2="43" stroke="#fcd34d" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="34" y1="50" x2="44" y2="50" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
      <line x1="37" y1="57" x2="41" y2="57" stroke="#fcd34d" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      <line x1="34" y1="64" x2="44" y2="64" stroke="#fef08a" strokeWidth="1.8" strokeLinecap="round" opacity="0.95" />
      <line x1="37" y1="71" x2="41" y2="71" stroke="#fcd34d" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />

      {/* ══ YÜZ PROFİLİ (sağ taraf, sola bakıyor) ══ */}
      {/* Alın → burun köprüsü → burun ucu → dudak → çene hattı */}
      <path
        d="M 56 18
           C 53 18 51 19.5 50 21
           C 49 22.5 49.5 24.5 51 26
           C 52 27 52.5 28 52 29.5
           C 51.5 31 50.5 32 50.5 33.5
           C 50.5 35 51.5 36.5 52 38
           C 52 40 51 42 50 43.5
           L 50 52
           C 50 53.5 51 54.5 52 54.5
           L 60 54.5
           L 60 52
           C 63 50.5 65 47.5 65 44
           C 65 40 63 36 61 33
           C 63 30 64 26 63 22.5
           C 62 19.5 59 18 56 18 Z"
        fill="url(#lg_face)"
      />
      {/* Boyun */}
      <path
        d="M 53 54.5 L 53 61 C 53 62 53.8 62.5 55 62.5 L 59 62.5 C 60.2 62.5 61 62 61 61 L 61 54.5 Z"
        fill="url(#lg_face)"
        opacity="0.7"
      />

      {/* ══ PARLAMA NOKTALARı ══ */}
      {/* Üst mavi yıldız */}
      <circle cx="39" cy="12" r="6" fill="url(#rg_star)" />
      <circle cx="39" cy="12" r="2"  fill="#bfdbfe" opacity="0.95" />
      {/* Işık çaprazları */}
      <line x1="39" y1="8"  x2="39" y2="10" stroke="#bfdbfe" strokeWidth="1" opacity="0.7" />
      <line x1="39" y1="14" x2="39" y2="16" stroke="#bfdbfe" strokeWidth="1" opacity="0.7" />
      <line x1="35" y1="12" x2="37" y2="12" stroke="#bfdbfe" strokeWidth="1" opacity="0.7" />
      <line x1="41" y1="12" x2="43" y2="12" stroke="#bfdbfe" strokeWidth="1" opacity="0.7" />

      {/* Alt sağ altın parıltı */}
      <circle cx="80" cy="70" r="4" fill="url(#rg_glow2)" />
      <circle cx="80" cy="70" r="1.5" fill="#fbbf24" opacity="0.9" />
    </svg>
  )
}
