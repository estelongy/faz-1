import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Estetik Cerrahi İşlemleri Rehberi | Estelongy',
  description: 'Rinoplasti, yüz germe, blefaroplasti, liposuction ve vücut şekillendirme operasyonları hakkında kapsamlı rehber. Kimler için uygun, süreç nasıl işler, nelere dikkat edilmeli?',
  keywords: ['estetik cerrahi', 'rinoplasti', 'yüz germe', 'blefaroplasti', 'liposuction', 'meme estetiği', 'karın germe', 'otoplasti'],
  openGraph: {
    title: 'Estetik Cerrahi İşlemleri Rehberi | Estelongy',
    description: 'Estetik cerrahi prosedürlerini, kimler için uygun olduğunu ve sürecin nasıl işlediğini öğrenin.',
    url: 'https://estelongy.com/rehber/estetik-cerrahi',
  },
  alternates: { canonical: 'https://estelongy.com/rehber/estetik-cerrahi' },
}

const PROCEDURES = [
  {
    group: 'Yüz Cerrahisi',
    color: 'rose',
    items: [
      {
        name: 'Rinoplasti',
        subtitle: 'Burun Estetiği',
        desc: 'Burunun şeklini, boyutunu veya fonksiyonunu düzenleyen cerrahi işlemdir. Estetik kaygıların yanı sıra nefes alma problemlerinde de uygulanır. Genel anestezi altında gerçekleştirilir; iyileşme süreci 2–3 hafta alır.',
        tags: ['Genel Anestezi', '2–3 Hafta İyileşme', 'Kalıcı'],
      },
      {
        name: 'Blefaroplasti',
        subtitle: 'Göz Kapağı Estetiği',
        desc: 'Üst ve/veya alt göz kapaklarındaki fazla deri, yağ ve kasın alınması işlemidir. Yorgun ve yaşlı görünümü ortadan kaldırır. Üst kapak ameliyatı genellikle lokal anestezi ile yapılabilir.',
        tags: ['Lokal / Genel Anestezi', '1–2 Hafta', 'Uzun Süreli'],
      },
      {
        name: 'Yüz Germe',
        subtitle: 'Ritidektomi (Facelift)',
        desc: 'Yüzdeki deri sarkması, derin kırışıklar ve boyun bölgesindeki gevşemeyi gideren kapsamlı bir cerrahi prosedürdür. 40 yaş üzeri bireylerde en belirgin sonuçları verir. Etkisi 7–10 yıl sürebilir.',
        tags: ['Genel Anestezi', '2–4 Hafta', '7–10 Yıl Etkili'],
      },
      {
        name: 'Alın & Kaş Germe',
        subtitle: 'Brow Lift',
        desc: 'Alın bölgesindeki kırışıkları ve düşmüş kaşları yukarı taşıyarak daha dinç ve genç bir ifade kazandırır. Endoskopik yöntemle minimal kesilerle uygulanabilir.',
        tags: ['Genel Anestezi', '1–2 Hafta', 'Kalıcı'],
      },
      {
        name: 'Boyun Germe',
        subtitle: 'Neck Lift',
        desc: 'Boyun altındaki gevşek deri ve yağ birikimini düzenler. Yüz germe ameliyatıyla kombine uygulanabilir. "Türkiye boynu" olarak bilinen görünümü ortadan kaldırır.',
        tags: ['Genel Anestezi', '2–3 Hafta', 'Uzun Süreli'],
      },
      {
        name: 'Otoplasti',
        subtitle: 'Kulak Kepçesi Düzeltme',
        desc: 'Öne çıkmış veya asimetrik kulak kepçelerini düzelten cerrahi işlemdir. Çocuklarda ve yetişkinlerde uygulanabilir. Lokal anestezi ile yapılabilen nispeten kısa bir operasyondur.',
        tags: ['Lokal Anestezi', '1 Hafta', 'Kalıcı'],
      },
    ],
  },
  {
    group: 'Vücut Cerrahisi',
    color: 'purple',
    items: [
      {
        name: 'Liposuction',
        subtitle: 'Yağ Aldırma',
        desc: 'Diyet ve egzersizle giderilemeyen bölgesel yağ birikimlerini vakum yöntemiyle alan cerrahi prosedürdür. Karın, kalça, uyluğa sıklıkla uygulanır. Kilo verme yöntemi değil, şekillendirme ameliyatıdır.',
        tags: ['Genel / Sedasyon', '1–2 Hafta', 'Kalıcı'],
      },
      {
        name: 'Abdominoplasti',
        subtitle: 'Karın Germe',
        desc: 'Karın bölgesindeki fazla deri ve yağı alarak kasları sıkılaştıran cerrahi işlemdir. Özellikle kilo verme veya doğum sonrası oluşan deri sarkmasında etkilidir.',
        tags: ['Genel Anestezi', '3–4 Hafta', 'Kalıcı'],
      },
      {
        name: 'Meme Büyütme',
        subtitle: 'Augmentasyon Mammoplasti',
        desc: 'Silikon veya tuzlu su implantlarla meme hacmini artıran operasyondur. İmplant tipi, boyutu ve yerleşim yeri hastanın anatomisine göre kişiselleştirilir.',
        tags: ['Genel Anestezi', '1–2 Hafta', 'Uzun Süreli'],
      },
      {
        name: 'Meme Dikleştirme',
        subtitle: 'Mastopexi',
        desc: 'Sarkık ve şeklini yitirmiş memeleri yeniden şekillendiren ve yukarı taşıyan cerrahi işlemdir. Gerekirse büyütme veya küçültmeyle kombine uygulanır.',
        tags: ['Genel Anestezi', '2–3 Hafta', 'Uzun Süreli'],
      },
    ],
  },
]

