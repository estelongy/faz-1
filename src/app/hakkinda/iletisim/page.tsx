import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'İletişim',
  description: 'Estelongy destek, klinik başvuru, satıcı ve basın iletişim bilgileri.',
}

const CHANNELS = [
  {
    icon: '🎯',
    title: 'Kullanıcı Desteği',
    desc: 'Hesap, analiz, randevu veya paylaşım kartı ile ilgili tüm sorularınız için.',
    email: 'support@estelongy.com',
    response: 'Genelde 24 saat içinde yanıtlıyoruz',
    color: 'from-violet-500 to-purple-600',
  },
  {
    icon: '🏥',
    title: 'Klinik Başvuruları',
    desc: 'Kliniğinizi Estelongy\'e dahil etmek, jeton paketleri veya ticari iş birlikleri için.',
    email: 'klinik@estelongy.com',
    response: '2 iş günü içinde geri dönüş',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    icon: '🛍️',
    title: 'Satıcı Desteği',
    desc: 'Ürün listeleme, komisyon, kargo ve iade süreçleriyle ilgili sorularınız için.',
    email: 'satici@estelongy.com',
    response: '2 iş günü içinde geri dönüş',
    color: 'from-amber-500 to-orange-600',
  },
  {
    icon: '📰',
    title: 'Basın ve PR',
    desc: 'Medya talepleri, röportajlar ve basın bülteni başvuruları.',
    email: 'press@estelongy.com',
    response: '3 iş günü içinde geri dönüş',
    color: 'from-blue-500 to-cyan-600',
  },
]

export default function IletisimPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          ← Anasayfa
        </Link>

        <div className="mb-10">
          <h1 className="text-4xl font-black text-white mb-3">İletişim</h1>
          <p className="text-slate-400">Her konunun ayrı bir iletişim kanalı var — doğru adrese yazınca daha hızlı cevap alırsınız.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {CHANNELS.map(c => (
            <a key={c.email} href={`mailto:${c.email}`}
              className="group p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.color} flex items-center justify-center text-2xl mb-4`}>
                {c.icon}
              </div>
              <h3 className="text-white font-bold mb-1">{c.title}</h3>
              <p className="text-slate-400 text-xs mb-3 leading-relaxed">{c.desc}</p>
              <p className="text-violet-400 font-mono text-sm group-hover:text-violet-300 transition-colors break-all">{c.email}</p>
              <p className="text-slate-600 text-[11px] mt-1">{c.response}</p>
            </a>
          ))}
        </div>

        {/* KVKK iletişim */}
        <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6">
          <h3 className="text-white font-bold mb-2">🔒 KVKK ve Veri Talepleri</h3>
          <p className="text-slate-400 text-sm leading-relaxed mb-3">
            Kişisel verilerinize erişim, düzeltme veya silme talepleri için ayrı bir kanalımız bulunur.
            Kayıtlı e-posta adresinizden başvurunuzu bizim için çok kolaylaştırır.
          </p>
          <a href="mailto:kvkk@estelongy.com" className="text-violet-400 hover:text-violet-300 font-mono text-sm">kvkk@estelongy.com</a>
        </div>

        {/* Şirket bilgisi placeholder */}
        <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800">
          <h3 className="text-white font-bold mb-3 text-sm">Şirket Bilgisi</h3>
          <div className="text-slate-400 text-xs space-y-1 leading-relaxed">
            <p><span className="text-slate-500">Ünvan:</span> Estelongy Sağlık Teknolojileri A.Ş.</p>
            <p><span className="text-slate-500">Adres:</span> İstanbul, Türkiye</p>
            <p><span className="text-slate-500">Web:</span> <Link href="/" className="text-violet-400 hover:text-violet-300">estelongy.com</Link></p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-3">
          <Link href="/hakkinda/sss"
            className="text-center py-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all text-slate-300 text-sm font-medium">
            Sık Sorulan Sorular
          </Link>
          <Link href="/hakkinda/cerez"
            className="text-center py-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all text-slate-300 text-sm font-medium">
            Çerez Politikası
          </Link>
        </div>
      </div>
    </main>
  )
}
