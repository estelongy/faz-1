import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estetik Uygulamalar Rehberi: Botoks, Dolgu, PRP ve Daha Fazlası | Estelongy',
  description: 'Botoks, hyalüronik asit dolgu, PRP, mezoterapi ve kimyasal peeling uygulamalarını karşılaştırın. Hangi tedavi size uygun? Uzmanlara danışmadan önce bilmeniz gerekenler.',
  keywords: ['botoks nedir', 'hyalüronik asit dolgu', 'PRP tedavisi', 'mezoterapi', 'estetik uygulamalar', 'yüz dolgusu', 'cilt gençleştirme'],
  openGraph: {
    title: 'Estetik Uygulamalar Rehberi | Estelongy',
    description: 'Botoks, dolgu, PRP ve mezoterapi: hangi uygulama ne işe yarar? Kapsamlı karşılaştırma ve uzman bakış açısı.',
    url: 'https://estelongy.com/rehber/estetik-uygulamalar',
  },
  alternates: { canonical: 'https://estelongy.com/rehber/estetik-uygulamalar' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Estetik Uygulamalar Rehberi: Botoks, Dolgu, PRP ve Daha Fazlası',
  description: 'Botoks, hyalüronik asit dolgu, PRP, mezoterapi ve kimyasal peeling uygulamalarını karşılaştırın.',
  author: { '@type': 'Organization', name: 'Estelongy' },
  publisher: { '@type': 'Organization', name: 'Estelongy', url: 'https://estelongy.com' },
  url: 'https://estelongy.com/rehber/estetik-uygulamalar',
  inLanguage: 'tr',
}

