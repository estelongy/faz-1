'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addNoteAction, deleteNoteAction, togglePinNoteAction } from './note-actions'

export interface ClinicNote {
  id: string
  note: string
  pinned: boolean
  created_at: string
  updated_at: string | null
  author_name?: string | null
}

interface Props {
  userId: string
  notes: ClinicNote[]
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('tr-TR', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export default function KlinikNotlar({ userId, notes }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [newNote, setNewNote] = useState('')
  const [newPinned, setNewPinned] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)

  // Pinned önce
  const sorted = [...notes].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  function handleAdd() {
    if (!newNote.trim()) return
    setError(null)
    startTransition(async () => {
      const res = await addNoteAction(userId, newNote, newPinned)
      if (!res.ok) { setError(res.error ?? 'Hata'); return }
      setNewNote('')
      setNewPinned(false)
      router.refresh()
    })
  }

  function handleDelete(noteId: string) {
    if (!confirm('Bu notu silmek istediğinden emin misin?')) return
    startTransition(async () => {
      await deleteNoteAction(noteId, userId)
      router.refresh()
    })
  }

  function handleTogglePin(noteId: string, currentPinned: boolean) {
    startTransition(async () => {
      await togglePinNoteAction(noteId, userId, !currentPinned)
      router.refresh()
    })
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700 overflow-hidden mb-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl">📝</span>
          <div className="text-left">
            <h2 className="text-white font-bold">Klinik Notları</h2>
            <p className="text-slate-500 text-xs">
              Hastaya özel kalıcı notlar · {notes.length} not
              {notes.some(n => n.pinned) && ` · ${notes.filter(n => n.pinned).length} sabit`}
            </p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-700 p-6 space-y-4">
          {/* Yeni not ekle */}
          <div className="space-y-2">
            <textarea
              value={newNote}
              onChange={e => { setNewNote(e.target.value); setError(null) }}
              placeholder="Alerji uyarısı, takip bilgisi, özel talimatlar..."
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none"
            />
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newPinned}
                  onChange={e => setNewPinned(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span>📌 Üste sabitle (kritik bilgi)</span>
              </label>
              <button
                onClick={handleAdd}
                disabled={isPending || !newNote.trim()}
                className="px-5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 disabled:opacity-40 text-white text-sm font-bold rounded-lg transition-opacity"
              >
                {isPending ? 'Kaydediliyor...' : 'Not Ekle'}
              </button>
            </div>
            {error && (
              <p className="text-red-400 text-xs">{error}</p>
            )}
          </div>

          {/* Notlar listesi */}
          {sorted.length > 0 && (
            <div className="space-y-2 pt-4 border-t border-slate-700/50">
              {sorted.map(n => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition-colors ${
                    n.pinned
                      ? 'bg-amber-500/5 border-amber-500/30'
                      : 'bg-slate-900/40 border-slate-700/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {n.pinned && (
                        <span className="inline-block text-[10px] font-bold text-amber-400 mb-1">📌 SABİT</span>
                      )}
                      <p className="text-slate-200 text-sm whitespace-pre-wrap break-words">{n.note}</p>
                      <p className="text-slate-600 text-[11px] mt-2">
                        {formatDate(n.created_at)}
                        {n.author_name && ` · ${n.author_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleTogglePin(n.id, n.pinned)}
                        className={`p-1.5 rounded-lg transition-colors ${
                          n.pinned
                            ? 'text-amber-400 hover:bg-amber-500/10'
                            : 'text-slate-500 hover:text-amber-400 hover:bg-slate-700'
                        }`}
                        title={n.pinned ? 'Sabitlemeyi kaldır' : 'Üste sabitle'}
                      >
                        📌
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700 transition-colors"
                        title="Notu sil"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {sorted.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">
              Bu hasta için henüz not eklenmemiş. Yukarıdan yeni not ekleyebilirsin.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
