import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Longevity Nedir? Biyolojik Yaşlanmanın Bilimi ve Anti-Aging Protokolleri | Estelongy',
  description: 'Longevity bilimi, biyolojik yaş ile kronolojik yaş farkı, telomer kısalması, serbest radikaller ve günümüzde kanıtlanmış yaşlanma karşıtı protokoller. Gerçek longevity neden sadece görünümden ibaret değil?',
  keywords: ['longevity nedir', 'biyolojik yaş', 'anti aging', 'telomer', 'NAD+', 'yaşlanma mekanizmaları', 'uzun ömür', 'longevity protokolü'],
  openGraph: {
    title: 'Longevity Nedir? Biyolojik Yaşlanmanın Bilimi | Estelongy',
    description: 'Telomer biyolojisi, serbest radikaller, epigenetik saat ve kanıtlı longevity protokolleri.',
    url: 'https://estelongy.com/rehber/longevity-nedir',
  },
  alternates: { canonical: 'https://estelongy.com/rehber/longevity-nedir' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Longevity Nedir? Biyolojik Yaşlanmanın Bilimi ve Anti-Aging Protokolleri',
  description: 'Longevity bilimi, biyolojik yaş ve kanıtlı yaşlanma karşıtı protokollerin kapsamlı rehberi.',
  author: { '@type': 'Organization', name: 'Estelongy' },
  publisher: { '@type': 'Organization', name: 'Estelongy', url: 'https://estelongy.com' },
  url: 'https://estelongy.com/rehber/longevity-nedir',
  inLanguage: 'tr',
}