const APPS = [
  {
    id: 'botoks',
    name: 'Botoks (Botulinum Toksin)',
    icon: '💉',
    color: '#a78bfa',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    summary: 'Mimik kaslarını geçici olarak hareketsiz bırakarak kırışıklıkları düzleştirir.',
    howItWorks: 'Botulinum toksini, sinir-kas kavşağında asetilkolin salınımını bloke eder. Kas hareket edemediği için kırışıklık oluşmaz veya mevcut kırışıklar yumuşar.',
    usedFor: ['Alın çizgileri', 'Kaş arası kırışıklık (glabellar)', 'Göz kenarı (kaz ayağı)', 'Dudak üstü çizgiler', 'Boyun bantları'],
    duration: '3–6 ay',
    onset: '3–7 gün',
    note: 'Etki geçici; kas hareketi zamanla geri döner. Düzenli uygulamayla kırışık derinliği uzun vadede azalır.',
    egp: 7.0,
  },
  {
    id: 'dolgu',
    name: 'Hyalüronik Asit (HA) Dolgu',
    icon: '✨',
    color: '#60a5fa',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    summary: 'Vücudun doğal bileşeni olan hyalüronik asit ile hacim ekler, çizgileri doldurur ve cilde nem katar.',
    howItWorks: 'HA jel, deri altına enjekte edilerek hacim oluşturur; aynı zamanda su tutma kapasitesiyle cilt hidrasyonunu artırır. Farklı yoğunluklarda üretildiğinden hem ince dudak çizgileri hem de yanak hacim kaybı için kullanılır.',
    usedFor: ['Dudak hacmi ve şekli', 'Yanak ve elmacık', 'Göz altı çukuru (tear trough)', 'Çene hattı', 'Nazolabial kıvrımlar'],
    duration: '6–18 ay (bölgeye ve ürüne göre değişir)',
    onset: 'Anında görünür',
    note: 'Hiyaluronidaz enzimi ile geri alınabilir (reversibl). Uygulamadan önce mutlaka yetkili bir hekim tarafından değerlendirilmeli.',
    egp: 9.2,
  },
  {
    id: 'prp',
    name: 'PRP (Trombositten Zengin Plazma)',
    icon: '🩸',
    color: '#f87171',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    summary: 'Kişinin kendi kanından elde edilen büyüme faktörlerini cilde vererek doğal yenilemeyi tetikler.',
    howItWorks: 'Alınan kan santrifüj edilerek trombositten zengin plazma ayrıştırılır. Bu plazmadaki büyüme faktörleri (PDGF, TGF-β, VEGF) enjekte edildiğinde kolajen sentezini uyarır, mikro dolaşımı iyileştirir.',
    usedFor: ['Cilt kalitesi ve parlaklık', 'İnce çizgiler', 'Saç dökülmesi (saçlı deri)', 'Göz altı morluğu', 'Yara ve skar iyileşmesi'],
    duration: 'Etkiler 12–18 ay sürebilir',
    onset: '4–6 hafta (birden fazla seans gerektirir)',
    note: 'Kendi kanınız kullanıldığı için alerjik reaksiyon riski minimumdur. Sonuçlar kişinin büyüme faktörü konsantrasyonuna göre değişir.',
    egp: 8.0,
  },
  {
    id: 'mezoterapi',
    name: 'Mezoterapi',
    icon: '🧪',
    color: '#34d399',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    summary: 'Vitamin, mineral, amino asit ve hyalüronik asit kokteylini deri altına enjekte ederek cilt kalitesini artırır.',
    howItWorks: 'Çok sayıda mikro enjeksiyonla aktif maddeler dermise doğrudan iletilir; topikal ürünlerin yetersiz kaldığı derin taşıma sorununu aşar. Kolajen yapım taşları direkt hedefe ulaşır.',
    usedFor: ['Cilt sıkılaştırma', 'Nemlendirme ve parlaklık', 'Göz çevresi', 'Boyun ve dekolte', 'İnce çizgiler'],
    duration: '3–6 ay; bakım seanslarıyla uzatılır',
    onset: '2–3 seans sonrası belirginleşir',
    note: 'İçerik standardize değil; ürün kalitesi ve hekim deneyimi sonucu doğrudan etkiler. Güvenilir sertifikalı preparatlar tercih edilmeli.',
    egp: 7.5,
  },
  {
    id: 'peeling',
    name: 'Kimyasal Peeling',
    icon: '🌿',
    color: '#fbbf24',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    summary: 'Kontrollü kimyasal eksfolyasyonla ölü hücreleri uzaklaştırır, cilt tonu ve dokusunu düzenler.',
    howItWorks: 'Glikolik asit, salisilik asit, TCA veya fenol gibi kimyasal ajanlar belirli derinlikte deri soymasına neden olur. Yeni cilt yüzeye çıkarken pigmentasyon, akne izi ve ince kırışıklıklar azalır.',
    usedFor: ['Pigmentasyon ve lekeler', 'Akne ve akne izleri', 'Cilt tonu eşitsizliği', 'İnce kırışıklıklar', 'Gözenek görünümü'],
    duration: 'Yüzeysel: 4–6 ay | Orta derinlik: 1–2 yıl',
    onset: '7–14 gün (soyulma süreci geçtikten sonra)',
    note: 'Derinlik arttıkça etki ve iyileşme süresi uzar. Güneş koruma zorunludur; esmer tenler için dikkatli doz seçimi gerekir.',
    egp: 6.8,
  },
]

