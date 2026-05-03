import type { Metadata } from 'next'
import KlinikComingSoon from '@/components/KlinikComingSoon'

export const metadata: Metadata = {
  title: 'Akademi — Klinik',
}

export default function AkademiPage() {
  return (
    <KlinikComingSoon
      emoji="📰"
      title="Estelongy Akademi"
      tagline="Topluluk içeriği"
      subtitle="Bilimsel yenilikleri, kongre takvimini ve klinik vakalarını tek yerde takip edin. WhatsApp gruplarındaki dağınık paylaşımlar yerine düzenli ve aranabilir bir merkez."
      tabs={[
        { id: 'bilim',  label: '🧬 Bilim & Yenilikler' },
        { id: 'kongre', label: '🎤 Kongreler' },
        { id: 'vaka',   label: '🏥 Klinik Vakaları' },
      ]}
      cards={[
        {
          icon: '🧬',
          title: 'Yeni klinik araştırmalar',
          description: 'Cilt biyolojik yaşı, longevity protokolleri ve estetik dermatoloji üzerine haftalık özet — Estelongy ekibi tarafından derlenmiş.',
          badge: 'Hafta 1',
        },
        {
          icon: '🎤',
          title: 'Kongre & sempozyum takvimi',
          description: 'Ulusal ve uluslararası dermatoloji, plastik cerrahi, anti-aging kongrelerinin tarihi + erken kayıt linki.',
          badge: 'Aylık',
        },
        {
          icon: '🏥',
          title: 'Klinik vakaları (anonim)',
          description: 'Estelongy üzerinden takip edilmiş hasta vakaları. Skor değişimi, uygulanan protokol, klinik notları — anonim ve eğitim amaçlı.',
          badge: 'Topluluk',
        },
        {
          icon: '📐',
          title: 'Protokol kütüphanesi',
          description: 'Skor bandına göre önerilen tedavi protokolleri. EGP yüksek işlemler, kombinasyonlar, sürdürülebilir bakım planları.',
        },
        {
          icon: '🎓',
          title: 'Estelongy eğitimleri',
          description: 'Skor algoritması, klinik akış, hekim onay metodolojisi üzerine sertifikalı online dersler.',
        },
        {
          icon: '📊',
          title: 'Sektör verileri',
          description: 'Türkiye\'deki estetik klinik istatistikleri, hasta tercih trendleri, fiyat bantları — anonim ve agrege.',
        },
      ]}
      feedbackCta={{ text: 'Öneri Gönder', href: '/klinik/panel/destek' }}
    />
  )
}
