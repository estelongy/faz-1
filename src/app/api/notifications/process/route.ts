/**
 * GET /api/notifications/process
 * Vercel cron tarafından her saat çağrılır.
 * Pending + scheduled_at <= now olan bildirimleri işler.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  sendEmail,
  tmplAppointmentConfirmed,
  tmplAppointmentReminder,
  tmplScoreUpdate,
} from '@/lib/notifications'

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(req: NextRequest) {
  // Güvenlik: sadece Vercel cron veya doğru secret ile çağrılabilir
  const authHeader = req.headers.get('authorization')
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()

  // Bekleyen + zamanı gelmiş bildirimleri al (max 50/çalıştırma)
  const { data: pending } = await admin
    .from('notification_queue')
    .select('id, user_id, type, channel, payload')
    .eq('status', 'pending')
    .lte('scheduled_at', new Date().toISOString())
    .lt('retry_count', 3)
    .order('scheduled_at', { ascending: true })
    .limit(50)

  if (!pending || pending.length === 0) {
    return NextResponse.json({ processed: 0 })
  }

  let sent = 0, failed = 0

  for (const notif of pending) {
    try {
      const payload = notif.payload as Record<string, unknown>

      // Kullanıcı e-postasını al
      let to: string | null = null
      if (notif.user_id) {
        const { data: ud } = await admin.auth.admin.getUserById(notif.user_id)
        to = ud?.user?.email ?? null
      }
      if (!to && payload.to_email) to = String(payload.to_email)

      let ok = false

      if (notif.channel === 'email' && to) {
        let subject = ''
        let html = ''

        switch (notif.type) {
          case 'appointment_confirmed': {
            const t = tmplAppointmentConfirmed({
              patientName: String(payload.patient_name ?? 'Hasta'),
              clinicName:  String(payload.clinic_name ?? 'Klinik'),
              date:        String(payload.date ?? ''),
            })
            subject = t.subject; html = t.html; break
          }
          case 'appointment_reminder_24h':
          case 'appointment_reminder_1h': {
            const t = tmplAppointmentReminder({
              patientName: String(payload.patient_name ?? 'Hasta'),
              clinicName:  String(payload.clinic_name ?? 'Klinik'),
              date:        String(payload.date ?? ''),
              hoursLeft:   notif.type === 'appointment_reminder_1h' ? 1 : 24,
            })
            subject = t.subject; html = t.html; break
          }
          case 'score_update': {
            const t = tmplScoreUpdate({
              patientName: String(payload.patient_name ?? 'Hasta'),
              score:       Number(payload.score ?? 0),
              scoreType:   (payload.score_type as 'on_analiz' | 'klinik_onayli') ?? 'on_analiz',
            })
            subject = t.subject; html = t.html; break
          }
          default:
            // Bilinmeyen tip → atla
            await admin.from('notification_queue')
              .update({ status: 'skipped', sent_at: new Date().toISOString() })
              .eq('id', notif.id)
            continue
        }

        ok = await sendEmail(to, subject, html)
      } else if (notif.channel === 'sms') {
        // SMS: Netgsm entegrasyonu gelecekte — şimdilik skipped
        await admin.from('notification_queue')
          .update({ status: 'skipped', sent_at: new Date().toISOString() })
          .eq('id', notif.id)
        continue
      }

      if (ok) {
        await admin.from('notification_queue')
          .update({ status: 'sent', sent_at: new Date().toISOString() })
          .eq('id', notif.id)
        sent++
      } else {
        await admin.from('notification_queue')
          .update({ status: 'failed', retry_count: (notif as { retry_count?: number }).retry_count ?? 0 + 1, error_msg: 'send failed' })
          .eq('id', notif.id)
        failed++
      }
    } catch (err) {
      console.error(`Notification ${notif.id} error:`, err)
      await admin.from('notification_queue')
        .update({ status: 'failed', error_msg: String(err) })
        .eq('id', notif.id)
      failed++
    }
  }

  return NextResponse.json({ processed: pending.length, sent, failed })
}