export default function LongevityNedirPage() {
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
            <span className="text-white font-medium truncate">Longevity Nedir?</span>
          </div>
        </header>

        <article className="max-w-3xl mx-auto px-4 py-12">

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Longevity
              </span>
              <span className="text-slate-500 text-xs">10 dk okuma</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Longevity Nedir?<br />
              <span className="text-emerald-400">Biyolojik Yaşlanmanın Bilimi</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Longevity; sadece daha uzun yaşamak değil, <strong className="text-white">sağlıklı biçimde daha uzun yaşamaktır.</strong>
              Biyolojik yaşlanma mekanizmalarını anlamak, hangi müdahalelerin gerçekten işe yaradığını ayırt etmenin tek yolu.
            </p>
          </div>

          {/* Fark: biyolojik vs kronolojik */}
          <section className="mb-10" id="biyolojik-yas">
            <h2 className="text-white font-black text-2xl mb-4">Biyolojik Yaş vs. Kronolojik Yaş</h2>
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Kronolojik Yaş</p>
                <p className="text-white text-2xl font-black mb-1">Pasaportunuzdaki yaş</p>
                <p className="text-slate-500 text-sm">Değiştirilemez. Sadece zamanı sayar.</p>
              </div>
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                <p className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">Biyolojik Yaş</p>
                <p className="text-white text-2xl font-black mb-1">Hücrelerinizin gerçek yaşı</p>
                <p className="text-slate-400 text-sm">Ölçülebilir. Ve değiştirilebilir.</p>
              </div>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed">
              Araştırmalar, aynı kronolojik yaştaki iki bireyin biyolojik yaşının <strong className="text-white">10–20 yıl
              fark edebileceğini</strong> gösteriyor. Bu farkı yaratan; genetik yatkınlık (yaklaşık %20),
              yaşam tarzı, beslenme, stres yönetimi ve çevre koşulları (yaklaşık %80).
            </p>
          </section>

          {/* Yaşlanma mekanizmaları */}
          <section className="mb-10" id="mekanizmalar">
            <h2 className="text-white font-black text-2xl mb-6">Yaşlanmanın 4 Temel Mekanizması</h2>
            <div className="space-y-4">
              {[
                {
                  no: '01',
                  title: 'Telomer Kısalması',
                  color: '#f87171',
                  icon: '🧬',
                  desc: 'Her hücre bölünmesinde kromozomların uçlarındaki koruyucu kapaklar (telomerler) biraz kısalır. Telomerler kritik uzunluğun altına düştüğünde hücre ya durur (senesans) ya da ölür. Telomere uzunluğu günümüzde biyolojik yaşın güçlü bir göstergesi kabul edilir.',
                  intervention: 'Düzenli aerobik egzersiz, meditasyon ve kaliteli uyku telomere uzunluğunu korumaya yardımcı olur.',
                },
                {
                  no: '02',
                  title: 'Serbest Radikal (Oksidatif Stres) Hasarı',
                  color: '#fbbf24',
                  icon: '⚡',
                  desc: 'Metabolizma sırasında oluşan reaktif oksijen türleri (ROS); DNA\'yı, proteinleri ve hücre zarını hasarlar. Antioksidan savunma sistemi bu hasarı onarır, ancak yaşla birlikte bu kapasite azalır. Ciltte dışarıdan görülen oksidatif stres: pigmentasyon, esneklik kaybı, ince çizgiler.',
                  intervention: 'Renkli sebze ve meyveler, C vitamini, E vitamini, astaksantin, koenzim Q10.',
                },
                {
                  no: '03',
                  title: 'Kronik Düşük Dereceli İnflamasyon ("Inflammaging")',
                  color: '#f97316',
                  icon: '🔥',
                  desc: '"Inflammaging" — yaşlanmayla birlikte kronik ve düşük yoğunluklu bir inflamasyon durumunun sürekli devam etmesi. Kalp hastalığı, diyabet, Alzheimer ve kanserle ilişkilendirilir. Ciltte: kızarıklık, hassasiyet, kolajen yıkımı hızlanması.',
                  intervention: 'Anti-inflamatuar beslenme (Akdeniz diyeti), omega-3, curcumin, uyku optimizasyonu.',
                },
                {
                  no: '04',
                  title: 'NAD+ Azalması ve Mitokondrial Disfonksiyon',
                  color: '#34d399',
                  icon: '🔋',
                  desc: 'NAD+ (nikotinamid adenin dinükleotid) hücresel enerji üretiminin merkezindedir. 40\'lı yaşlarda 20\'li yaşlara kıyasla yaklaşık %50 azalır. Mitokondrilerin verimliliği düşer, hücre enerjisi azalır. Bu tükenme ciltte: donuk görünüm, esneklik kaybı, yavaş onarım.',
                  intervention: 'NMN (Nikotinamid Mononükleotid) veya NR (Nikotinamid Ribozid) takviyeleri; egzersiz de NAD+ artırır.',
                },
              ].map(m => (
                <div key={m.no} className="rounded-2xl bg-slate-800/50 border border-slate-700 p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="text-2xl shrink-0">{m.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-slate-600 text-xs font-mono">{m.no}</span>
                        <h3 className="text-white font-black text-lg">{m.title}</h3>
                      </div>
                      <p className="text-slate-400 text-sm leading-relaxed mb-3">{m.desc}</p>
                      <div className="flex gap-2 text-xs bg-slate-900/50 rounded-lg p-3">
                        <span className="font-bold" style={{ color: m.color }}>→ Müdahale:</span>
                        <span className="text-slate-400">{m.intervention}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Kanıtlı longevity protokolleri */}
          <section className="mb-10" id="protokoller">
            <h2 className="text-white font-black text-2xl mb-6">Kanıta Dayalı Longevity Protokolleri</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  category: 'Uyku',
                  icon: '😴',
                  color: '#a78bfa',
                  points: [
                    '7–9 saat düzenli uyku biyolojik yaşı yavaşlatır',
                    'Gece 23:00 öncesi uyku büyüme hormonu sekresyonunu optimize eder',
                    'Uyku sırasında glimfatik sistem beyin atıklarını temizler',
                    'Uyku eksikliği kortizol artışı → kolajen yıkımı hızlanması',
                  ],
                },
                {
                  category: 'Beslenme',
                  icon: '🥗',
                  color: '#34d399',
                  points: [
                    'Kaloriye kısıtlı veya aralıklı oruç; otofajiyi (hücresel temizlik) aktive eder',
                    'Akdeniz diyeti: ömür uzunluğuyla en güçlü ilişkilendirilen diyet',
                    'İşlenmiş şeker ve trans yağ: glycation (şeker-protein bağlanması) → sert kolajen',
                    'Kırmızı renkli sebzeler, yeşil yapraklılar, kuruyemişler: antioksidan yük',
                  ],
                },
                {
                  category: 'Egzersiz',
                  icon: '🏃',
                  color: '#60a5fa',
                  points: [
                    'Haftada 150 dk orta yoğunluklu aerobik: telomere koruma, VO2max artışı',
                    'Direnç antrenmanı: sarkopeniyi (kas kaybı) önler, GH ve IGF-1 uyarır',
                    'HIIT (Yüksek Yoğunluklu Aralıklı Antrenman): mitokondri biyogenezi',
                    'Günlük 8.000–10.000 adım: kardiyometabolik sağlık için temel basamak',
                  ],
                },
                {
                  category: 'Stres Yönetimi',
                  icon: '🧘',
                  color: '#f59e0b',
                  points: [
                    'Kronik stres → kortizol → telomere kısalması, kolajen yıkımı',
                    'Meditasyon ve mindfulness: telomeraz aktivitesini artırabilir (NCI araştırması)',
                    'Sosyal bağlantı; yalnızlık ölüm riskini sigara ile kıyaslanabilir biçimde artırır',
                    'Doğa teması: kortizol düşürücü etki ilk 20 dakikada başlar',
                  ],
                },
                {
                  category: 'Takviyeler (Kanıt Düzeyi Değişken)',
                  icon: '💊',
                  color: '#f87171',
                  points: [
                    'Kollajen peptidler (tip 1): 2.5–5 g/gün → cilt elastikiyeti ve nem',
                    'D vitamini: eksikliği yaygın, cilt ve genel longevity için kritik',
                    'Omega-3 (EPA+DHA): inflamasyon modülasyonu, cilt bariyer güçlendirme',
                    'NMN/NR: NAD+ destekleyici; klinik çalışmalar devam ediyor',
                  ],
                },
                {
                  category: 'Cilt Özel Longevity',
                  icon: '✨',
                  color: '#00d4ff',
                  points: [
                    'SPF 30–50 günlük kullanım: en kanıtlı anti-aging önlem',
                    'Retinoid (A vitamini türevleri): hücre döngüsünü hızlandırır, kolajen uyarır',
                    'Niasinamid: NAD+ öncülü, bariyer güçlendirme, pigmentasyon',
                    'C vitamini serumu (L-askorbik asit): kolajen sentezi için kofaktör',
                  ],
                },
              ].map(p => (
                <div key={p.category} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{p.icon}</span>
                    <h3 className="text-white font-bold" style={{ color: p.color }}>{p.category}</h3>
                  </div>
                  <ul className="space-y-2">
                    {p.points.map((pt, i) => (
                      <li key={i} className="flex gap-2 text-xs text-slate-400 leading-relaxed">
                        <span className="shrink-0 mt-0.5 w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>

          {/* Longevity ve Estelongy bağlantısı */}
          <section className="mb-10" id="estelongy-longevity">
            <h2 className="text-white font-black text-2xl mb-4">Longevity ve Gençlik Skoru</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Estelongy Gençlik Skoru, longevity biliminin estetik yüzüdür. Yüzdeki görünür yaşlanma göstergeleri
              (kırışıklıklar, pigmentasyon, elastikiyet kaybı) aynı zamanda biyolojik yaşlanma sürecinin dışavurumudur.
            </p>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Longevity anketinde sorulan uyku kalitesi, beslenme düzeni ve stres yönetimi soruları; Gençlik Skoru&apos;na
              doğrudan katkı sağlar. <strong className="text-white">İçten dışa, dıştan içe</strong> — hem görünüm hem
              biyolojik sağlık aynı protokolle iyileşir.
            </p>
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm">
              <p className="text-emerald-400 font-bold mb-2">🧬 Longevity → Gençlik Skoru Bağlantısı</p>
              <div className="space-y-1.5 text-slate-400">
                <p>→ Uyku kalitesi iyileşir → kolajen sentezi artar → cilt elastikiyeti yükselir → <strong className="text-white">Skor artar</strong></p>
                <p>→ Oksidatif stres azalır → pigmentasyon düzelir → cilt tonu düzgünleşir → <strong className="text-white">Skor artar</strong></p>
                <p>→ İnflamasyon düşer → kırışıklık gelişimi yavaşlar → görünür yaş geriler → <strong className="text-white">Skor artar</strong></p>
              </div>
            </div>
          </section>

          <div className="mt-10 p-8 rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/30 text-center">
            <h2 className="text-white font-black text-xl mb-2">
              Longevity Anketini Doldurun
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              Uyku, beslenme, stres ve cilt rutini bilgilerinizi girin.
              Gençlik Skoru&apos;na doğrudan katkı sağlayan longevity faktörleri ücretsiz değerlendirilsin.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/kayit?next=/anket" className="px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                Longevity Anketini Doldur →
              </Link>
              <Link href="/kayit?next=/analiz" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-colors">
                Önce Ön Analiz Yap
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Diğer Rehberler</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: '/rehber/estetik-uygulamalar', label: 'Estetik Uygulamalar', icon: '💉' },
                { href: '/rehber/cihaz-tedavileri', label: 'Cihaz Tedavileri', icon: '⚡' },
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
