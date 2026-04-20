import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Çerez Politikası',
  description: 'Estelongy\'de kullanılan çerez türleri, amaçları ve çerez tercihlerinizi nasıl yönetebileceğiniz.',
}

const COOKIES = [
  {
    name: 'sb-access-token',
    provider: 'Supabase',
    purpose: 'Oturum yönetimi — giriş yaptığınızda sizi tanır',
    duration: '1 saat (otomatik yenilenir)',
    type: 'Zorunlu',
  },
  {
    name: 'sb-refresh-token',
    provider: 'Supabase',
    purpose: 'Güvenli oturum yenileme',
    duration: '30 gün',
    type: 'Zorunlu',
  },
  {
    name: '__stripe_mid / __stripe_sid',
    provider: 'Stripe',
    purpose: 'Ödeme işlemleri sırasında dolandırıcılık tespiti',
    duration: '30 dakika / 1 yıl',
    type: 'Zorunlu',
  },
  {
    name: '_vercel_insights',
    provider: 'Vercel Analytics',
    purpose: 'Anonim trafik ve performans ölçümleri',
    duration: '24 saat',
    type: 'Analitik',
  },
]

export default function CerezPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          ← Anasayfa
        </Link>

        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h1 className="text-3xl font-black text-white mb-2">Çerez Politikası</h1>
          <p className="text-slate-500 text-sm mb-8">Son güncelleme: Nisan 2026</p>

          <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-base mb-2">1. Çerez Nedir?</h2>
              <p>Çerezler, web sitelerinin tarayıcınıza yerleştirdiği küçük metin dosyalarıdır. Oturumunuzu sürdürmek, tercihlerinizi hatırlamak ve platformun temel işlevlerini sağlamak için kullanılır.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">2. Hangi Çerezleri Kullanıyoruz?</h2>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs border border-slate-700 rounded-lg overflow-hidden">
                  <thead className="bg-slate-900">
                    <tr>
                      <th className="text-left px-3 py-2 text-slate-400 font-semibold">Çerez</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-semibold">Sağlayıcı</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-semibold">Amaç</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-semibold">Süre</th>
                      <th className="text-left px-3 py-2 text-slate-400 font-semibold">Tür</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {COOKIES.map(c => (
                      <tr key={c.name} className="bg-slate-800/30">
                        <td className="px-3 py-2 font-mono text-violet-300">{c.name}</td>
                        <td className="px-3 py-2 text-slate-300">{c.provider}</td>
                        <td className="px-3 py-2 text-slate-400">{c.purpose}</td>
                        <td className="px-3 py-2 text-slate-400">{c.duration}</td>
                        <td className="px-3 py-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.type === 'Zorunlu' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>{c.type}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">3. Çerez Türleri</h2>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li><strong className="text-white">Zorunlu Çerezler:</strong> Platformun çalışması için kaçınılmaz olanlar. Bunları devre dışı bırakırsanız oturum açamaz, randevu yönetemez veya ödeme yapamazsınız.</li>
                <li><strong className="text-white">Analitik Çerezler:</strong> Hangi sayfaların popüler olduğunu, hangi cihazlarda daha iyi çalıştığımızı anonim olarak anlamamıza yardım eder. Tarayıcınızdan devre dışı bırakabilirsiniz.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">4. Pazarlama ve Reklam Çerezleri</h2>
              <p><strong className="text-emerald-400">Hiç kullanmıyoruz.</strong> Üçüncü taraf reklam ağlarıyla bilgi paylaşmıyoruz, davranışsal reklam hedefleme yapmıyoruz, Facebook Pixel veya Google Ads remarketing çerezi yerleştirmiyoruz.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">5. Çerezleri Nasıl Yönetirsiniz?</h2>
              <p>Tarayıcı ayarlarınızdan çerezleri silebilir veya bloklayabilirsiniz:</p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li><strong className="text-white">Chrome:</strong> Ayarlar → Gizlilik ve Güvenlik → Çerezler</li>
                <li><strong className="text-white">Safari:</strong> Tercihler → Gizlilik → Çerezler</li>
                <li><strong className="text-white">Firefox:</strong> Seçenekler → Gizlilik ve Güvenlik</li>
              </ul>
              <p className="mt-2 text-slate-400 text-xs">Not: Zorunlu çerezleri devre dışı bırakırsanız platform düzgün çalışmaz.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">6. Politika Değişiklikleri</h2>
              <p>Bu politikada değişiklik yaptığımızda güncelleme tarihini değiştirir ve gerektiğinde e-posta ile bilgilendiririz.</p>
            </section>

            <section>
              <h2 className="text-white font-semibold text-base mb-2">7. İletişim</h2>
              <p>Çerezler veya kişisel verilerinize ilişkin sorularınız için{' '}
                <a href="mailto:kvkk@estelongy.com" className="text-violet-400 hover:text-violet-300">kvkk@estelongy.com</a>{' '}
                adresine yazabilirsiniz.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/hakkinda/sozlesme"
            className="text-center py-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all text-slate-300 text-sm font-medium">
            Üyelik Sözleşmesi
          </Link>
          <Link href="/hakkinda/aydinlatma"
            className="text-center py-3 rounded-xl bg-slate-800/50 border border-slate-700 hover:border-slate-600 transition-all text-slate-300 text-sm font-medium">
            Aydınlatma Metni
          </Link>
        </div>
      </div>
    </main>
  )
}