export default function EstetikUygulamalarPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        {/* Header */}
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-500 hover:text-white transition-colors">Estelongy</Link>
            <span className="text-slate-700">›</span>
            <Link href="/rehber" className="text-slate-500 hover:text-white transition-colors">Gençlik Rehberi</Link>
            <span className="text-slate-700">›</span>
            <span className="text-white font-medium truncate">Estetik Uygulamalar</span>
          </div>
        </header>

        <article className="max-w-3xl mx-auto px-4 py-12">

          {/* Hero */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Estetik
              </span>
              <span className="text-slate-500 text-xs">8 dk okuma</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Estetik Uygulamalar Rehberi:<br />
              <span className="text-violet-400">Botoks, Dolgu, PRP ve Daha Fazlası</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Klinik ziyaretinden önce bilmeniz gerekenler: en yaygın estetik uygulamaların nasıl çalıştığı,
              ne kadar sürdüğü ve hangi durumlarda tercih edildiği — kanıta dayalı bilgilerle.
            </p>
          </div>

          {/* Giriş */}
          <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 mb-10 text-sm text-slate-400 leading-relaxed">
            <strong className="text-white">Önemli not:</strong> Bu rehberdeki bilgiler genel bilgilendirme amaçlıdır.
            Hangi uygulamanın size uygun olduğuna ancak yüz yüze muayene yapan bir hekim karar verebilir.
            Estelongy Gençlik Skoru, doğru uygulamayı ve zamanlamayı nesnel bir skor üzerinden takip etmenize yardımcı olur.
          </div>

          {/* Uygulamalar */}
          <div className="space-y-10">
            {APPS.map((app, i) => (
              <section key={app.id} id={app.id} className="scroll-mt-20">
                <div className={`rounded-2xl border ${app.border} ${app.bg} p-6`}>
                  {/* Başlık */}
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl shrink-0">{app.icon}</span>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-500 text-xs font-mono">0{i + 1}</span>
                      </div>
                      <h2 className="text-white font-black text-xl leading-tight">{app.name}</h2>
                    </div>
                  </div>

                  <p className="text-slate-300 text-sm mb-4 leading-relaxed font-medium italic">
                    &ldquo;{app.summary}&rdquo;
                  </p>

                  {/* Nasıl çalışır */}
                  <div className="mb-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Nasıl Çalışır?</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{app.howItWorks}</p>
                  </div>

                  {/* Kullanım alanları */}
                  <div className="mb-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Kullanım Alanları</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {app.usedFor.map(u => (
                        <li key={u} className="flex items-center gap-2 text-slate-300 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: app.color }} />
                          {u}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Süre bilgisi */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-slate-500 text-xs mb-0.5">Etki Süresi</p>
                      <p className="text-white text-sm font-semibold">{app.duration}</p>
                    </div>
                    <div className="bg-slate-900/50 rounded-xl p-3">
                      <p className="text-slate-500 text-xs mb-0.5">Etki Başlangıcı</p>
                      <p className="text-white text-sm font-semibold">{app.onset}</p>
                    </div>
                  </div>

                  {/* Not */}
                  <div className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                    <span className="shrink-0 mt-0.5">💡</span>
                    <span>{app.note}</span>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Hangi uygulamayı seçmeli */}
          <section className="mt-12">
            <h2 className="text-white font-black text-2xl mb-4">Hangi Uygulamayı Seçmeli?</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Doğru estetik uygulama seçimi cilt tipinize, yaşınıza, hedeflerinize ve mevcut cilt durumunuza göre farklılık gösterir.
              Tek bir &ldquo;herkese uygun&rdquo; çözüm yoktur. Bu nedenle Estelongy, <strong className="text-white">nesnel bir Gençlik Skoru</strong> üzerinden
              sizi doğru kliniğe ve doğru zamana yönlendirmeyi hedefler.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 text-sm">
              {[
                { goal: 'Mimik kırışıklıklarını azaltmak', rec: 'Botoks', color: '#a78bfa' },
                { goal: 'Hacim kaybını doldurmak', rec: 'HA Dolgu', color: '#60a5fa' },
                { goal: 'Cilt kalitesini artırmak', rec: 'PRP + Mezoterapi', color: '#34d399' },
              ].map(item => (
                <div key={item.goal} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <p className="text-slate-400 text-xs mb-1">Hedefiniz:</p>
                  <p className="text-white font-medium mb-2">{item.goal}</p>
                  <p className="text-xs font-bold" style={{ color: item.color }}>→ {item.rec}</p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-violet-600/20 to-purple-600/10 border border-violet-500/30 text-center">
            <h2 className="text-white font-black text-xl mb-2">
              Gençlik Skoru ile İhtiyacını Belirle
            </h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Hangi uygulamayı, ne zaman yapacağını anlamak için önce Gençlik Skorunuzu öğrenin.
              Klinik hekim değerlendirmesiyle birleşince doğru protokol oluşur.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/kayit?next=/analiz"
                className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity"
              >
                Ücretsiz Ön Analiz →
              </Link>
              <Link
                href="/randevu"
                className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-colors"
              >
                Klinik Randevusu Al
              </Link>
            </div>
          </div>

          {/* Diğer makaleler */}
          <div className="mt-12 pt-8 border-t border-slate-800">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Diğer Rehberler</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: '/rehber/cihaz-tedavileri', label: 'Cihaz Tedavileri', icon: '⚡' },
                { href: '/rehber/longevity-nedir', label: 'Longevity Nedir?', icon: '🧬' },
                { href: '/rehber/genclik-skoru-nasil-hesaplanir', label: 'Gençlik Skoru Nasıl Hesaplanır?', icon: '📊' },
              ].map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm transition-all"
                >
                  <span>{l.icon}</span>
                  <span className="font-medium">{l.label}</span>
                </Link>
              ))}
            </div>
          </div>

        </article>
      </main>
    </>
  )
}
