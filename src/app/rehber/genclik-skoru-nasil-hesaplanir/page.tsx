import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estelongy Gençlik Skoru Nasıl Hesaplanır? C250 Formülü ve Metodoloji | Estelongy',
  description: 'C250 formülünün 5 bileşeni, yaş faktörü, longevity anketi katkısı, tetkik parametreleri ve klinik onay süreci. Estelongy Gençlik Skoru metodolojisi şeffaf biçimde açıklanıyor.',
  keywords: ['gençlik skoru hesaplama', 'C250 formülü', 'biyolojik yaş skoru', 'estelongy metodoloji', 'klinik onaylı skor', 'wrinkle score', 'hydration score'],
  openGraph: {
    title: 'Gençlik Skoru Nasıl Hesaplanır? C250 Formülü | Estelongy',
    description: 'C250 formülünün 5 bileşeni ve klinik onay süreci — Gençlik Skoru metodolojisi şeffaf biçimde.',
    url: 'https://estelongy.com/rehber/genclik-skoru-nasil-hesaplanir',
  },
  alternates: { canonical: 'https://estelongy.com/rehber/genclik-skoru-nasil-hesaplanir' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Estelongy Gençlik Skoru Nasıl Hesaplanır? C250 Formülü ve Metodoloji',
  description: 'C250 formülünün 5 bileşeni, yaş faktörü ve klinik onay sürecinin kapsamlı açıklaması.',
  author: { '@type': 'Organization', name: 'Estelongy' },
  publisher: { '@type': 'Organization', name: 'Estelongy', url: 'https://estelongy.com' },
  url: 'https://estelongy.com/rehber/genclik-skoru-nasil-hesaplanir',
  inLanguage: 'tr',
}

const COMPONENTS = [
  { name: 'Hidrasyon', key: 'hydration',        weight: 25, direction: 'Yüksek = İyi', color: '#60a5fa', icon: '💧',
    desc: 'Cilt yüzeyindeki nem içeriğini ölçer. Düşük hidrasyon; donuk görünüm, ince çizgilerin belirginleşmesi ve bariyer bütünlüğünün bozulmasıyla ilişkilidir.' },
  { name: 'Ton Homojenliği', key: 'tone_uniformity', weight: 25, direction: 'Yüksek = İyi', color: '#a78bfa', icon: '🎨',
    desc: 'Cilt renginin tutarlılığını değerlendirir. Lekeler, kızarıklık, güneş hasarı veya pigmentasyon bozuklukları ton homojenliğini düşürür.' },
  { name: 'Kırışıklıklar', key: 'wrinkles',      weight: 25, direction: 'Ters (100 − değer)', color: '#f87171', icon: '〰️',
    desc: 'Kırışıklık derinliği ve yoğunluğu ölçülür; formülde ters çevrilerek (100 − skor) işlenir. Kırışıklık az olduğunda bu bileşen yüksek puan verir.' },
  { name: 'Pigmentasyon', key: 'pigmentation',   weight: 15, direction: 'Ters (100 − değer)', color: '#fbbf24', icon: '☀️',
    desc: 'Güneş lekeleri, hiperpigmentasyon ve melazma gibi pigmentasyon düzensizliklerini değerlendirir. Formülde ters çevrilerek işlenir.' },
  { name: 'Göz Altı Bölge', key: 'under_eye',   weight: 10, direction: 'Yüksek = İyi', color: '#34d399', icon: '👁️',
    desc: 'Göz altı morluğu, dolgunluk ve çukurluk değerlendirmesi. Göz çevresi bölge, yüzün genel gençlik algısını orantısız biçimde etkiler.' },
]

