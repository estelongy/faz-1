'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { TETKIK_PARAMS } from '@/lib/tetkik-params'

export interface ZiyaretAnalysis {
  id: string
  web_overall: number | null
  temp_overall: number | null
  final_overall: number | null
  status: string | null
  created_at: string
  doctor_notes: string | null
  doctor_approved_scores: {
    tetkik?: Record<string, number>
    ileri_analiz_c250?: {
      hydration?: number
      tone_uniformity?: number
      wrinkles?: number
      pigmentation?: number
      under_eye?: number
    }
    hekim_skoru?: number
  } | null
  web_scores: Record<string, number> | null
}

export interface ZiyaretItem {
  kind: 'visit' | 'self_analysis'
  /** Randevu ya da analiz id */
  id: string
  date: string
  /** Görüntülenen durum etiketi */
  status: string
  /** Hasta'nın geliş sebebi */
  reasonNote: string | null
  /** Klinik genel notu */
  clinicNote: string | null
  /** Yapılan işlem detayları (sadece visit) */
  procedureNotes: string | null
  /** Hekim önerileri (sadece visit) */
  recommendations: string | null
  /** Bu ziyarete bağlı analiz (yoksa bağımsız) */
  analysis: ZiyaretAnalysis | null
  /** Bir önceki ziyaretin final skoruna göre fark */
  scoreDelta: number | null
  /** Ziyaretin bağlı olduğu randevu id'si (aktif akış linki için) */
  appointmentId: string | null
  /** Aktif mi (devam eden randevu) */
  isActive: boolean
  /** Kullanıcı id (action için) */
  userId: string
}

interface Props {
  item: ZiyaretItem
  /** Klinik tarafı mı — not/öneri düzenlenebilir */
  editable: boolean
  /** Sadece klinik tarafı için; aktif randevuya giden link */
  klinikAkisLink?: boolean
  saveVisitNotes?: (
    appointmentId: string,
    userId: string,
    procedureNotes: string,
    recommendations: string,
  ) => Promise<{ ok: boolean; error?: string }>
}

const STATUS_LABEL: Record<string, string> = {
  pending:     'Beklemede',
  confirmed:   'Onaylandı',
  in_progress: 'Görüşmede',
  completed:   'Tamamlandı',
  cancelled:   'İptal',
  no_show:     'Gelmedi',
}
const STATUS_COLOR: Record<string, string> = {
  pending:     'bg-amber-500/20 text-amber-400',
  confirmed:   'bg-blue-500/20 text-blue-400',
  in_progress: 'bg-violet-500/20 text-violet-400',
  completed:   'bg-emerald-500/20 text-emerald-400',
  cancelled:   'bg-red-500/20 text-red-400',
  no_show:     'bg-slate-500/20 text-slate-400',
}

