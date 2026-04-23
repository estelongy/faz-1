'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { FilterInput } from '@/components/FilterInput'
import { BRANCHES, ALL_TREATMENTS, LOCATIONS, branchMatches, locationMatches } from '@/lib/randevu-filters'

interface Clinic {
  id: string
  name: string
  location: string | null
  bio: string | null
  specialties: string[] | null
  clinic_type: string | null
}

interface Availability {
  day_of_week: number        // 0=Pazar, 1=Pzt, ..., 6=Cumartesi
  start_time: string         // '09:00:00'
  end_time: string           // '18:00:00'
  slot_duration_minutes: number
  is_active: boolean
}

/** Hafta sonu ayrımı yapmadan önümüzdeki 14 günü döndürür. */
function getNext14Days() {
  const days: Date[] = []
  const today = new Date()
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push(d)
  }
  return days
}

/** 'HH:MM:SS' veya 'HH:MM' → dakika */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function minutesToTime(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Bir gün için müsaitliğe göre saat slotları üret. */
function generateSlots(avail: Availability | undefined): string[] {
  if (!avail || !avail.is_active) return []
  const start = timeToMinutes(avail.start_time)
  const end = timeToMinutes(avail.end_time)
  const step = avail.slot_duration_minutes || 30
  const slots: string[] = []
  for (let t = start; t + step <= end; t += step) {
    slots.push(minutesToTime(t))
  }
  return slots
}

export default function RandevuPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedClinicId = searchParams.get('k')
  const preselectedTip = searchParams.get('tip')
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Arama filtreleri
  const [filterUzman, setFilterUzman] = useState<string>('')
  const [filterBranch, setFilterBranch] = useState<string>(preselectedTip ?? '')
  const [filterTreatment, setFilterTreatment] = useState<string>('')
  const [filterLocation, setFilterLocation] = useState<string>('')

  // Müsaitlik + dolu saatler
  const [availability, setAvailability] = useState<Availability[]>([])
  const [busySlots, setBusySlots] = useState<Set<string>>(new Set()) // "YYYY-MM-DD HH:MM"
  const [loadingAvail, setLoadingAvail] = useState(false)

  const allDays = getNext14Days()

  // Müsait günleri (klinik o gün açık olan) filtrele
  const days = useMemo(() => {
    if (availability.length === 0) return allDays
    const activeDays = new Set(availability.filter(a => a.is_active).map(a => a.day_of_week))
    return allDays.filter(d => activeDays.has(d.getDay()))
  }, [allDays, availability])

  // Seçilen gün için slot'ları üret
  const daySlots = useMemo(() => {
    if (!selectedDay) return []
    const dow = selectedDay.getDay()
    const avail = availability.find(a => a.day_of_week === dow)
    return generateSlots(avail)
  }, [selectedDay, availability])

  // Seçilen gün için dolu olan saatler
  const busyForDay = useMemo(() => {
    if (!selectedDay) return new Set<string>()
    const dateKey = selectedDay.toISOString().split('T')[0]
    const out = new Set<string>()
    busySlots.forEach(s => {
      if (s.startsWith(dateKey)) out.add(s.split(' ')[1])
    })
    return out
  }, [selectedDay, busySlots])

  // Uzman önerileri: klinik adlarından dinamik
  const uzmanSuggestions = useMemo(() => {
    return clinics.map(c => c.name).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [clinics])

  // Filtrelenmiş klinik listesi
  const filteredClinics = useMemo(() => {
    return clinics.filter(c => {
      if (filterUzman && !c.name.toLowerCase().includes(filterUzman.toLowerCase())) return false
      if (filterBranch && !branchMatches(c.clinic_type, filterBranch)) return false
      if (filterTreatment && !(c.specialties?.some(s => s.toLowerCase().includes(filterTreatment.toLowerCase())))) return false
      if (filterLocation && !locationMatches(c.location, filterLocation)) return false
      return true
    })
  }, [clinics, filterUzman, filterBranch, filterTreatment, filterLocation])

  const hasFilter = !!(filterUzman || filterBranch || filterTreatment || filterLocation)
  function clearAllFilters() { setFilterUzman(''); setFilterBranch(''); setFilterTreatment(''); setFilterLocation('') }

  useEffect(() => {
    const supabase = createClient()
    // Auth kontrolü
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/giris?next=/randevu'); return }
    })
    // Klinik listesi çek
    supabase
      .from('clinics')
      .select('id, name, location, bio, specialties, clinic_type')
      .eq('approval_status', 'approved')
      .eq('is_active', true)
      .then(({ data }) => {
        const list = (data ?? []) as Clinic[]
        setClinics(list)
        setLoading(false)

        // Paylaşım linkinden gelinmişse (?k=<clinic_id>) kliniği önseç
        if (preselectedClinicId) {
          const preselected = list.find(c => c.id === preselectedClinicId)
          if (preselected) {
            setSelectedClinic(preselected)
            setStep(2)
          }
        }
      })
  }, [router, preselectedClinicId])

  // Klinik seçildiğinde müsaitlik + dolu randevuları çek
  useEffect(() => {
    if (!selectedClinic) {
      setAvailability([])
      setBusySlots(new Set())
      setSelectedDay(null)
      setSelectedTime(null)
      return
    }
    const supabase = createClient()
    setLoadingAvail(true)

    // İki sorguyu paralel çek
    Promise.all([
      supabase
        .from('clinic_availability')
        .select('day_of_week, start_time, end_time, slot_duration_minutes, is_active')
        .eq('clinic_id', selectedClinic.id),
      supabase
        .from('appointments')
        .select('appointment_date')
        .eq('clinic_id', selectedClinic.id)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .gte('appointment_date', new Date().toISOString())
        .lte('appointment_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()),
    ]).then(([availRes, apptRes]) => {
      setAvailability((availRes.data ?? []) as Availability[])

      const busy = new Set<string>()
      for (const a of apptRes.data ?? []) {
        const dt = new Date(a.appointment_date)
        const dateKey = dt.toISOString().split('T')[0]
        const timeKey = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`
        busy.add(`${dateKey} ${timeKey}`)
      }
      setBusySlots(busy)
      setLoadingAvail(false)
    })
  }, [selectedClinic])

  async function handleConfirm() {
    if (!selectedClinic || !selectedDay || !selectedTime) return
    setSaving(true)
    setError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/giris'); return }

    const [h, m] = selectedTime.split(':').map(Number)
    const dt = new Date(selectedDay)
    dt.setHours(h, m, 0, 0)

    const { error: err } = await supabase.from('appointments').insert({
      user_id: user.id,
      clinic_id: selectedClinic.id,
      appointment_date: dt.toISOString(),
      status: 'pending',
      notes: notes || null,
    })

    if (err) { setError('Randevu oluşturulamadı. Lütfen tekrar deneyin.'); setSaving(false); return }
    setSuccess(true)
  }

  if (success) return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Randevunuz Alındı!</h2>
        <p className="text-slate-400 mb-2">
          <span className="text-white font-medium">{selectedClinic?.name}</span> kliniği için
        </p>
        <p className="text-violet-400 font-medium mb-8">
          {selectedDay?.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })} · {selectedTime}
        </p>
        <Link href="/panel" className="inline-flex items-center justify-center w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold rounded-xl">
          Panele Dön
        </Link>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      <header className="fixed top-0 left-0 right-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/panel" className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Panel
          </Link>
          <span className="text-white font-bold">Randevu Al</span>
          <div className="flex gap-2">
            {[1,2,3].map(n => (
              <div key={n} className={`w-2 h-2 rounded-full transition-all ${step >= n ? 'bg-violet-500' : 'bg-slate-700'}`} />
            ))}
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-16">

        {/* ADIM 1 — Klinik Seç */}
        {step === 1 && (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-white">Klinik Seçin</h1>
              <p className="text-slate-400 text-sm mt-1">Onaylı kliniklerimizden birini seçin</p>
            </div>

            {/* Arama & Filtreler */}
            {!loading && clinics.length > 0 && (
              <div className="mb-6 space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <FilterInput
                    placeholder="Uzman ara... (ör: İzzet Gök)"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>}
                    value={filterUzman}
                    suggestions={uzmanSuggestions}
                    onSelect={setFilterUzman}
                    onClear={() => setFilterUzman('')}
                  />
                  <FilterInput
                    placeholder="Branş ara... (ör: Cildiye)"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    value={filterBranch}
                    suggestions={BRANCHES}
                    onSelect={setFilterBranch}
                    onClear={() => setFilterBranch('')}
                  />
                  <FilterInput
                    placeholder="Tedavi ara... (ör: Meme dikleştirme)"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>}
                    value={filterTreatment}
                    suggestions={ALL_TREATMENTS}
                    onSelect={setFilterTreatment}
                    onClear={() => setFilterTreatment('')}
                  />
                  <FilterInput
                    placeholder="Konum ara... (ör: Beylikdüzü)"
                    icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    value={filterLocation}
                    suggestions={LOCATIONS}
                    onSelect={setFilterLocation}
                    onClear={() => setFilterLocation('')}
                  />
                </div>

                {hasFilter && (
                  <div className="flex items-center justify-between text-xs pt-0.5">
                    <span className="text-slate-500">{filteredClinics.length} klinik bulundu</span>
                    <button onClick={clearAllFilters} className="text-violet-400 hover:text-violet-300 transition-colors">
                      Tüm filtreleri temizle
                    </button>
                  </div>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1,2,3,4].map(i => <div key={i} className="h-40 rounded-2xl bg-slate-800 animate-pulse" />)}
              </div>
            ) : clinics.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <p className="text-slate-400">Henüz onaylı klinik bulunmuyor.</p>
                <p className="text-slate-500 text-sm mt-1">Yakında yeni klinikler eklenecek.</p>
              </div>
            ) : filteredClinics.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center mb-4">
                  <svg className="w-7 h-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-slate-400">Arama kriterlerinize uygun klinik bulunamadı.</p>
                <button onClick={clearAllFilters}
                  className="mt-3 text-violet-400 hover:text-violet-300 text-sm transition-colors">
                  Filtreleri temizle
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClinics.map(clinic => (
                  <button key={clinic.id} onClick={() => { setSelectedClinic(clinic); setStep(2) }}
                    className={`text-left p-5 rounded-2xl border transition-all hover:scale-[1.02] ${
                      selectedClinic?.id === clinic.id ? 'border-violet-500 bg-violet-500/10' : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      </div>
                      <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </div>
                    <div className="text-white font-bold mb-1">{clinic.name}</div>
                    {clinic.location && <div className="text-slate-400 text-xs mb-2">📍 {clinic.location}</div>}
                    {clinic.specialties && clinic.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {clinic.specialties.slice(0, 3).map(s => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-400">{s}</span>
                        ))}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ADIM 2 — Tarih & Saat */}
        {step === 2 && selectedClinic && (
          <div>
            <button onClick={() => setStep(1)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              {selectedClinic.name}
            </button>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">Tarih & Saat Seçin</h1>
              <p className="text-slate-400 text-sm mt-1">Uygun bir gün ve saat seçin</p>
            </div>

            {loadingAvail ? (
              <div className="py-8 text-center text-slate-500 text-sm">Müsaitlik yükleniyor...</div>
            ) : days.length === 0 ? (
              <div className="p-5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm mb-6">
                ⚠ Bu klinik önümüzdeki 14 gün için müsaitlik saatlerini henüz tanımlamamış. Lütfen başka bir klinik seçin.
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h3 className="text-white font-medium mb-3">Gün</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {days.map(day => (
                      <button key={day.toISOString()} onClick={() => { setSelectedDay(day); setSelectedTime(null) }}
                        className={`shrink-0 flex flex-col items-center px-4 py-3 rounded-xl border transition-all ${
                          selectedDay?.toDateString() === day.toDateString()
                            ? 'border-violet-500 bg-violet-500/20 text-white'
                            : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                        }`}>
                        <span className="text-xs uppercase">{day.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                        <span className="text-lg font-bold mt-0.5">{day.getDate()}</span>
                        <span className="text-xs">{day.toLocaleDateString('tr-TR', { month: 'short' })}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedDay && (
                  <div className="mb-8">
                    <h3 className="text-white font-medium mb-3">
                      Saat
                      <span className="ml-2 text-xs text-slate-500 font-normal">
                        · {daySlots.filter(t => !busyForDay.has(t)).length} müsait slot
                      </span>
                    </h3>
                    {daySlots.length === 0 ? (
                      <p className="text-slate-500 text-sm py-4">Bu gün için saat tanımlanmamış.</p>
                    ) : (
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                        {daySlots.map(t => {
                          const isBusy = busyForDay.has(t)
                          return (
                            <button
                              key={t}
                              onClick={() => !isBusy && setSelectedTime(t)}
                              disabled={isBusy}
                              className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                                isBusy
                                  ? 'border-slate-800 bg-slate-900 text-slate-700 cursor-not-allowed line-through'
                                  : selectedTime === t
                                    ? 'border-violet-500 bg-violet-500/20 text-white'
                                    : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:border-slate-600'
                              }`}>
                              {t}
                            </button>
                          )
                        })}
                      </div>
                    )}
                    {daySlots.some(t => busyForDay.has(t)) && (
                      <p className="text-slate-500 text-xs mt-2">
                        <span className="line-through">Üzeri çizili</span> saatler dolu
                      </p>
                    )}
                  </div>
                )}
              </>
            )}

            <button onClick={() => setStep(3)} disabled={!selectedDay || !selectedTime}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all">
              Devam Et
            </button>
          </div>
        )}

        {/* ADIM 3 — Onay */}
        {step === 3 && selectedClinic && selectedDay && selectedTime && (
          <div>
            <button onClick={() => setStep(2)} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm mb-6 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
              Geri
            </button>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-white">Randevuyu Onayla</h1>
              <p className="text-slate-400 text-sm mt-1">Bilgileri kontrol edip onaylayın</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700 mb-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Klinik</div>
                  <div className="text-white font-bold">{selectedClinic.name}</div>
                  {selectedClinic.location && <div className="text-slate-400 text-xs">📍 {selectedClinic.location}</div>}
                </div>
              </div>
              <div className="h-px bg-slate-700" />
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <div>
                  <div className="text-slate-400 text-xs">Tarih & Saat</div>
                  <div className="text-white font-bold">
                    {selectedDay.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="text-violet-400 text-sm font-medium">{selectedTime}</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm text-slate-400 mb-2">Notlar (isteğe bağlı)</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Şikayetleriniz veya eklemek istediğiniz bilgiler..."
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 transition-colors resize-none" />
            </div>

            {error && <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

            <button onClick={handleConfirm} disabled={saving}
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-all text-lg">
              {saving ? 'Kaydediliyor...' : 'Randevuyu Onayla'}
            </button>
          </div>
        )}
      </div>
    </main>
  )
}
