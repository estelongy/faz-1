'use client'

import { useState, useRef, useEffect } from 'react'

interface FilterInputProps {
  placeholder: string
  icon: React.ReactNode
  value: string
  suggestions: string[]
  onSelect: (val: string) => void
  onClear: () => void
}

export function FilterInput({ placeholder, icon, value, suggestions, onSelect, onClear }: FilterInputProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const filtered = query.trim().length >= 1
    ? suggestions
        .filter(s => s.toLowerCase().includes(query.toLowerCase().trim()))
        .slice(0, 10)
    : []

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  // Aktif filtre gösterimi
  if (value) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 bg-violet-500/15 border border-violet-500/40 rounded-xl min-w-0">
        <span className="text-violet-400 shrink-0">{icon}</span>
        <span className="text-white text-sm font-medium flex-1 truncate">{value}</span>
        <button
          onClick={onClear}
          className="text-slate-400 hover:text-white transition-colors shrink-0 ml-1"
          aria-label="Filtreyi temizle"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/50 border border-slate-700 rounded-xl focus-within:border-violet-500/60 transition-colors">
        <span className="text-slate-500 shrink-0">{icon}</span>
        <input
          type="text"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => { if (query.trim().length >= 1) setOpen(true) }}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-slate-500 text-sm focus:outline-none min-w-0"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setOpen(false) }}
            className="text-slate-500 hover:text-white transition-colors shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden max-h-56 overflow-y-auto">
          {filtered.map(s => (
            <button
              key={s}
              onMouseDown={() => { onSelect(s); setQuery(''); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors border-b border-slate-700/50 last:border-0"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
