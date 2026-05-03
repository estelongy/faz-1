import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { enqueueNotification } from '@/lib/notifications'

/**
 * Randevu oluştur. Oturum açık olmalı — client OTP doğruladıktan sonra buraya post ediyor.
 * Başarı durumunda: e-posta onay + SMS onay (anında) + 24h ve 1h hatırlatma (planlanmış)
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Oturum yok' }, { status: 401 })
    }

    const { clinicId, dateTime, notes } = await req.json()
    if (!clinicId || !dateTime) {
      return NextResponse.json({ error: 'Eksik alan' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('appointments')
      .insert({
        user_id: user.id,
        clinic_id: clinicId,
        appointment_date: dateTime,
        status: 'pending',
        notes: notes || null,
      })
      .select('id')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Bildirim payload'ı için klinik adı + hasta adı
    const [{ data: clinic }, { data: profile }] = await Promise.all([
      supabase.from('clinics').select('name').eq('id', clinicId).single(),
      supabase.from('profiles').select('full_name, phone, phone_verified').eq('id', user.id).single(),
    ])

    const apptDate = new Date(dateTime)
    const formattedDate = apptDate.toLocaleString('tr-TR', {
      day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const payload = {
      patient_name: profile?.full_name ?? 'Hasta',
      clinic_name: clinic?.name ?? 'Klinik',
      date: formattedDate,
      to_phone: profile?.phone_verified ? profile?.phone ?? undefined : undefined,
    }

    // Anında — randevu alındı bildirimi (e-posta + SMS)
    await Promise.allSettled([
      enqueueNotification({ userId: user.id, type: 'appointment_confirmed', channel: 'email', payload }),
      profile?.phone_verified
        ? enqueueNotification({ userId: user.id, type: 'appointment_confirmed', channel: 'sms', payload })
        : Promise.resolve(),
    ])

    // Hatırlatmalar: 24 saat ve 1 saat öncesi
    const reminderTimes: { offset: number; type: 'appointment_reminder_24h' | 'appointment_reminder_1h' }[] = [
      { offset: 24 * 60 * 60 * 1000, type: 'appointment_reminder_24h' },
      { offset: 1  * 60 * 60 * 1000, type: 'appointment_reminder_1h'  },
    ]
    const now = Date.now()
    for (const { offset, type } of reminderTimes) {
      const scheduledAt = new Date(apptDate.getTime() - offset)
      // Geçmiş zamana scheduling yapma (randevu çok yakınsa hatırlatma atla)
      if (scheduledAt.getTime() <= now) continue
      await Promise.allSettled([
        enqueueNotification({ userId: user.id, type, channel: 'email', payload, scheduledAt }),
        profile?.phone_verified
          ? enqueueNotification({ userId: user.id, type, channel: 'sms', payload, scheduledAt })
          : Promise.resolve(),
      ])
    }

    return NextResponse.json({ success: true, appointmentId: data.id })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Hata' },
      { status: 500 },
    )
  }
}
