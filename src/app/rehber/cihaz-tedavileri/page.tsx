import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cihaz ile Estetik Tedaviler: HIFU, Radyofrekans, Dermapen, Lazer | Estelongy',
  description: 'HIFU, radyofrekans, dermapen, fraksiyonel lazer ve kriyo uygulamaları: nasıl çalışırlar, kimlere uygundurlar ve ne zaman tercih edilmeli? Kapsamlı cihaz tedavileri rehberi.',
  keywords: ['HIFU nedir', 'radyofrekans tedavisi', 'dermapen', 'fraksiyonel lazer', 'cihaz estetik', 'invaziv olmayan yüz germe', 'kolajen uyarımı'],
  openGraph: {
    title: 'Cihaz ile Estetik Tedaviler: HIFU, RF, Dermapen | Estelongy',
    description: 'İğnesiz, kesisiz estetik tedaviler nasıl çalışır? HIFU, radyofrekans ve dermapen karşılaştırması.',
    url: 'https://estelongy.com/rehber/cihaz-tedavileri',
  },
  alternates: { canonical: 'https://estelongy.com/rehber/cihaz-tedavileri' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Cihaz ile Estetik Tedaviler: HIFU, Radyofrekans, Dermapen, Lazer',
  description: 'HIFU, radyofrekans, dermapen ve lazer uygulamalarının kapsamlı rehberi.',
  author: { '@type': 'Organization', name: 'Estelongy' },
  publisher: { '@type': 'Organization', name: 'Estelongy', url: 'https://estelongy.com' },
  url: 'https://estelongy.com/rehber/cihaz-tedavileri',
  inLanguage: 'tr',
}

const DEVICES = [
  {
    id: 'hifu',
    name: 'HIFU (Yüksek Yoğunluklu Odaklı Ultrason)',
    icon: '〰️',
    color: '#60a5fa',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    mechanism: 'Ultrason dalgaları deri yüzeyine zarar vermeden SMAS katmanına (derin fasyaya) odaklanır. 65–70°C ısı noktaları oluşturarak kolajen liflerinin kasılmasını ve yeni kolajen yapımını tetikler.',
    benefits: ['Yüz ve boyun germe', 'Kaş kaldırma etkisi', 'Çene hattı sıkılaştırma', 'Dekolte iyileştirme', 'Karın ve diz çevresi sıkılaştırma'],
    sessions: '1–2 seans / yıl',
    recovery: 'Neredeyse yok (hafif kızarıklık geçici)',
    onset: '2–3 ay (kolajen oluşum süreci)',
    who: 'Orta derecede sarkma, 30+ yaş, ameliyat istemeyen hastalar',
    caution: 'Aktif akne, implant veya dolgu olan bölgeler için dikkatli değerlendirme gerektirir.',
    egp: 8.5,
  },
  {
    id: 'rf',
    name: 'Radyofrekans (RF) / Thermage',
    icon: '🌀',
    color: '#f97316',
    bg: 'bg-orange-500/10',
    border: 'border-orange-500/20',
    mechanism: 'Radyofrekans dalgaları deri içindeki su moleküllerini titreştirerek ısı üretir. Bu kontrollü ısı; mevcut kolajeni kısmen denatüre ederek kasılma sağlar, uzun vadede yeni kolajen sentezini uyarır.',
    benefits: ['Cilt sıkılaştırma', 'Gözenek küçültme', 'İnce kırışıklık azaltma', 'Selülit iyileştirme (vücut)', 'Göz çevresi sıkılaştırma'],
    sessions: '1–3 seans (cihaza göre)',
    recovery: 'Yok; günlük hayata anında dönüş',
    onset: '3–6 ay (progresif kolajen remodelingi)',
    who: 'Erken sarkma belirtileri, cilt kalitesini iyileştirmek isteyenler',
    caution: 'Pace-maker, metal implant taşıyan hastalarda kontraendike. Hamilelikte önerilmez.',
    egp: 7.8,
  },
  {
    id: 'dermapen',
    name: 'Dermapen / Mikro-İğneleme (MNA)',
    icon: '🔬',
    color: '#a78bfa',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    mechanism: 'Çok sayıda ince iğne deriye mikroskobik kanallar açar. Bu kontrollü yaralama yanıtı; büyüme faktörlerini ve kolajen üretimini aktive eder. Kanallar aynı zamanda serum emilimini dramatik biçimde artırır.',
    benefits: ['Akne izleri ve skarlar', 'Cilt dokusu iyileştirme', 'Gözenek görünümü', 'Stria (çatlaklar)', 'Saç dökülmesi (saçlı deri PRP ile)'],
    sessions: '3–6 seans / 4 haftada bir',
    recovery: '24–48 saat kızarıklık',
    onset: '4–6 hafta, birden fazla seans gerektirir',
    who: 'Akne izi, doku bozuklukları, gençleştirme isteyen geniş yaş grubu',
    caution: 'Aktif akne, rozasea, iyileşmemiş yara veya infeksiyon bölgelerine uygulanmaz.',
    egp: 7.2,
  },
  {
    id: 'lazer',
    name: 'Lazer Tedavileri (Fraksiyonel / Ablative)',
    icon: '🔦',
    color: '#f59e0b',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    mechanism: 'Lazer ışığı belirli dalga boyunda deri hedeflerine (melanin, hemoglobin, su) seçici olarak emilir. Fraksiyonel lazer mikro bölgeler yaratırken çevre dokuyu korur. Ablative lazerler deri yüzeyini kaldırarak daha dramatik yenileme sağlar.',
    benefits: ['Pigmentasyon ve lekeler (Q-Switch)', 'Yüz kızarıklığı ve damarlar (Nd:YAG, KTP)', 'Derin kırışıklıklar (CO2 ablative)', 'Akne izleri (fraksiyonel)', 'Cilt yenileme ve parlaklık'],
    sessions: 'Leke: 1–5 seans | Derin kırışıklık: 1–2 seans',
    recovery: 'Yüzeysel: 3–5 gün | Ablative: 7–14 gün',
    onset: '2–4 hafta sonrası',
    who: 'Pigmentasyon, damarsal sorunlar veya derin kırışıklık hedefleri',
    caution: 'Esmer tenlerde yanlış dalga boyu seçimi paradoks hiperpigmentasyona yol açabilir. Güneş koruma zorunludur.',
    egp: 7.6,
  },
  {
    id: 'kriyoterapi',
    name: 'Kriyoterapi (Soğuk Uygulama)',
    icon: '❄️',
    color: '#67e8f9',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/20',
    mechanism: 'Aşırı soğuk (–100 ile –160°C arası hava veya nitrojen) kısa süre uygulanarak cilt kan akımını önce kısıtlar, sonra yoğun bir şekilde artırır. Bu termal şok; antiinflamatuar yanıtı, kolajen sentezini ve cilt yenilenmesini destekler.',
    benefits: ['Cilt sıkılaştırma ve parlaklık', 'Gözenek görünümü', 'Lokalize yağ azaltma (kriyolipoliz)', 'Kızarıklık ve inflamasyonu yatıştırma', 'Akne sonrası dönem'],
    sessions: '4–8 seans / haftalık',
    recovery: 'Yok',
    onset: '4–6 seans sonrası fark edilir',
    who: 'Cilt tazlama, akne sonrası hassas deri, genel yaşlanma karşıtı bakım',
    caution: 'Soğuk ürtikeri, Raynaud sendromu veya soğuk allerjisi olanlarda kontrendike.',
    egp: 6.5,
  },
]

