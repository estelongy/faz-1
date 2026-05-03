import type { Metadata } from 'next'
import KlinikComingSoon from '@/components/KlinikComingSoon'

export const metadata: Metadata = {
  title: 'Pazarlama — Klinik',
}

export default function PazarlamaPage() {
  return (
    <KlinikComingSoon
      emoji="📱"
      title="Pazarlama Merkezi"
      tagline="Hasta kazandırma araçları"
      subtitle="Sosyal medya gönderileri, WhatsApp şablonları, klinik onaylı skor paylaşım kartları — tek noktadan yönetin. AI destekli içerik üretimiyle saat değil dakika alır."
      cards={[
        {
          icon: '🔗',
          title: 'Klinik linkim',
          description: 'estelongy.com/randevu?k=KLINIK-ID — sosyal medyaya, web sitenize, biyo linkinize ekleyin. Hastalar direkt randevu alır.',
          badge: 'Hazır',
        },
        {
          icon: '💬',
          title: 'WhatsApp şablonları',
          description: 'Randevu hatırlatma, sonuç paylaşımı, tekrar randevu önerisi — onaylı şablonlar, tek tık gönder.',
        },
        {
          icon: '📸',
          title: 'Klinik onaylı skor kartı',
          description: 'Hastanın klinik onaylı skorunu paylaşılabilir görsel kart olarak üret. Instagram story, Twitter kartı, WhatsApp durum boyutları.',
          badge: 'AI',
        },
        {
          icon: '✍️',
          title: 'AI gönderi yazarı',
          description: 'Klinik için Estelongy AI: "Bu haftanın HA dolgu vakası için Instagram post" yaz, hashtag öner, görselle eşleştir.',
          badge: 'AI',
        },
        {
          icon: '📅',
          title: 'İçerik takvimi',
          description: 'Aylık sosyal medya plan: hangi gün ne paylaşılır, hangi içerik dönüşür. Cleanly schedulable.',
        },
        {
          icon: '🎯',
          title: 'Performans raporu',
          description: 'Hangi içerik kaç hasta getirdi, hangi link daha çok tıklandı, hangi mesaj daha çok cevap aldı — dönüşüm metrikleri.',
        },
      ]}
      feedbackCta={{ text: 'Hangi araç önce gelsin?', href: '/klinik/panel/destek' }}
    />
  )
}