const colorMap: Record<string, { border: string; badge: string; tag: string; dot: string }> = {
  rose:   { border: 'border-rose-500/30',   badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',   tag: 'bg-rose-500/10 text-rose-400',   dot: 'bg-rose-400' },
  purple: { border: 'border-purple-500/30', badge: 'bg-purple-500/15 text-purple-300 border-purple-500/30', tag: 'bg-purple-500/10 text-purple-400', dot: 'bg-purple-400' },
}

export default function EstetikCerrahiPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-white/5 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-3">
          <Link href="/" className="text-slate-400 hover:text-white text-sm transition-colors">← Estelongy</Link>
          <span className="text-slate-700">|</span>
          <Link href="/rehber" className="text-slate-400 hover:text-white text-sm transition-colors">Rehber</Link>
          <span className="text-slate-700">|</span>
          <span className="text-white font-bold text-sm">Estetik Cerrahi</span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-16">

        {/* Hero */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-5">
            <span className="text-4xl">🔬</span>
            <span className="px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold">
              Cerrahi
            </span>
            <span className="text-slate-500 text-sm">10 dk okuma</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-5 leading-tight">
            Estetik Cerrahi<br />
            <span className="bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
              İşlemleri Rehberi
            </span>
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
            Rinoplastiden yüz germeye, liposuction&apos;dan meme estetiğine — en yaygın estetik cerrahi prosedürleri,
            kimler için uygun olduğu ve operasyon sürecinde neler bekleneceği hakkında kapsamlı bir rehber.
          </p>
        </div>

        {/* Uyarı */}
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 mb-12 flex gap-3">
          <span className="text-amber-400 text-lg shrink-0">⚕️</span>
          <p className="text-amber-200/80 text-sm leading-relaxed">
            Bu içerik yalnızca bilgilendirme amaçlıdır, tıbbi tavsiye niteliği taşımaz.
            Herhangi bir cerrahi karar almadan önce mutlaka uzman bir plastik cerrah veya estetik cerrahla görüşün.
          </p>
        </div>

        {/* Prosedür grupları */}
        {PROCEDURES.map(group => {
          const c = colorMap[group.color]
          return (
            <section key={group.group} className="mb-14">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-2 h-6 rounded-full ${c.dot}`} />
                <h2 className="text-2xl font-black text-white">{group.group}</h2>
              </div>
              <div className="space-y-4">
                {group.items.map(proc => (
                  <div key={proc.name}
                    className={`p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:${c.border} transition-all`}>
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <h3 className="text-white font-black text-xl leading-tight">{proc.name}</h3>
                        <p className="text-slate-500 text-sm">{proc.subtitle}</p>
                      </div>
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed mb-4">{proc.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {proc.tags.map(t => (
                        <span key={t} className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${c.tag}`}>
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}

        {/* Cerrahi öncesi dikkat edilmesi gerekenler */}
        <section className="mb-14">
          <h2 className="text-2xl font-black text-white mb-6">Ameliyat Öncesi Bilinmesi Gerekenler</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🩺', title: 'Hekim Seçimi', desc: 'Plastik ve Rekonstrüktif Cerrahi veya Estetik Cerrahi uzmanı, tercihen ilgili derneğe üye bir cerrahla çalışın.' },
              { icon: '💬', title: 'Konsültasyon', desc: 'En az iki farklı cerrahla görüşün. Beklentilerinizi net aktarın, gerçekçi sonuçları öğrenin.' },
              { icon: '🏥', title: 'Tesis Seçimi', desc: 'Operasyonun gerçekleştirileceği klinik veya hastanenin akreditasyonunu ve cerrahi ekibin deneyimini sorgulayın.' },
              { icon: '📋', title: 'Sağlık Durumu', desc: 'Kronik hastalıklar, ilaçlar ve sigara kullanımı ameliyat riskini doğrudan etkiler. Doktorunuzla tam şeffaf olun.' },
            ].map(item => (
              <div key={item.title} className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 flex gap-4">
                <span className="text-2xl shrink-0">{item.icon}</span>
                <div>
                  <h3 className="text-white font-bold mb-1">{item.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Estelongy bağlantısı */}
        <div className="p-8 rounded-3xl bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-violet-500/10 border border-rose-500/20 text-center mb-10">
          <h2 className="text-white font-black text-2xl mb-3">Cerrahi Öncesi Skorunuzu Öğrenin</h2>
          <p className="text-slate-400 mb-6 max-w-lg mx-auto text-sm leading-relaxed">
            Estetik cerrahi planlamadan önce Gençlik Skorunuzu belirleyin. Operasyon sonrası
            skor değişimini klinik olarak belgeleyin.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/kayit?next=/analiz"
              className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20"
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

        {/* Geri */}
        <div className="text-center">
          <Link href="/rehber" className="text-slate-500 hover:text-slate-300 text-sm transition-colors inline-flex items-center gap-2">
            ← Tüm Rehberler
          </Link>
        </div>
      </div>
    </main>
  )
}
