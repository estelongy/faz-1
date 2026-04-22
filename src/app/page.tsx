import Link from 'next/link'
import Footer from '@/components/Footer'
import ScoreBar from '@/components/ScoreBar'

const SCORE_ZONES = [
  { label: 'Çok Düşük', range: '0 – 55',  color: '#ef4444', bg: 'bg-red-500/10',     border: 'border-red-500/20',    text: 'text-red-400',    desc: 'Gençlik Skoru çok düşük' },
  { label: 'Düşük',     range: '56 – 65', color: '#a855f7', bg: 'bg-purple-500/10',  border: 'border-purple-500/20', text: 'text-purple-400', desc: 'Gençlik Skoru düşük' },
  { label: 'Normal',    range: '66 – 79', color: '#eab308', bg: 'bg-yellow-500/10',  border: 'border-yellow-500/20', text: 'text-yellow-400', desc: 'Normal aralıkta' },
  { label: 'İyi',       range: '80 – 89', color: '#22c55e', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',text: 'text-emerald-400',desc: 'Gençlik Skoru iyi' },
  { label: 'Çok İyi',   range: '90 – 100',color: '#3b82f6', bg: 'bg-blue-500/10',    border: 'border-blue-500/20',   text: 'text-blue-400',   desc: 'Olağanüstü Gençlik Skoru' },
]

const STEPS = [
  {
    num: '01',
    color: 'from-violet-500 to-purple-600',
    title: 'Selfie Yükle',
    desc: 'Tek bir fotoğraf yeterli. Yüzünüzdeki yaşlanma göstergelerinden ön analiziniz üretilir.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    num: '02',
    color: 'from-amber-500 to-orange-500',
    title: 'Gençlik Skorunu Al',
    desc: 'Cildinizin gerçek biyolojik yaşını gösteren 0-100 arası Estelongy Gençlik Skoru hesaplanır.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    num: '03',
    color: 'from-emerald-500 to-teal-600',
    title: 'Yaşam Tarzı Anketi',
    desc: 'Uyku, beslenme ve stres alışkanlıklarınızı girerek skorunuzu artırın.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
  },
  {
    num: '04',
    color: 'from-blue-500 to-cyan-600',
    title: 'Klinik Onayı',
    desc: 'Uzman hekim tarafından doğrulanmış, damgalı "Klinik Onaylı Estelongy Gençlik Skoru" kartınızı paylaşın.',
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

const CLINIC_FEATURES = [
  { icon: '🎯', title: 'Sadece Gelen Müşteri', desc: 'Randevu başına değil, klinik kabul anında jeton düşer. No-show = sıfır maliyet.' },
  { icon: '📊', title: 'Hasta Gençlik Skoru Takibi', desc: 'Her hastanın skor geçmişi, ön analiz detayları ve klinik notları tek ekranda.' },
  { icon: '🔬', title: 'Hekim Onay Sistemi', desc: 'Anket + tetkik + hekim değerlendirmesiyle bilimsel olarak doğrulanmış final skor.' },
  { icon: '⚡', title: 'Kolay Başlangıç', desc: 'Platform ücretsiz. Jeton paketi satın al, ilk hastanı kabul et. Dakikalar içinde hazır.' },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Estelongy
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/rehber"
                className="hidden sm:block text-slate-400 hover:text-white text-sm transition-colors">
                Rehber
              </Link>
              <Link href="/klinik/basvur"
                className="hidden md:block text-slate-400 hover:text-white text-sm transition-colors">
                Klinik Başvurusu
              </Link>
              <Link href="/giris" className="text-slate-400 hover:text-white text-sm transition-colors">
                Giriş Yap
              </Link>
              <Link href="/kayit"
                className="px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-violet-500/20">
                Ücretsiz Başla
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────── */}
      <section className="pt-32 pb-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Klinik Onaylı Cilt Gençlik Skoru
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-6">
            Gerçek yaşınız ile{' '}
            <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              cilt yaşınız
            </span>{' '}
            aynı mı?
          </h1>

          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Selfie ile ön analizini al, longevity anketi ve klinik muayenesiyle{' '}
            <span className="text-emerald-400 font-semibold">Klinik Onaylı Estelongy Gençlik Skoru</span>&apos;na dönüştür.
          </p>

          <p className="text-slate-500 text-sm uppercase tracking-widest mb-8">Nereden başlamak istersin?</p>

          {/* ── ÜÇ KAPI ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">

            {/* Kapı 1 — Ücretsiz Analiz */}
            <Link href="/kayit?next=/analiz" className="group relative overflow-hidden rounded-3xl border border-violet-500/30 bg-gradient-to-br from-violet-600/20 via-purple-600/10 to-pink-500/5 p-8 text-left transition-all hover:border-violet-400 hover:scale-[1.02] hover:shadow-2xl hover:shadow-violet-500/20">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-violet-500/10 blur-3xl group-hover:bg-violet-500/20 transition-all" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white mb-5 shadow-lg shadow-violet-500/30">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-3">
                  Ücretsiz
                </div>
                <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                  Gençlik Skorunu<br />Öğren
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Selfie ile ön Gençlik Skorunu saniyeler içinde al.
                </p>
                <div className="flex items-center gap-2 text-violet-300 font-semibold text-sm group-hover:gap-3 transition-all">
                  <span>Analizi başlat</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Kapı 2 — Randevu Al */}
            <Link href="/randevu" className="group relative overflow-hidden rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 via-cyan-600/10 to-teal-500/5 p-8 text-left transition-all hover:border-blue-400 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-blue-500/10 blur-3xl group-hover:bg-blue-500/20 transition-all" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white mb-5 shadow-lg shadow-blue-500/30">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-bold uppercase tracking-widest mb-3">
                  Klinik Onaylı
                </div>
                <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                  Klinikten<br />Randevu Al
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Onaylı estetik kliniklerinden yüz yüze muayene için uygun tarih seç.
                </p>
                <div className="flex items-center gap-2 text-blue-300 font-semibold text-sm group-hover:gap-3 transition-all">
                  <span>Randevu oluştur</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>

            {/* Kapı 3 — Ürün Al */}
            <Link href="/magaza" className="group relative overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-br from-amber-600/20 via-orange-600/10 to-rose-500/5 p-8 text-left transition-all hover:border-amber-400 hover:scale-[1.02] hover:shadow-2xl hover:shadow-amber-500/20 md:col-span-1 col-span-1">
              <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-amber-500/10 blur-3xl group-hover:bg-amber-500/20 transition-all" />
              <div className="relative">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white mb-5 shadow-lg shadow-amber-500/30">
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-bold uppercase tracking-widest mb-3">
                  Hekim Puanlı
                </div>
                <h3 className="text-2xl font-black text-white mb-2 leading-tight">
                  Güvenilir<br />Ürün Al
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed mb-5">
                  Estelongy puanlı cilt bakım ürünleri ve klinik işlemleri. Hepsi doğrulanmış.
                </p>
                <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm group-hover:gap-3 transition-all">
                  <span>Mağazaya git</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </Link>
          </div>

          <div className="mt-10 text-center">
            <Link href="#nasil-calisir" className="text-slate-500 hover:text-slate-300 text-sm transition-colors inline-flex items-center gap-2">
              Nasıl çalışır?
              <svg className="w-3.5 h-3.5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Nasıl Çalışır ───────────────────────────────────────── */}
      <section id="nasil-calisir" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
              Adım adım süreç
            </div>
            <h2 className="text-4xl font-black text-white">Nasıl çalışır?</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Ücretsiz ön analizden klinik onaylı sertifikaya 4 adımda ulaşın.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={step.num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-10 left-[calc(100%-12px)] w-6 h-px bg-gradient-to-r from-slate-700 to-slate-800 z-10" />
                )}
                <div className={`p-6 rounded-2xl border transition-all h-full flex flex-col ${
                  step.num === '04'
                    ? 'bg-slate-800/80 border-amber-400/60 shadow-[0_0_22px_rgba(251,191,36,0.12)] hover:shadow-[0_0_32px_rgba(251,191,36,0.22)] hover:border-amber-400/80'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                }`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center text-white shrink-0`}>
                      {step.icon}
                    </div>
                    <span className="text-slate-700 text-2xl font-black">{step.num}</span>
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>

                  {/* 03 — +10 puan highlight */}
                  {step.num === '03' && (
                    <div className="mt-3 inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      ✦ +10 puana kadar artır
                    </div>
                  )}

                  {/* 04 — hover önizleme */}
                  {step.num === '04' && (
                    <div className="relative group mt-3 self-start inline-block">
                      <span className="inline-flex items-center gap-1.5 text-xs text-amber-400/70 group-hover:text-amber-400 transition-colors cursor-default select-none">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        nasıl görünür?
                      </span>
                      {/* Hover popup */}
                      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-56 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-50 scale-95 group-hover:scale-100">
                        <div className="bg-[#0f172a] border border-amber-400/40 rounded-2xl p-4 shadow-2xl">
                          <ScoreBar score={92} phase="klinik_onayli" animated={false} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── EGS Skor Açıklaması ─────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-6">
                Estelongy Gençlik Skoru
              </div>
              <h2 className="text-4xl font-black text-white mb-6">Gençlik Skorun 0–100 arası</h2>
              <p className="text-slate-400 leading-relaxed mb-6">
                Estelongy Gençlik Skoru, C250 formülüne dayalı bir biyolojik gençlik göstergesidir.
                Cilt görseli, yaşam tarzı anketi, tetkik sonuçları ve hekim değerlendirmesi
                birleştirilerek 0–100 arasında <strong>tek bir skor</strong> üretilir; klinik onayıyla kesinleşir.
              </p>
              <div className="space-y-3">
                {[
                  { label: 'Ön Analiz', desc: 'Selfie ile anında, ücretsiz', badge: 'Herkese açık' },
                  { label: 'Yaşam Tarzı Anketi', desc: 'Yaşam tarzı katkısı +10 puan', badge: 'Ücretsiz' },
                  { label: 'Klinik Onaylı Gençlik Skoru', desc: 'Hekim doğrulamalı sertifika', badge: 'Paylaşılabilir' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                    <div className="flex-1">
                      <span className="text-white font-medium text-sm">{item.label}</span>
                      <span className="text-slate-500 text-xs ml-2">— {item.desc}</span>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 font-medium shrink-0">
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {SCORE_ZONES.map(z => (
                <div key={z.label}
                  className={`p-5 rounded-2xl ${z.bg} border ${z.border} flex items-center gap-4`}>
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0"
                    style={{ backgroundColor: `${z.color}20`, color: z.color }}>
                    {z.label === 'Çok İyi' ? '95' :
                     z.label === 'İyi'    ? '84' :
                     z.label === 'Normal' ? '72' :
                     z.label === 'Düşük'  ? '60' : '40'}
                  </div>
                  <div>
                    <div className={`font-black text-lg ${z.text}`}>{z.label}</div>
                    <div className="text-slate-400 text-xs">{z.range} puan · {z.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Klinikler İçin ──────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm mb-4">
              Klinikler için
            </div>
            <h2 className="text-4xl font-black text-white">Sadece gelen müşteri için öde</h2>
            <p className="text-slate-400 mt-3 max-w-xl mx-auto">
              Platform ücretsiz. Hasta klinik kapısından geçtiğinde jeton düşer, no-show sıfır maliyet.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
            {CLINIC_FEATURES.map(f => (
              <div key={f.title}
                className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="text-white font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="/klinik/basvur"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/20">
              Kliniğimi Kaydet — Ücretsiz
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SSS ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-white">Sık Sorulan Sorular</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                q: 'Gençlik Skoru analizi gerçekten ücretsiz mi?',
                a: 'Evet. Ön analiz, longevity anketi ve skor tahmini tamamen ücretsizdir. Klinik Onaylı Estelongy Gençlik Skoru sertifikası almak için bir kliniğe randevu almanız yeterli.',
              },
              {
                q: 'Klinik Onaylı Gençlik Skoru ile Ön Analiz arasındaki fark nedir?',
                a: 'Ön Analiz selfienizle anlık hesaplanan tahmini bir değerdir; yol göstermek içindir, tıbbi karar aracı değildir. Klinik Onaylı Estelongy Gençlik Skoru ise uzman hekim tarafından anket, tetkik ve yüz yüze değerlendirmeyle doğrulanmış, paylaşılabilir sertifikalı skordur.',
              },
              {
                q: 'Fotoğrafım güvende mi?',
                a: 'Fotoğraflarınız yalnızca analiz için işlenir, saklanmaz ve üçüncü taraflarla paylaşılmaz. Tüm veriler şifreli bağlantıyla iletilir.',
              },
              {
                q: 'Klinik başvurusu nasıl çalışır?',
                a: 'Kliniğinizi kaydedin, admin onayından sonra 10 başlangıç jetonu ile sisteme dahil olursunuz. Platform aboneliği yoktur; yalnızca hasta kabulünde 1 jeton harcanır.',
              },
            ].map(item => (
              <details key={item.q}
                className="group p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all cursor-pointer">
                <summary className="text-white font-semibold list-none flex items-center justify-between gap-3">
                  {item.q}
                  <svg className="w-4 h-4 text-slate-500 shrink-0 group-open:rotate-45 transition-transform"
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </summary>
                <p className="text-slate-400 text-sm mt-3 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="p-10 rounded-3xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-pink-500/10 border border-violet-500/20">
            <div className="text-5xl mb-4">✦</div>
            <h2 className="text-3xl font-black text-white mb-4">Skorunuzu öğrenin</h2>
            <p className="text-slate-400 mb-8 leading-relaxed">
              Gerçek yaşınız ile cilt yaşınız arasında ne kadar fark var?
              Ücretsiz hesap oluşturun, ilk analizinizi yapın.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/kayit"
                className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-500/25 text-lg">
                Ücretsiz Kaydol
              </Link>
              <Link href="/giris"
                className="px-8 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl transition-all text-lg">
                Giriş Yap
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
