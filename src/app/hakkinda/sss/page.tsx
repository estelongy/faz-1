import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sık Sorulan Sorular',
  description: 'Estelongy Gençlik Skoru (EGS), klinik akışı, jeton sistemi ve satıcı süreçleri hakkında sık sorulan sorular.',
}

interface FAQ {
  q: string
  a: string
}

interface FAQGroup {
  title: string
  icon: string
  items: FAQ[]
}

const GROUPS: FAQGroup[] = [
  {
    title: 'Gençlik Skoru (EGS)',
    icon: '✦',
    items: [
      {
        q: 'EGS nedir?',
        a: 'EGS (Estelongy Gençlik Skoru), 0-100 arasında bir biyolojik gençlik göstergesidir. Ön analiz, longevity anketi, tetkik sonuçları ve hekim değerlendirmesi — bu girdilerin birleşimiyle hesaplanır. Tek bir rakam, durumunuzu net özetler.',
      },
      {
        q: 'Skor nasıl yükseltilir?',
        a: 'Dört yolu var: (1) Longevity anketini doldurun — uyku, beslenme, stres ve cilt rutini puanınıza +10\'a kadar katkı sağlar. (2) Klinik randevusu alın — hekim değerlendirmesiyle Klinik Onaylı EGS\'ye ulaşın. (3) Bakım rutininize uyun. (4) 6 ayda bir yeniden ölçün, ilerlemenizi takip edin.',
      },
      {
        q: 'Ön Analiz ile Klinik Onaylı EGS arasındaki fark nedir?',
        a: 'Ön Analiz; selfienizle anlık hesaplanan tahmini bir başlangıç değeridir, yol göstericidir. Klinik Onaylı EGS ise uzman hekim tarafından anket, tetkik ve yüz yüze değerlendirmeyle doğrulanmış, damgalı sertifikalı skordur — paylaşılabilir.',
      },
      {
        q: 'Renk bölgeleri ne anlama geliyor?',
        a: 'Kırmızı (0-49): Yaşından yaşlı görünüm — klinik önerilir. Kahverengi/Amber (50-74): Yaşında. Yeşil (75-89): Yaşından genç — koruma aşamasında. Mavi (90-100): Premium gençlik — çok iyi durum.',
      },
      {
        q: 'Skor düşerse ne olur?',
        a: 'Klinik Onaylı EGS hiçbir zaman otomatik düşmez. Yalnızca yeni bir klinik ölçümünde güncellenir. Ön Analiz skoru ise her yeni selfie yüklemede güncellenir — bu değişim sizin takibiniz içindir.',
      },
    ],
  },
  {
    title: 'Süreç ve Randevu',
    icon: '📅',
    items: [
      {
        q: 'EGS Analizi ücretsiz mi?',
        a: 'Evet. Selfie ön analizi, longevity anketi, skor takibi ve paylaşım — hepsi ücretsizdir. Klinik onaylı sertifika almak için bir kliniğe randevu almanız yeterli; klinik muayene ücreti kliniğe göre değişir.',
      },
      {
        q: 'Randevuyu nasıl alırım?',
        a: 'Giriş yaptıktan sonra "Randevu Al" ekranına gidin. Lokasyon ve uzmanlık alanına göre klinik seçin, uygun tarih/saat için istek gönderin. Klinik onaylarsa randevunuz oluşur.',
      },
      {
        q: 'Randevumu iptal edebilir miyim?',
        a: 'Evet, "Bekleyen" veya "Onaylandı" statüsündeki randevularınızı panelinizden tek tıkla iptal edebilirsiniz. İptal için süre kısıtlaması yoktur, ancak klinik işleyişine saygı için randevudan en az 24 saat önce iptal etmenizi öneririz.',
      },
      {
        q: 'Fotoğrafım güvende mi?',
        a: 'Evet. Fotoğraflarınız yalnızca Gençlik Skoru hesaplaması için kullanılır. Şifreli bağlantıyla iletilir, üçüncü taraflarla paylaşılmaz, reklam hedefleme için kullanılmaz. Hesabınızı kapattığınızda fotoğraflarınız silinir.',
      },
    ],
  },
  {
    title: 'Klinikler',
    icon: '🏥',
    items: [
      {
        q: 'Klinik başvurusu nasıl çalışır?',
        a: 'Kliniğinizi kaydedin, admin onayından sonra 10 başlangıç jetonu hediyeyle sisteme dahil olursunuz. Platform aboneliği yoktur; sadece gerçekleşen hasta kabulünde 1 jeton harcanır.',
      },
      {
        q: 'Jeton nedir? Nasıl satın alınır?',
        a: 'Jeton, kliniğinizin hasta kabul hakkıdır. Her "Hastayı Kabul Et" işleminde 1 jeton düşer. No-show durumlarda jeton yanmaz. Klinik panelinizdeki "Jeton Yönetimi" ekranından Stripe ile güvenli ödemeyle paket satın alabilirsiniz: 10 Jeton €49 / 25 Jeton €99 (en popüler) / 50 Jeton €179 / 100 Jeton €299.',
      },
      {
        q: 'Neden abonelik yerine jeton?',
        a: 'Sadece gerçekleşen müşteri için ödeme prensibi. Başlangıç engeli sıfır — platforma bedava katılırsınız. Reklama %30-40 komisyon ödemek yerine, yalnızca gelen hasta başına cüzi bir maliyet ödersiniz.',
      },
      {
        q: 'Hekim olarak karar verme yetkim tam mı?',
        a: 'Evet. Ön analiz ve longevity anketi yalnızca yol göstericidir. Final Klinik Onaylı EGS skoru, sizin yüz yüze değerlendirmenizle oluşur. Formül: (Ön analiz+anket) × 0.85 + (Hekim değerlendirmesi) × 0.15. Nihai karar hekime aittir.',
      },
      {
        q: 'Hasta verilerine nasıl erişirim?',
        a: 'Klinik panelinizden hastanın tüm geçmişine erişirsiniz: Ön analiz skorları, longevity anketi cevapları, klinik notları, tetkik sonuçları ve önceki randevular. Row Level Security (RLS) ile yalnızca kendi kliniğinizin verilerine erişim yetkiniz vardır.',
      },
    ],
  },
  {
    title: 'Satıcılar',
    icon: '🛍️',
    items: [
      {
        q: 'Satıcı olarak nasıl başvururum?',
        a: '"Satıcı Ol" ekranından mağaza bilgilerinizi (firma adı, vergi no, kategori) girin. Admin onayından sonra ürünlerinizi eklemeye başlayabilirsiniz.',
      },
      {
        q: 'Komisyon oranı nedir?',
        a: 'Platform komisyonu her satıştan %15\'tir. Bu oran ileride kategori ve satıcı tecrübesine göre değişebilir. Komisyonunuz otomatik hesaplanır, net kazancınız satış anında görünür.',
      },
      {
        q: 'Ürünlerim nasıl öne çıkar?',
        a: 'Hekim puanlı sistem: Doktorlar tedavi planlarında belirli ürünleri tavsiye edebilir. Hekim tarafından önerilen ürünler hasta panelinde "Uzman Önerisi" etiketiyle öne çıkar — bu en güçlü pazarlama kanalınızdır.',
      },
    ],
  },
  {
    title: 'Gizlilik ve Güvenlik',
    icon: '🔒',
    items: [
      {
        q: 'Verilerim KVKK kapsamında nasıl korunuyor?',
        a: 'Tüm kişisel verileriniz KVKK ve GDPR uyumlu şekilde işlenir. Aydınlatma metnimiz ve çerez politikamızı inceleyebilirsiniz. Verilerinizi istediğiniz zaman silebilirsiniz.',
      },
      {
        q: 'Hesabımı nasıl silerim?',
        a: 'support@estelongy.com adresine talebinizi iletin. 7 iş günü içinde hesabınız ve tüm kişisel verileriniz (fotoğraflar, analizler, anket cevapları) sistemimizden silinir. Yasal saklama zorunluluğu olan faturalar istisnadır.',
      },
    ],
  },
]

