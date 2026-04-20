import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Hasta Aydınlatma Metni — Estelongy' }

export default function AydinlatmaPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <Link href="/kayit" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors text-sm">
          ← Kayıt sayfasına dön
        </Link>
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 border border-slate-700">
          <h1 className="text-2xl font-bold text-white mb-2">Hasta Aydınlatma Metni</h1>
          <p className="text-slate-500 text-sm mb-8">KVKK Madde 10 kapsamında — Son güncelleme: Nisan 2026</p>

          <div className="space-y-6 text-slate-300 text-sm leading-relaxed">
            <section>
              <h2 className="text-white font-semibold text-base mb-2">1. Veri Sorumlusu</h2>
              <p>Kişisel verileriniz, 6698 sayılı Kişisel Verilerin Korunması Kanunu kapsamında Estelongy tarafından işlenmektedir.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">2. İşlenen Kişisel Veriler</h2>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Kimlik bilgileri (ad, soyad)</li>
                <li>İletişim bilgileri (e-posta, telefon)</li>
                <li>Fotoğraf ve biyometrik veriler (EGS analizi için)</li>
                <li>Sağlık verileri (longevity anketi yanıtları)</li>
                <li>İşlem ve randevu geçmişi</li>
              </ul>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">3. İşleme Amaçları</h2>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>EGS (Estelongy Gençlik Skoru) analizi yapılması</li>
                <li>Klinik randevu süreçlerinin yönetilmesi</li>
                <li>Hizmet kalitesinin iyileştirilmesi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
              </ul>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">4. Verilerin Aktarılması</h2>
              <p>Sağlık verileriniz; randevu aldığınız onaylı kliniklerle ve zorunlu hallerde yetkili kamu kurumlarıyla paylaşılabilir. Üçüncü ticari taraflarla açık rızanız olmadan paylaşılmaz.</p>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">5. Haklarınız (KVKK Madde 11)</h2>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>İşlenen verilere erişim ve düzeltme talep etme</li>
                <li>Silinmesini veya yok edilmesini isteme</li>
                <li>İşlemeye itiraz etme</li>
                <li>Zararın giderilmesini talep etme</li>
              </ul>
            </section>
            <section>
              <h2 className="text-white font-semibold text-base mb-2">6. İletişim</h2>
              <p>Haklarınızı kullanmak için: <span className="text-violet-400">estelongy@gmail.com</span></p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