const C250_LABELS: Array<[string, string]> = [
  ['hydration',       'Nem'],
  ['tone_uniformity', 'Ton'],
  ['wrinkles',        'Kırışıklık'],
  ['pigmentation',    'Pigment'],
  ['under_eye',       'Göz Altı'],
]

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function ZiyaretKarti({ item, editable, klinikAkisLink, saveVisitNotes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [edit, setEdit] = useState(false)
  const [procedure, setProcedure] = useState(item.procedureNotes ?? '')
  const [advice, setAdvice]       = useState(item.recommendations ?? '')
  const [err, setErr]             = useState<string | null>(null)

  const a   = item.analysis
  const das = a?.doctor_approved_scores ?? null
  const ws  = a?.web_scores ?? {}
  const tetkikEntries = das?.tetkik
    ? TETKIK_PARAMS.map(p => ({ ...p, value: das.tetkik![p.key] })).filter(r => r.value != null)
    : []
  const ileri = das?.ileri_analiz_c250 ?? null
  const hekim = das?.hekim_skoru ?? null

  const preScore   = a?.web_overall ?? a?.temp_overall ?? null
  const finalScore = a?.final_overall ?? null

  async function onSave() {
    if (!saveVisitNotes || item.kind !== 'visit') return
    setErr(null)
    startTransition(async () => {
      const res = await saveVisitNotes(item.id, item.userId, procedure, advice)
      if (res.ok) {
        setEdit(false)
        router.refresh()
      } else {
        setErr(res.error ?? 'Kaydedilemedi')
      }
    })
  }

  // Renk teması — kart kenarı
  const accent = item.kind === 'self_analysis'
    ? 'border-slate-700'
    : item.isActive
      ? 'border-violet-500/40'
      : 'border-slate-800'

  return (
    <div className={`bg-slate-900 rounded-2xl border ${accent} overflow-hidden`}>
      {/* Başlık çubuğu */}
      <div className="px-6 py-4 border-b border-slate-800 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            item.kind === 'self_analysis'
              ? 'bg-slate-700/50 text-slate-400'
              : 'bg-violet-500/15 text-violet-400'
          }`}>
            {item.kind === 'self_analysis' ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 12l3-3m0 0l3 3m-3-3v8m6-13l3 3m0 0l3-3m-3 3V3" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <div>
            <div className="text-white font-bold text-sm">
              {item.kind === 'self_analysis' ? 'Bağımsız Ön Analiz' : 'Klinik Ziyareti'}
            </div>
            <div className="text-slate-500 text-xs">{formatDate(item.date)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {preScore != null && (
            <div className="text-xs">
              <span className="text-slate-500 mr-1.5">Ön</span>
              <span className="text-white font-bold text-sm">{preScore}</span>
            </div>
          )}
          {finalScore != null && (
            <div className="text-xs">
              <span className="text-slate-500 mr-1.5">Final</span>
              <span className="text-[#00d4ff] font-black text-sm">{finalScore}</span>
            </div>
          )}
          {item.scoreDelta != null && item.scoreDelta !== 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
              item.scoreDelta > 0
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {item.scoreDelta > 0 ? '↑ +' : '↓ '}{item.scoreDelta.toFixed(1)}
            </span>
          )}
          {item.kind === 'visit' && (
            <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[item.status] ?? STATUS_COLOR.pending}`}>
              {STATUS_LABEL[item.status] ?? item.status}
            </span>
          )}
          {klinikAkisLink && item.isActive && item.appointmentId && (
            <Link
              href={`/klinik/panel/randevu/${item.appointmentId}`}
              className="text-xs px-3 py-1.5 rounded-lg bg-violet-600/20 text-violet-400 hover:bg-violet-600/30 transition-colors font-medium">
              {item.status === 'in_progress' ? 'Devam Et →' : 'Başlat →'}
            </Link>
          )}
        </div>
      </div>

      <div className="p-6 space-y-5">

        {/* Geliş sebebi & klinik notu */}
        {item.kind === 'visit' && (item.reasonNote || item.clinicNote) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {item.reasonNote && (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Geliş Sebebi
                </div>
                <p className="text-slate-200 text-sm whitespace-pre-wrap">{item.reasonNote}</p>
              </div>
            )}
            {item.clinicNote && (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-2">
                  Klinik Notu
                </div>
                <p className="text-slate-200 text-sm whitespace-pre-wrap">{item.clinicNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Yapılan İşlem & Hekim Önerileri */}
        {item.kind === 'visit' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Yapılan işlem */}
            <div className="bg-gradient-to-br from-violet-500/5 to-purple-500/5 rounded-xl p-4 border border-violet-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-wider text-violet-400 font-semibold">
                  Yapılan İşlem
                </div>
                {editable && !edit && (
                  <button onClick={() => setEdit(true)}
                    className="text-xs text-slate-400 hover:text-white transition-colors">
                    {item.procedureNotes ? 'Düzenle' : '+ Ekle'}
                  </button>
                )}
              </div>
              {edit ? (
                <textarea
                  value={procedure}
                  onChange={e => setProcedure(e.target.value)}
                  rows={4}
                  placeholder="Örn: Botoks (glabella, 20U) + HA dudak dolgusu 1cc"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-violet-500"
                />
              ) : item.procedureNotes ? (
                <p className="text-slate-200 text-sm whitespace-pre-wrap">{item.procedureNotes}</p>
              ) : (
                <p className="text-slate-600 text-sm italic">Henüz işlem notu yok</p>
              )}
            </div>

            {/* Hekim önerileri */}
            <div className="bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl p-4 border border-amber-500/20">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
                  Hekim Önerileri
                </div>
                {editable && !edit && (
                  <button onClick={() => setEdit(true)}
                    className="text-xs text-slate-400 hover:text-white transition-colors">
                    {item.recommendations ? 'Düzenle' : '+ Ekle'}
                  </button>
                )}
              </div>
              {edit ? (
                <textarea
                  value={advice}
                  onChange={e => setAdvice(e.target.value)}
                  rows={4}
                  placeholder="Örn: 48 saat masaj ve sıcak ortam yasağı. Retinol kullanımına 1 hafta ara. 10 gün sonra kontrol."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-amber-500"
                />
              ) : item.recommendations ? (
                <p className="text-slate-200 text-sm whitespace-pre-wrap">{item.recommendations}</p>
              ) : (
                <p className="text-slate-600 text-sm italic">Henüz öneri yok</p>
              )}
            </div>

            {/* Kaydet barı */}
            {edit && (
              <div className="md:col-span-2 flex items-center gap-3">
                <button
                  onClick={onSave}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold disabled:opacity-50">
                  {isPending ? 'Kaydediliyor…' : 'Kaydet'}
                </button>
                <button
                  onClick={() => {
                    setEdit(false)
                    setProcedure(item.procedureNotes ?? '')
                    setAdvice(item.recommendations ?? '')
                    setErr(null)
                  }}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm">
                  İptal
                </button>
                {err && <span className="text-red-400 text-xs">{err}</span>}
              </div>
            )}
          </div>
        )}

        {/* Analiz detayları */}
        {a && (Object.keys(ws).length > 0 || tetkikEntries.length > 0 || ileri || hekim != null || a.doctor_notes) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.keys(ws).length > 0 && (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                <h3 className="text-violet-400 font-semibold text-xs uppercase tracking-wider mb-3">Ön Analiz (C250)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {C250_LABELS.map(([k, label]) => ws[k] != null && (
                    <div key={k} className="flex justify-between">
                      <span className="text-slate-400">{label}</span>
                      <span className="text-white font-medium">{ws[k]}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tetkikEntries.length > 0 && (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                <h3 className="text-emerald-400 font-semibold text-xs uppercase tracking-wider mb-3">Tetkik Sonuçları</h3>
                <div className="space-y-1.5 text-sm">
                  {tetkikEntries.map(r => {
                    const inRange = r.value! >= r.min && r.value! <= r.max
                    return (
                      <div key={r.key} className="flex justify-between items-center">
                        <span className="text-slate-400">{r.label}</span>
                        <div className="flex items-center gap-2">
                          <span className={inRange ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                            {r.value} {r.unit}
                          </span>
                          <span className="text-slate-600 text-xs">({r.min}–{r.max})</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {ileri && (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                <h3 className="text-cyan-400 font-semibold text-xs uppercase tracking-wider mb-3">İleri Analiz (Cihaz)</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {C250_LABELS.map(([k, label]) => {
                    const v = ileri[k as keyof typeof ileri]
                    if (v == null) return null
                    return (
                      <div key={k} className="flex justify-between">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-cyan-300 font-medium">{v}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {(hekim != null || a.doctor_notes) && (
              <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-800">
                <h3 className="text-amber-400 font-semibold text-xs uppercase tracking-wider mb-3">Hekim Değerlendirmesi</h3>
                {hekim != null && (
                  <div className="flex items-baseline gap-2 mb-2">
                    <span className="text-3xl font-black text-amber-400">{hekim}</span>
                    <span className="text-slate-500 text-xs">/ 100</span>
                  </div>
                )}
                {a.doctor_notes && (
                  <p className="text-slate-300 text-sm whitespace-pre-wrap">{a.doctor_notes}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hiç veri yok ve ziyaret */}
        {item.kind === 'visit' && !a && !item.reasonNote && !item.clinicNote && !item.procedureNotes && !item.recommendations && (
          <p className="text-slate-600 text-sm italic">Bu ziyaret için henüz kayıt yok.</p>
        )}
      </div>
    </div>
  )
}