export default function CihazTedavileriPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
        <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
          <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-500 hover:text-white transition-colors">Estelongy</Link>
            <span className="text-slate-700">›</span>
            <Link href="/rehber" className="text-slate-500 hover:text-white transition-colors">Gençlik Rehberi</Link>
            <span className="text-slate-700">›</span>
            <span className="text-white font-medium truncate">Cihaz Tedavileri</span>
          </div>
        </header>

        <article className="max-w-3xl mx-auto px-4 py-12">

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Cihaz Tedavileri
              </span>
              <span className="text-slate-500 text-xs">7 dk okuma</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Cihaz ile Yapılan Estetik Tedaviler:<br />
              <span className="text-blue-400">HIFU, RF, Dermapen ve Lazer</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              İğnesiz ve kesisiz estetik tedaviler giderek yaygınlaşıyor. Bu rehber; en sık kullanılan cihaz
              tedavilerinin mekanizmasını, hangi durumlar için uygun olduğunu ve beklentileri gerçekçi biçimde
              aktarır.
            </p>
          </div>

          {/* Cihaz vs Enjeksiyon karşılaştırma kutusu */}
          <div className="grid grid-cols-2 gap-4 mb-10 text-sm">
            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <p className="text-blue-400 font-bold mb-2">⚡ Cihaz Tedavileri</p>
              <ul className="space-y-1 text-slate-400">
                <li>→ İğne veya kesi yok</li>
                <li>→ Kolajen uyarımı (uzun vadeli)</li>
                <li>→ Etki kademeli gelişir</li>
                <li>→ Düşük iyileşme süresi</li>
              </ul>
            </div>
            <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
              <p className="text-violet-400 font-bold mb-2">💉 Enjeksiyon Tedavileri</p>
              <ul className="space-y-1 text-slate-400">
                <li>→ Hızlı ve görünür sonuç</li>
                <li>→ Hacim ve kas hedefler</li>
                <li>→ Reversibl (dolgu için)</li>
                <li>→ Seans sayısı daha az</li>
              </ul>
            </div>
          </div>

          <div className="space-y-10">
            {DEVICES.map((dev, i) => (
              <section key={dev.id} id={dev.id} className="scroll-mt-20">
                <div className={`rounded-2xl border ${dev.border} ${dev.bg} p-6`}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-3xl shrink-0">{dev.icon}</span>
                    <div>
                      <span className="text-slate-500 text-xs font-mono">0{i + 1}</span>
                      <h2 className="text-white font-black text-xl leading-tight">{dev.name}</h2>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1.5">Mekanizma</h3>
                    <p className="text-slate-300 text-sm leading-relaxed">{dev.mechanism}</p>
                  </div>

                  <div className="mb-4">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Neler İyileşiyor?</h3>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {dev.benefits.map(b => (
                        <li key={b} className="flex items-center gap-2 text-slate-300 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dev.color }} />
                          {b}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs">
                    {[
                      { label: 'Seans', val: dev.sessions },
                      { label: 'İyileşme', val: dev.recovery },
                      { label: 'Etki Başlangıcı', val: dev.onset },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-900/50 rounded-lg p-2.5 col-span-1">
                        <p className="text-slate-500 mb-0.5">{item.label}</p>
                        <p className="text-white font-semibold text-xs">{item.val}</p>
                      </div>
                    ))}
                    <div className="bg-slate-900/50 rounded-lg p-2.5 col-span-1">
                      <p className="text-slate-500 mb-0.5 text-xs">Uygun Profil</p>
                      <p className="text-white font-semibold text-xs leading-snug">{dev.who}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 text-xs text-amber-400/80 leading-relaxed bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                    <span className="shrink-0">⚠️</span>
                    <span>{dev.caution}</span>
                  </div>
                </div>
              </section>
            ))}
          </div>

          {/* Kombinasyon tedavileri */}
          <section className="mt-12">
            <h2 className="text-white font-black text-2xl mb-4">Kombinasyon Protokolleri</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-5">
              Gerçek hayatta en iyi sonuçlar genellikle tek bir cihazla değil, birbirini tamamlayan tedavilerin
              stratejik kombinasyonuyla elde edilir. Klinik ortamda, hekim değerlendirmesiyle belirlenen bu
              protokoller Gençlik Skoru takibiyle nesnel olarak ölçülebilir.
            </p>
            <div className="space-y-3">
              {[
                { combo: 'HIFU + HA Dolgu', goal: 'Sarkma + hacim kaybı', desc: 'HIFU derin kaldırma sağlarken dolgu kaybolan hacmi tamamlar.' },
                { combo: 'RF + Dermapen + PRP', goal: 'Doku kalitesi', desc: 'RF kolajen uyarır, dermapen emilimi artırır, PRP büyüme faktörü sağlar.' },
                { combo: 'Lazer (leke) + Kimyasal Peeling', goal: 'Pigmentasyon', desc: 'Farklı derinliklerde çalışan iki yaklaşım pigment temizliğini güçlendirir.' },
              ].map(c => (
                <div key={c.combo} className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700 text-sm">
                  <div className="shrink-0 text-right">
                    <p className="text-white font-bold">{c.combo}</p>
                    <p className="text-slate-500 text-xs">{c.goal}</p>
                  </div>
                  <div className="w-px bg-slate-700 shrink-0" />
                  <p className="text-slate-400 leading-relaxed">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/30 text-center">
            <h2 className="text-white font-black text-xl mb-2">
              Hangi Tedaviye İhtiyacın Var?
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              Gençlik Skoru analizi ile cilt durumunuzu objectif olarak ölçün.
              Klinik hekim hangi cihaz protokolünün uygun olduğuna nesnel bir zemine dayanarak karar versin.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/kayit?next=/analiz" className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                Ücretsiz Ön Analiz →
              </Link>
              <Link href="/randevu" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-colors">
                Klinik Randevusu Al
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Diğer Rehberler</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: '/rehber/estetik-uygulamalar', label: 'Estetik Uygulamalar', icon: '💉' },
                { href: '/rehber/longevity-nedir', label: 'Longevity Nedir?', icon: '🧬' },
                { href: '/rehber/genclik-skoru-nasil-hesaplanir', label: 'Gençlik Skoru Nasıl Hesaplanır?', icon: '📊' },
              ].map(l => (
                <Link key={l.href} href={l.href} className="flex items-center gap-2 p-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white text-sm transition-all">
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
