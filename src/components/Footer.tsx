import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950/50 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3 hover:opacity-80 transition-opacity">
              <div className="w-7 h-7 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Estelongy</span>
            </Link>
            <p className="text-slate-500 text-xs leading-relaxed">
              Estelongy Gençlik Skoru platformu. Ön analiz, longevity anketi ve klinik onayıyla biyolojik gençliğinizi öğrenin.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/analiz" className="text-slate-400 hover:text-white transition-colors">Ön Analiz</Link></li>
              <li><Link href="/randevu" className="text-slate-400 hover:text-white transition-colors">Klinik Randevu</Link></li>
              <li><Link href="/magaza" className="text-slate-400 hover:text-white transition-colors">Mağaza</Link></li>
              <li><Link href="/panel" className="text-slate-400 hover:text-white transition-colors">Panelim</Link></li>
              <li><Link href="/rehber" className="text-slate-400 hover:text-white transition-colors">Gençlik Rehberi</Link></li>
            </ul>
          </div>

          {/* Business */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">İş Ortakları</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/klinik/basvur" className="text-slate-400 hover:text-white transition-colors">Klinik Başvuru</Link></li>
              <li><Link href="/satici/basvur" className="text-slate-400 hover:text-white transition-colors">Satıcı Başvuru</Link></li>
              <li><Link href="/kurumsal/giris" className="text-slate-400 hover:text-white transition-colors">Kurumsal Giriş</Link></li>
            </ul>
          </div>

          {/* Legal & Support */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-wider mb-3">Hakkında</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/hakkinda/sss" className="text-slate-400 hover:text-white transition-colors">SSS</Link></li>
              <li><Link href="/hakkinda/iletisim" className="text-slate-400 hover:text-white transition-colors">İletişim</Link></li>
              <li><Link href="/hakkinda/sozlesme" className="text-slate-400 hover:text-white transition-colors">Sözleşme</Link></li>
              <li><Link href="/hakkinda/aydinlatma" className="text-slate-400 hover:text-white transition-colors">Aydınlatma</Link></li>
              <li><Link href="/hakkinda/cerez" className="text-slate-400 hover:text-white transition-colors">Çerez Politikası</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-slate-600 text-xs">
            © {new Date().getFullYear()} Vestoriq OÜ — Estelongy markası. Tüm hakları saklıdır.
          </p>
          <p className="text-slate-600 text-xs">
            Estelongy Gençlik Skoru, tıbbi teşhis aracı değildir.
          </p>
        </div>
      </div>
    </footer>
  )
}
