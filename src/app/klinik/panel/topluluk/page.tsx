import type { Metadata } from 'next'
import KlinikComingSoon from '@/components/KlinikComingSoon'

export const metadata: Metadata = {
  title: 'Topluluk — Klinik',
}

export default function ToplulukPage() {
  return (
    <KlinikComingSoon
      emoji="💬"
      title="Klinik Topluluğu"
      tagline="Klinikler arası etkileşim"
      subtitle="Estelongy üzerinden çalışan hekimler ve klinik yöneticileriyle bilgi paylaşın. WhatsApp gruplarından farklı: konu odaklı kanallar, aranabilir arşiv, anonim vaka tartışmaları."
      tabs={[
        { id: 'feed',     label: '🌍 Genel' },
        { id: 'derma',    label: '💉 Dermatoloji' },
        { id: 'plastik',  label: '🩺 Plastik & Estetik' },
        { id: 'longev',   label: '🧬 Longevity' },
        { id: 'duyuru',   label: '📢 Estelongy Duyuruları' },
      ]}
      cards={[
        {
          icon: '🗣️',
          title: 'Konu kanalları',
          description: 'Branş bazlı tartışma kanalları. Dermatoloji, plastik cerrahi, longevity, fonksiyonel tıp — kendi kanalında konuş.',
          badge: 'Discord-vari',
        },
        {
          icon: '📢',
          title: 'Estelongy duyuruları',
          description: 'Yeni özellik, algoritma güncellemesi, sertifika fırsatı, partnerlik haberleri — direkt Estelongy ekibinden.',
          badge: 'Resmi',
        },
        {
          icon: '🏥',
          title: 'Anonim vaka paylaşımı',
          description: 'Karmaşık bir hasta için ikinci görüş ister misin? Anonim paylaş, topluluktan deneyim al. Hasta kimliği gizli.',
        },
        {
          icon: '👥',
          title: 'Klinik rehberi',
          description: 'Estelongy üzerindeki tüm klinikler — şehir, branş, EGP rozetiyle. Ortak hasta yönlendirmesi, refer ağı kurma.',
        },
        {
          icon: '🎤',
          title: 'Canlı oturumlar',
          description: 'Aylık webinarlar: skor algoritması derinlemesine, tetkik analizi, klinik akış optimizasyonu. Soru-cevap.',
        },
        {
          icon: '🏆',
          title: 'Liderlik tablosu',
          description: 'En aktif klinikler, en yüksek hasta memnuniyeti, en çok klinik onaylı skor üretenler. Sağlıklı rekabet.',
        },
      ]}
      feedbackCta={{ text: 'Erken Erişim İste', href: '/klinik/panel/destek' }}
    />
  )
}