const SCORE_ZONES = [
  { range: '0 – 55',  label: 'Çok Düşük', color: '#ef4444', bg: 'bg-red-500/10',     border: 'border-red-500/20',    text: 'text-red-400' },
  { range: '56 – 65', label: 'Düşük',     color: '#f97316', bg: 'bg-orange-500/10',  border: 'border-orange-500/20', text: 'text-orange-400' },
  { range: '66 – 79', label: 'Normal',    color: '#f59e0b', bg: 'bg-amber-500/10',   border: 'border-amber-500/20',  text: 'text-amber-400' },
  { range: '80 – 89', label: 'İyi',       color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',text: 'text-emerald-400' },
  { range: '90 – 100',label: 'Harika',    color: '#00d4ff', bg: 'bg-sky-500/10',     border: 'border-sky-500/20',    text: 'text-sky-400' },
]

export default function GenclikSkoruNasilHesaplanirPage() {
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
            <Link href="/rehber" className="text-slate-500 hover:text-white transition-colors">Rehber</Link>
            <span className="text-slate-700">›</span>
            <span className="text-white font-medium truncate">Gençlik Skoru Nasıl Hesaplanır?</span>
          </div>
        </header>

        <article className="max-w-3xl mx-auto px-4 py-12">

          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Gençlik Skoru
              </span>
              <span className="text-slate-500 text-xs">6 dk okuma</span>
            </div>
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              Estelongy Gençlik Skoru<br />
              <span className="text-amber-400">Nasıl Hesaplanır?</span>
            </h1>
            <p className="text-slate-400 text-lg leading-relaxed">
              Şeffaflık ilkemiz gereği Gençlik Skoru&apos;nun her bileşeni, ağırlığı ve hesaplama adımı
              açık biçimde paylaşılmaktadır. Siyah kutu yok, gizemli formül yok.
            </p>
          </div>

          {/* Genel akış */}
          <section className="mb-10" id="genel-akis">
            <h2 className="text-white font-black text-2xl mb-4">Genel Hesaplama Akışı</h2>
            <div className="space-y-3">
              {[
                { step: '01', label: 'GPT-4 Vision Analizi', color: '#a78bfa', desc: 'Yüklenen selfie; GPT-4o Vision modeline gönderilir. Model 5 cilt bileşenini 0–100 arasında skorlar.' },
                { step: '02', label: 'C250 Formülü', color: '#60a5fa', desc: 'Bileşen skorları ağırlıklı olarak birleştirilerek ham C250 skoru hesaplanır.' },
                { step: '03', label: 'Yaş Faktörü Düzeltmesi', color: '#34d399', desc: 'Kronolojik yaşa göre beklenti düzeltmesi yapılır. 25 yaş altı hafif avantaj, 55 yaş üstü hafif dezavantaj.' },
                { step: '04', label: 'Longevity Anketi Katkısı (opsiyonel)', color: '#fbbf24', desc: 'Yaşam tarzı soruları tamamlanmışsa 0–10 puana kadar katkı eklenir.' },
                { step: '05', label: 'Klinik Akış (opsiyonel)', color: '#f97316', desc: 'Klinik anketi ve tetkik verileri skoru rafine eder. Hekim tüm bileşenleri görüp onaylar.' },
                { step: '06', label: 'Klinik Onaylı Final Skor', color: '#00d4ff', desc: 'Final = (Ara toplam × 0.85) + (Hekim değerlendirmesi × 0.15). Sertifika yayınlanır.' },
              ].map(s => (
                <div key={s.step} className="flex gap-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0" style={{ background: `${s.color}20`, color: s.color }}>
                    {s.step}
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm mb-0.5" style={{ color: s.color }}>{s.label}</p>
                    <p className="text-slate-400 text-sm">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* C250 formülü */}
          <section className="mb-10" id="c250">
            <h2 className="text-white font-black text-2xl mb-2">C250 Formülü: 5 Bileşen</h2>
            <p className="text-slate-400 text-sm mb-6">
              C250; Estelongy&apos;nin geliştirdiği ağırlıklı bileşik skor formülüdür.
              Ağırlıklar cilt yaşlanma araştırmalarından elde edilen görece önem sırasına göre belirlenmiştir.
            </p>

            {/* Ağırlık bar chart */}
            <div className="mb-6 p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
              <div className="space-y-3">
                {COMPONENTS.map(c => (
                  <div key={c.key}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{c.icon}</span>
                        <span className="text-white text-sm font-semibold">{c.name}</span>
                        <span className="text-slate-500 text-xs">{c.direction}</span>
                      </div>
                      <span className="text-sm font-black" style={{ color: c.color }}>%{c.weight}</span>
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${c.weight * 4}%`, background: c.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bileşen detayları */}
            <div className="space-y-4">
              {COMPONENTS.map(c => (
                <div key={c.key} className="flex gap-3 p-4 rounded-xl bg-slate-800/40 border border-slate-700">
                  <span className="text-2xl shrink-0">{c.icon}</span>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-white font-bold text-sm">{c.name}</p>
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{ background: `${c.color}20`, color: c.color }}>%{c.weight}</span>
                    </div>
                    <p className="text-slate-400 text-xs leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Formül kutusu */}
            <div className="mt-6 p-5 rounded-2xl bg-slate-900 border border-slate-700 font-mono text-sm">
              <p className="text-slate-500 text-xs mb-3">C250 Ham Skor Formülü</p>
              <p className="text-white leading-relaxed">
                C250 = (hydration × <span className="text-blue-400">0.25</span>)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (tone_uniformity × <span className="text-violet-400">0.25</span>)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ ((100 − wrinkles) × <span className="text-red-400">0.25</span>)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ ((100 − pigmentation) × <span className="text-amber-400">0.15</span>)<br />
                &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ (under_eye × <span className="text-emerald-400">0.10</span>)
              </p>
            </div>
          </section>

          {/* Yaş faktörü */}
          <section className="mb-10" id="yas-faktoru">
            <h2 className="text-white font-black text-2xl mb-4">Yaş Faktörü Düzeltmesi</h2>
            <p className="text-slate-400 text-sm mb-4 leading-relaxed">
              Aynı skoru 25 yaşındaki ve 55 yaşındaki biri aldığında gerçek anlamları farklıdır.
              Yaş faktörü bu beklenti farkını normalize eder:
            </p>
            <div className="grid grid-cols-5 gap-2 text-center text-xs">
              {[
                { age: '≤25', factor: '1.02', color: '#00d4ff', note: 'Hafif bonus' },
                { age: '≤35', factor: '1.00', color: '#22c55e', note: 'Referans' },
                { age: '≤45', factor: '0.97', color: '#f59e0b', note: 'Hafif düzeltme' },
                { age: '≤55', factor: '0.93', color: '#f97316', note: 'Orta düzeltme' },
                { age: '56+', factor: '0.88', color: '#f87171', note: 'Beklenti düzeltmesi' },
              ].map(y => (
                <div key={y.age} className="p-3 rounded-xl bg-slate-800/50 border border-slate-700">
                  <p className="text-slate-400 mb-1">{y.age} yaş</p>
                  <p className="text-xl font-black" style={{ color: y.color }}>×{y.factor}</p>
                  <p className="text-slate-600 text-[10px] mt-1">{y.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Klinik skor zinciri */}
          <section className="mb-10" id="klinik-zincir">
            <h2 className="text-white font-black text-2xl mb-4">Klinik Onay Süreci</h2>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">
              Klinik ortamında alınan ek veriler skoru rafine eder.
              Atlanan her basamak skor hesabını etkilemez — akış yine de devam eder.
            </p>

            <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700 font-mono text-xs space-y-2">
              <p className="text-slate-500">{'// Örnek hesaplama'}</p>
              <p><span className="text-blue-400">c250_ön</span>       = <span className="text-white">75</span>  <span className="text-slate-600">{'// GPT-4 Vision sonucu'}</span></p>
              <p><span className="text-violet-400">c250_ileri</span>   = <span className="text-white">82</span>  <span className="text-slate-600">{'// Klinikteki yeniden analiz (75\'in yerini alır)'}</span></p>
              <p><span className="text-amber-400">hasta_anket</span>   = <span className="text-white">+1</span></p>
              <p><span className="text-orange-400">klinik_anket</span> = <span className="text-white">+5</span>  <span className="text-slate-600">{'// hasta anketini replace eder'}</span></p>
              <p><span className="text-emerald-400">tetkik</span>      = <span className="text-white">+0</span>  <span className="text-slate-600">{'// atlandı'}</span></p>
              <p className="border-t border-slate-700 pt-2"><span className="text-white">ara_toplam</span>   = 82 + 1 - 1 + 5 + 0 = <span className="text-amber-400">87</span></p>
              <p><span className="text-slate-500">×0.85</span>        = <span className="text-white">73.95</span></p>
              <p><span className="text-cyan-400">hekim_puani</span>  = <span className="text-white">78 × 0.15 = 11.7</span></p>
              <p className="border-t border-slate-700 pt-2 text-base">
                <span className="text-[#00d4ff] font-black">FINAL = 85.65</span>
                <span className="text-slate-500 text-xs ml-2">← Klinik Onaylı Gençlik Skoru</span>
              </p>
            </div>
          </section>

          {/* Bölgeler */}
          <section className="mb-10" id="bolgeler">
            <h2 className="text-white font-black text-2xl mb-4">5 Bölge: Skor Ne Anlama Geliyor?</h2>
            <div className="space-y-2">
              {SCORE_ZONES.map(z => (
                <div key={z.label} className={`flex items-center gap-4 p-4 rounded-xl border ${z.border} ${z.bg}`}>
                  <div className="w-24 text-center">
                    <p className="text-xs text-slate-500 mb-0.5">{z.range}</p>
                    <p className={`font-black text-lg ${z.text}`}>{z.label}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-700" />
                  <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${parseInt(z.range.split('–')[1]) + 1}%`,
                      background: `linear-gradient(90deg, #1e293b, ${z.color})`,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Neden güvenilir */}
          <section className="mb-10">
            <h2 className="text-white font-black text-2xl mb-4">Neden Güvenilir?</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              {[
                { icon: '🔍', title: 'Şeffaf Formül', desc: 'Her ağırlık ve adım açık kaynaklı olarak yayınlanmaktadır.' },
                { icon: '👨‍⚕️', title: 'Hekim Onayı Zorunlu', desc: 'Klinik Onaylı Gençlik Skoru yalnızca hekim değerlendirmesiyle oluşur.' },
                { icon: '📈', title: 'Takip Edilebilir', desc: '6 ayda bir yeniden ölçümle ilerlemeniz objektif biçimde görünür.' },
              ].map(c => (
                <div key={c.title} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                  <span className="text-2xl">{c.icon}</span>
                  <p className="text-white font-bold mt-2 mb-1">{c.title}</p>
                  <p className="text-slate-400 text-xs">{c.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <div className="mt-6 p-8 rounded-2xl bg-gradient-to-br from-amber-600/20 to-orange-600/10 border border-amber-500/30 text-center">
            <h2 className="text-white font-black text-xl mb-2">
              Kendi Gençlik Skorunuzu Öğrenin
            </h2>
            <p className="text-slate-400 text-sm mb-5">
              Ücretsiz Ön Analiz ile C250 formülü cildinizdeki yaşlanma göstergelerini anında puanlar.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/kayit?next=/analiz" className="px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold rounded-xl hover:opacity-90 transition-opacity">
                Analizi Başlat →
              </Link>
              <Link href="/randevu" className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-600 transition-colors">
                Klinik Onayına Ulaş
              </Link>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-slate-800">
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Diğer Rehberler</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { href: '/rehber/estetik-uygulamalar', label: 'Estetik Uygulamalar', icon: '💉' },
                { href: '/rehber/cihaz-tedavileri', label: 'Cihaz Tedavileri', icon: '⚡' },
                { href: '/rehber/longevity-nedir', label: 'Longevity Nedir?', icon: '🧬' },
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
