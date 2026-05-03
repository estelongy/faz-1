import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Destek — Klinik',
}

export default function DestekPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          🛟 Destek
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Estelongy ekibiyle doğrudan iletişim. Teknik sorun, öneri veya partnerlik için yazın.
        </p>
      </div>

      {/* İletişim kanalları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <a href="mailto:klinik@estelongy.com"
          className="group p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-violet-500/40 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold">E-posta</p>
              <p className="text-slate-500 text-xs">2 iş günü içinde dönüş</p>
            </div>
          </div>
          <p className="text-violet-400 font-mono text-sm group-hover:text-violet-300 transition-colors">
            klinik@estelongy.com
          </p>
        </a>

        <a href="https://wa.me/905439455003" target="_blank" rel="noopener noreferrer"
          className="group p-5 rounded-2xl bg-slate-800/50 border border-slate-700 hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25D366] to-emerald-600 flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold">WhatsApp</p>
              <p className="text-slate-500 text-xs">Hızlı yanıt — mesai saatleri</p>
            </div>
          </div>
          <p className="text-emerald-400 font-mono text-sm group-hover:text-emerald-300 transition-colors">
            +90 543 945 50 03
          </p>
        </a>
      </div>

      {/* SSS hızlı linkler */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 mb-6">
        <h2 className="text-white font-bold text-sm mb-3 uppercase tracking-wide">Sık Sorulan Sorular</h2>
        <div className="space-y-2">
          {[
            { q: 'Krediler nasıl çalışır?', href: '/klinik/panel/jeton' },
            { q: 'Kredi paketi satın alma',  href: '/klinik/panel/jeton' },
            { q: 'Müsaitlik takvimini nasıl ayarlarım?', href: '/klinik/panel/musaitlik' },
            { q: 'Klinik genel SSS', href: '/hakkinda/sss' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-800 text-sm text-slate-300 hover:text-white transition-colors">
              <span>{item.q}</span>
              <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          ))}
        </div>
      </div>

      {/* Canlı destek - yakında */}
      <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-2xl shrink-0">💬</div>
          <div>
            <p className="text-white font-bold text-sm mb-0.5">
              Canlı destek <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">Yakında</span>
            </p>
            <p className="text-slate-400 text-xs leading-relaxed">
              Estelongy ekibiyle uygulama içi anlık sohbet. Şu an e-posta ve WhatsApp aktif — chat lansmandan kısa süre sonra açılacak.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
