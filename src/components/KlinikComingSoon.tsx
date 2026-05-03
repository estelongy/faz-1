import Link from 'next/link'

interface TeaserCard {
  icon: string
  title: string
  description: string
  badge?: string
}

interface Props {
  title: string
  subtitle: string
  emoji: string
  /** Tagline metni (mavi rozetli üst etiket) */
  tagline?: string
  /** "Yakında gelecek modüller" sekmesi */
  tabs?: { id: string; label: string }[]
  /** Teaser kartlar (sahte içerik önizleme) */
  cards: TeaserCard[]
  /** Sayfa altında gösterilecek "Geri bildirim ver" CTA */
  feedbackCta?: { text: string; href: string }
}

/**
 * Klinik portalında "Yakında" modülleri için ortak görsel iskelet.
 * Boş sayfa yerine teaser kartlar + zarif "Yakında" rozetiyle değer hissi.
 */
export default function KlinikComingSoon({
  title, subtitle, emoji, tagline, tabs, cards, feedbackCta,
}: Props) {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero başlık */}
      <div className="mb-8">
        {tagline && (
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 rounded-full mb-3">
            <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
            {tagline}
          </span>
        )}
        <h1 className="text-3xl font-black text-white flex items-center gap-3">
          <span className="text-2xl">{emoji}</span>
          {title}
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full ml-2">
            Yakında
          </span>
        </h1>
        <p className="text-slate-400 mt-2 text-sm max-w-2xl leading-relaxed">{subtitle}</p>
      </div>

      {/* Sekmeler (sadece görsel) */}
      {tabs && (
        <div className="flex gap-2 mb-6 border-b border-slate-800 overflow-x-auto pb-px">
          {tabs.map((t, i) => (
            <button key={t.id} disabled
              className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap border-b-2 ${
                i === 0
                  ? 'text-white border-violet-500'
                  : 'text-slate-500 border-transparent hover:text-slate-400'
              }`}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Teaser kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {cards.map((card, i) => (
          <div key={i}
            className="relative p-5 rounded-2xl bg-slate-800/40 border border-slate-700 hover:border-slate-600 transition-colors">
            {card.badge && (
              <span className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider text-violet-400 bg-violet-500/15 border border-violet-500/30 px-1.5 py-0.5 rounded">
                {card.badge}
              </span>
            )}
            <div className="text-2xl mb-3">{card.icon}</div>
            <h3 className="text-white font-bold mb-1.5 leading-tight">{card.title}</h3>
            <p className="text-slate-400 text-xs leading-relaxed">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Geri bildirim */}
      {feedbackCta && (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-white font-bold text-sm mb-0.5">Bu modül senin önerinle şekilleniyor</p>
              <p className="text-slate-400 text-xs">Burada en çok ne görmek istersin? Önerilerini paylaş.</p>
            </div>
            <Link href={feedbackCta.href}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors whitespace-nowrap">
              {feedbackCta.text} →
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
