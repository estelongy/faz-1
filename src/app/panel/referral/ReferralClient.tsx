'use client'

import { useState } from 'react'

interface Transaction {
  id: string
  amount: number
  type: string
  description: string | null
  createdAt: string
}

interface Props {
  code: string
  pointsBalance: number
  referredCount: number
  transactions: Transaction[]
}

const BASE_URL = 'https://estelongy-clean.vercel.app'

const TYPE_LABEL: Record<string, string> = {
  signup_bonus:         '🎁 Hoşgeldin bonusu',
  referral_signup:      '👥 Davet kayıt',
  referral_appointment: '🏥 Davet randevu',
  referral_order:       '🛍️ Davet alışveriş',
  gamification:         '⭐ Başarı bonusu',
  redeem_shop:          '🛒 Mağaza harcama',
  redeem_clinic:        '💉 Klinik harcama',
  admin_adjust:         '⚙️ Manuel düzeltme',
  refund_revert:        '↩️ İade',
}

export default function ReferralClient({ code, pointsBalance, referredCount, transactions }: Props) {
  const [copied, setCopied] = useState<'code' | 'link' | null>(null)
  const referralLink = `${BASE_URL}/r/${code}`

  function copyCode() {
    navigator.clipboard.writeText(code).then(() => {
      setCopied('code')
      setTimeout(() => setCopied(null), 2000)
    })
  }

  function copyLink() {
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied('link')
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const shareText = `Estelongy'de gençlik skorunu öğren — referans kodum: ${code}\n${referralLink}`
  const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(`Estelongy — Referans kodum: ${code}`)}`

  return (
    <div className="space-y-5">
      {/* Bakiye + İstatistikler */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-5">
          <p className="text-emerald-300 text-xs mb-1">Puan Bakiyem</p>
          <p className="text-4xl font-black text-emerald-400">{pointsBalance.toLocaleString('tr-TR')}</p>
          <p className="text-emerald-300/60 text-[10px] mt-1">≈ ₺{pointsBalance.toLocaleString('tr-TR')} değerinde</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
          <p className="text-slate-400 text-xs mb-1">Davet Ettiğin</p>
          <p className="text-4xl font-black text-violet-400">{referredCount}</p>
          <p className="text-slate-500 text-[10px] mt-1">üye</p>
        </div>
      </div>

      {/* Referral kodu */}
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-2xl p-6">
        <p className="text-slate-400 text-sm mb-3">Referans Kodun</p>
        <div className="flex items-center gap-3 mb-4">
          <code className="flex-1 text-3xl font-black text-white tracking-widest font-mono bg-slate-900/50 px-5 py-3 rounded-xl">
            {code}
          </code>
          <button
            onClick={copyCode}
            className={`px-4 py-3 rounded-xl text-sm font-bold transition-all ${
              copied === 'code' ? 'bg-emerald-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
            }`}
          >
            {copied === 'code' ? '✓ Kopyalandı' : 'Kopyala'}
          </button>
        </div>

        {/* Link */}
        <div className="flex items-center gap-2 p-3 bg-slate-900/50 rounded-xl mb-4">
          <span className="text-violet-400 text-xs flex-1 font-mono truncate">{referralLink}</span>
          <button onClick={copyLink} className={`text-xs px-2 py-1 rounded-lg transition-colors ${copied === 'link' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 hover:bg-slate-600 text-slate-400'}`}>
            {copied === 'link' ? '✓' : 'Kopyala'}
          </button>
        </div>

        {/* Paylaş */}
        <div className="flex gap-2">
          <a href={waUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#25D366]/15 hover:bg-[#25D366]/25 rounded-xl text-[#25D366] text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            WhatsApp
          </a>
          <a href={tgUrl} target="_blank" rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-[#0088cc]/15 hover:bg-[#0088cc]/25 rounded-xl text-[#0088cc] text-sm font-medium transition-colors">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
            Telegram
          </a>
        </div>
      </div>

      {/* Nasıl çalışır */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-5">
        <h3 className="text-white font-bold mb-4">Nasıl Puan Kazanırsın?</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 flex items-center justify-center text-base">🎁</div>
              <span className="text-slate-300">Hoşgeldin bonusu (yeni üye)</span>
            </div>
            <span className="text-emerald-400 font-bold">+20</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-violet-500/15 flex items-center justify-center text-base">👥</div>
              <span className="text-slate-300">Arkadaşın kayıt olunca</span>
            </div>
            <span className="text-violet-400 font-bold">+10</span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center text-base">🏥</div>
              <span className="text-slate-300">Arkadaşın ilk randevusunu tamamlayınca</span>
            </div>
            <span className="text-blue-400 font-bold">+50</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center text-base">🛍️</div>
              <span className="text-slate-300">Arkadaşın ilk siparişinden</span>
            </div>
            <span className="text-amber-400 font-bold">%5</span>
          </div>
        </div>
        <p className="text-slate-500 text-xs mt-4">
          Puanlarını mağazada veya klinikte indirim olarak kullanabilirsin (yakında).
        </p>
      </div>

      {/* Puan hareketleri */}
      {transactions.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-700">
            <h3 className="text-white font-bold text-sm">Son Puan Hareketleri</h3>
          </div>
          <div className="divide-y divide-slate-800">
            {transactions.map(t => (
              <div key={t.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {t.description ?? TYPE_LABEL[t.type] ?? t.type}
                  </p>
                  <p className="text-slate-500 text-xs">
                    {new Date(t.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric', month: 'long', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`font-black text-base shrink-0 ml-3 ${t.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.amount > 0 ? `+${t.amount}` : t.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