export default function SSSPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          ← Anasayfa
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-3">Sık Sorulan Sorular</h1>
          <p className="text-slate-400">Gençlik Skoru, klinik akışı, jeton sistemi ve daha fazlası hakkında hızlı yanıtlar.</p>
        </div>

        <div className="space-y-10">
          {GROUPS.map(group => (
            <section key={group.title}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{group.icon}</span>
                <h2 className="text-xl font-bold text-white">{group.title}</h2>
              </div>
              <div className="space-y-3">
                {group.items.map(item => (
                  <details key={item.q}
                    className="group p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
                    <summary className="text-white font-semibold list-none flex items-center justify-between gap-3">
                      <span className="text-sm leading-relaxed">{item.q}</span>
                      <svg className="w-4 h-4 text-slate-500 shrink-0 group-open:rotate-45 transition-transform"
                        fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </summary>
                    <p className="mt-3 text-slate-400 text-sm leading-relaxed">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-14 p-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 text-center">
          <p className="text-white font-semibold mb-1">Sorunuza cevap bulamadınız mı?</p>
          <p className="text-slate-400 text-sm mb-4">Destek ekibimiz size yardımcı olmaktan memnuniyet duyar.</p>
          <Link href="/hakkinda/iletisim"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-semibold rounded-xl transition-all">
            İletişime Geç →
          </Link>
        </div>
      </div>
    </main>
  )
}
