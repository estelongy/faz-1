import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Üyelik Sözleşmesi — Estelongy' }

export default function SozlesmePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/kayit" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          ← Kayıt sayfasına dön
        </Link>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">Üyelik Sözleşmesi</h1>
          <p className="text-slate-500 text-sm mb-8">Son güncelleme: Nisan 2026</p>

          <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-base mb-2">1. Taraflar</h2>
              <p>Bu sözleşme, Estelongy platformu (&ldquo;Platform&rdquo;) ile platforma üye olan gerçek kişi (&ldquo;Kullanıcı&rdquo;) arasında akdedilmektedir.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">2. Hizmetin Kapsamı</h2>
              <p>Platform; yapay zeka destekli cilt yaşlanma analizi, EGS (Estelongy Gençlik Skoru) hesaplama, estetik klinik randevu yönetimi ve ürün değerlendirme hizmetleri sunar. Sağlanan analizler tıbbi teşhis niteliği taşımaz.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">3. Kullanıcı Yükümlülükleri</h2>
              <p>Kullanıcı; gerçek ve güncel bilgilerle kayıt olmayı, platformu amacı dışında kullanmamayı ve üçüncü kişilerin haklarını ihlal etmemeyi kabul eder.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">4. Gizlilik ve Veri Güvenliği</h2>
              <p>Kullanıcı verileri, Hasta Aydınlatma Metni ve gizlilik politikamız kapsamında işlenir. Kişisel veriler üçüncü taraflarla kullanıcı onayı alınmadan paylaşılmaz.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">5. Fikri Mülkiyet</h2>
              <p>Platform üzerindeki tüm içerik, yazılım ve tasarım Estelongy&apos;ya aittir. İzinsiz kopyalanamaz veya dağıtılamaz.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">6. Sözleşmenin Feshi</h2>
              <p>Kullanıcı dilediği zaman hesabını kapatabilir. Platform, sözleşme ihlali durumunda üyeliği askıya alma veya sonlandırma hakkını saklı tutar.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">7. Uygulanacak Hukuk</h2>
              <p>Bu sözleşme Türk hukukuna tabidir. Anlaşmazlıklarda İstanbul Mahkemeleri ve İcra Daireleri yetkilidir.</p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
