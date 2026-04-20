/**
 * Bildirim altyapısı — tek kaynak
 * notification_queue tablosuna yazma + Resend ile e-posta gönderme
 */

import { createServiceClient } from '@/lib/supabase/service'

// ── E-posta gönderici ─────────────────────────────────────────────────
export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[notifications] RESEND_API_KEY eksik, e-posta atlandı')
    return false
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.FROM_EMAIL ?? 'noreply@estelongy.com',
        to,
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const err = await res.text()
      console.error('[notifications] Resend hatası:', err)
      return false
    }
    return true
  } catch (e) {
    console.error('[notifications] sendEmail exception:', e)
    return false
  }
}

// ── Kuyruğa ekle ──────────────────────────────────────────────────────
interface EnqueueOpts {
  userId?: string
  type: string
  channel?: 'email' | 'sms' | 'push'
  payload: Record<string, unknown>
  scheduledAt?: Date
}

export async function enqueueNotification(opts: EnqueueOpts): Promise<void> {
  const admin = createServiceClient()
  await admin.from('notification_queue').insert({
    user_id:      opts.userId ?? null,
    type:         opts.type,
    channel:      opts.channel ?? 'email',
    payload:      opts.payload,
    scheduled_at: opts.scheduledAt?.toISOString() ?? new Date().toISOString(),
    status:       'pending',
  })
}

// ── E-posta şablonları ────────────────────────────────────────────────
export function tmplAppointmentConfirmed(payload: {
  patientName: string
  clinicName: string
  date: string
}) {
  return {
    subject: `[Estelongy] Randevunuz Onaylandı — ${payload.clinicName}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-weight:900;font-size:22px;background:linear-gradient(90deg,#7c3aed,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Estelongy</span>
        </div>
        <h2 style="color:#fff;margin:0 0 8px">Randevunuz Onaylandı ✓</h2>
        <p style="color:#94a3b8;margin:0 0 24px">Merhaba ${payload.patientName},</p>
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 8px"><strong style="color:#7c3aed">Klinik:</strong> <span style="color:#fff">${payload.clinicName}</span></p>
          <p style="margin:0"><strong style="color:#7c3aed">Tarih:</strong> <span style="color:#fff">${payload.date}</span></p>
        </div>
        <p style="color:#64748b;font-size:14px">Randevunuzu iptal etmek veya yönetmek için panele giriş yapın.</p>
        <a href="https://estelongy-clean.vercel.app/panel" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(90deg,#7c3aed,#9333ea);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Panele Git →</a>
      </div>
    `,
  }
}

export function tmplAppointmentReminder(payload: {
  patientName: string
  clinicName: string
  date: string
  hoursLeft: number
}) {
  const timeLabel = payload.hoursLeft <= 1 ? '1 saat' : '24 saat'
  return {
    subject: `[Estelongy] Randevunuzu Unutmayın — ${timeLabel} kaldı`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-weight:900;font-size:22px;background:linear-gradient(90deg,#7c3aed,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Estelongy</span>
        </div>
        <h2 style="color:#fff;margin:0 0 8px">⏰ Randevunuza ${timeLabel} kaldı</h2>
        <p style="color:#94a3b8;margin:0 0 24px">Merhaba ${payload.patientName},</p>
        <div style="background:#1e293b;border-radius:12px;padding:20px;margin-bottom:24px">
          <p style="margin:0 0 8px"><strong style="color:#f59e0b">Klinik:</strong> <span style="color:#fff">${payload.clinicName}</span></p>
          <p style="margin:0"><strong style="color:#f59e0b">Tarih:</strong> <span style="color:#fff">${payload.date}</span></p>
        </div>
        <a href="https://estelongy-clean.vercel.app/panel" style="display:inline-block;margin-top:16px;padding:12px 28px;background:linear-gradient(90deg,#f59e0b,#d97706);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Panele Git →</a>
      </div>
    `,
  }
}

export function tmplScoreUpdate(payload: {
  patientName: string
  score: number
  scoreType: 'on_analiz' | 'klinik_onayli'
}) {
  const isKlinik = payload.scoreType === 'klinik_onayli'
  const colorMap = (s: number) => s >= 90 ? '#00d4ff' : s >= 75 ? '#22c55e' : s >= 50 ? '#f59e0b' : '#ef4444'
  return {
    subject: isKlinik
      ? `[Estelongy] Klinik Onaylı EGS Skorunuz: ${payload.score}`
      : `[Estelongy] EGS Ön Analiz Skorunuz: ${payload.score}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;background:#0f172a;color:#e2e8f0;padding:32px;border-radius:16px">
        <div style="margin-bottom:24px">
          <span style="font-weight:900;font-size:22px;background:linear-gradient(90deg,#7c3aed,#9333ea);-webkit-background-clip:text;-webkit-text-fill-color:transparent">Estelongy</span>
        </div>
        <h2 style="color:#fff;margin:0 0 8px">${isKlinik ? '✦ Klinik Onaylı EGS Skorunuz' : 'EGS Ön Analiz Skorunuz'}</h2>
        <p style="color:#94a3b8;margin:0 0 24px">Merhaba ${payload.patientName},</p>
        <div style="text-align:center;padding:32px;background:#1e293b;border-radius:16px;margin-bottom:24px">
          <div style="font-size:72px;font-weight:900;color:${colorMap(payload.score)}">${payload.score}</div>
          <div style="color:#64748b;font-size:14px;margin-top:4px">${isKlinik ? 'Klinik Onaylı EGS' : 'Ön Analiz EGS'}</div>
        </div>
        <a href="https://estelongy-clean.vercel.app/panel" style="display:inline-block;padding:12px 28px;background:linear-gradient(90deg,#7c3aed,#9333ea);color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Detayları Gör →</a>
      </div>
    `,
  }
}
