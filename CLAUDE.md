# CLAUDE.md — Estelongy Proje Rehberi

## Proje Özeti

**Estelongy** — Estetik sağlık alanında AI destekli klinik yönetim ve hasta takip platformu.  
**Stack:** Next.js 14 (App Router) · Tailwind · Supabase PostgreSQL (RLS) · OpenAI gpt-5.4-mini · Stripe · Resend · Sentry · Vercel

### Git & Deploy Akışı (ÖNEMLİ)

```
Feature branch:  claude/priceless-ellis  →  preview URL (faz1-git-claude-priceless-ellis-*.vercel.app)
Production:      main                     →  estelongy-clean.vercel.app  (Vercel production alias)
```

**Canlıya çıkarmak için adımlar:**
1. Değişiklikleri `claude/priceless-ellis` branch'ine commit + push et
2. Main worktree'ye geç: `cd C:/Users/Orjin/estelongy-faz1`
3. Merge et: `git merge claude/priceless-ellis --no-ff -m "Merge branch 'claude/priceless-ellis'"`
4. Push et: `git push origin main` → Vercel production build tetiklenir
5. Build durumu: Vercel MCP `list_deployments` (projectId: `prj_qQ0N5SSfH8kqaY61qyiAFIOy9pVS`, team: `team_6KIGU5JvMoWBV5To6nncBNnc`)

Sadece feature branch'e push deploy'u canlıya yansıtmaz — preview kalır.

---

## Kullanıcı Rolleri

| Rol | Yetkiler |
|-----|----------|
| `user` | Analiz, Anket, Randevu, Sipariş, Yorum, Skor takibi |
| `clinic` | Hasta listesi, Takvim, Analiz onay, Jeton harcama |
| `vendor` | Ürün, Stok, Sipariş, İade, Komisyon takibi |
| `admin` | Tüm kaynaklar, Klinik/Kullanıcı/Kupon yönetimi |

> Klinik ve Vendor başvuruları `pending` durumunda `user` yetkisiyle çalışır.

---

## Sayfa Haritası

```
/                        → Landing page
/giris  /kayit           → Auth
/panel                   → Hasta paneli (rozetler, analizler, siparişler)
/panel/referral          → Referral + komisyon
/panel/leaderboard       → Anonim skor sıralaması
/analiz                  → gpt-5.4-mini Vision + C250 analiz
/anket                   → Longevity anketi
/randevu                 → Klinik seç + müsaitlik + randevu
/magaza  /magaza/[slug]  → Ürün listesi + detay
/sepet  /siparis/[no]    → Sepet + sipariş detay/iade
/klinik/basvur           → Klinik başvuru
/klinik/panel            → Klinik yönetim (randevular, takvim, müsaitlik, rapor)
/admin                   → Admin dashboard (kullanıcılar, klinikler, satıcılar, ürünler, kuponlar, iadeler)
/rehber                  → SEO hub + alt sayfalar
/hakkinda/*              → SSS, İletişim, Sözleşme, Aydınlatma, Çerez
```

---

## Supabase

- **ID:** `dcmnxmqzimrgmholktid` · **URL:** `https://dcmnxmqzimrgmholktid.supabase.co`
- **Edge Function:** `send-appointment-email`

**Tablolar:** `profiles` · `clinics` · `vendors` · `appointments` · `analyses` · `scores` · `longevity_surveys` · `products` · `orders` · `order_items` · `addresses` · `carts` · `cart_items` · `returns` · `transactions` · `jeton_transactions` · `reviews` · `notification_queue` · `audit_logs` · `clinic_availability` · `user_badges` · `user_activity_streaks` · `referral_codes` · `referral_uses` · `coupons`

**Kritik kısıtlamalar:**
```
scores.score_type          → CHECK IN ('web','device','doctor_approved','final')
notification_queue.type    → CHECK IN ('email','sms','push')
appointments.status        → ENUM (pending,confirmed,in_progress,completed,cancelled)
appointments.procedure_notes, recommendations → text (klinik yazar, hasta okur)
analyses.web_ai_raw        → JSONB  |  analyses.web_scores → JSONB
analyses.appointment_id    → uuid (ziyarete bağlı analiz; null ise bağımsız)
analyses.doctor_approved_scores → JSONB { tetkik, ileri_analiz_c250, hekim_skoru }
```

**RPC:** `consume_jeton(p_clinic_id, p_appointment_id)` · `generate_referral_code(p_user_id)` · `decrement_product_stock`

---

## Env Variables

```
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY · STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY · CRON_SECRET · NEXT_PUBLIC_SENTRY_DSN · SENTRY_ORG · SENTRY_PROJECT
```

---

## AI — gpt-5.4-mini Vision + C250

`POST /api/analiz` (rate limit: IP başına 5/saat) → Base64 → gpt-5.4-mini → 5 bileşen → C250 → skor

**C250 Ağırlıkları:**

| Bileşen | Ağırlık | Yön |
|---------|---------|-----|
| hydration | 0.25 | yüksek = iyi |
| tone_uniformity | 0.25 | yüksek = iyi |
| wrinkles | 0.25 | ters (100−değer) |
| pigmentation | 0.15 | ters (100−değer) |
| under_eye | 0.10 | yüksek = iyi |

**Yaş faktörü:** ≤25→1.02 · ≤35→1.00 · ≤45→0.97 · ≤55→0.93 · 56+→0.88

---

## Klinik Akış (6 Adım)

`/klinik/panel/randevu/[appointmentId]` → `KlinikAkisWizard`

- `src/components/KlinikAkisWizard.tsx`
- `src/lib/anket-sorular.ts` · `src/lib/tetkik-params.ts` · `src/lib/egs.ts`
- `src/app/klinik/panel/randevu/[appointmentId]/page.tsx` (server actions)

Akış: Kabul → Hasta Anketi → Klinik Anketi → Tetkik → İleri Analiz → Hekim Onayı  
Final = (toplam × 0.85) + (hekim_puanı × 0.15)

---

## Ziyaret Zaman Çizelgesi

Hem klinik (`/klinik/panel/hasta/[userId]`) hem hasta (`/panel`) tarafında ziyaret bazlı birleşik kart akışı.

- **Ortak bileşen:** `src/components/ZiyaretKarti.tsx`
- **Server action:** `src/app/klinik/panel/hasta/[userId]/ziyaret-actions.ts` → `saveVisitNotesAction`
- **Kart içeriği:** geliş sebebi · klinik notu · **yapılan işlem** (klinik edit) · **hekim önerileri** (klinik edit) · ön analiz C250 · tetkik sonuçları (referans aralığı + renk) · ileri analiz cihaz ölçümü · hekim değerlendirmesi + doktor notları · önceki ziyarete göre skor farkı rozeti
- **Birleştirme mantığı:** `analyses.appointment_id` ile eşleşen analizler ziyaret kartı içine; eşleşmeyenler "Bağımsız Ön Analiz" kartı olarak ayrı.
- **RLS:** `appointments_clinic_update` (mevcut) yeterli — `procedure_notes` ve `recommendations` aynı politikayla yazılabiliyor.

---

## Terminoloji (Sabit — Tutarlı Kullan)

| Terim | Kime/neye | Aralık | Not |
|-------|-----------|--------|-----|
| **Skor** | kişi (hasta) | 0–100 | "Estelongy Gençlik Skoru ®" — "EGS" ❌ |
| **EGP** | nesne (ürün, işlem, klinik) | 0–10 | Estelongy Gençlik Puanı |

**Skor bölgeleri (YENİ — eski barem kullanma):**

| Aralık | Etiket | Renk |
|--------|--------|------|
| < 55 | Çok Düşük | kırmızı |
| 56–65 | Düşük | turuncu |
| 66–79 | Normal | amber |
| 80–89 | İyi | yeşil |
| > 90 | Harika | cyan |

**Skor durumları:** `tahmini` (amber) · `guncelleniyor` (violet/pulse) · `klinik_onayli` (emerald)

**Estelog** = Skor bazlı çalışan, protokol odaklı estetik hekim (yeni meslek tanımı)

**EGP formülü:** `doctor×0.4 + user×0.35 + manufacturer×0.15 + scientific×0.10`  
`products` tablosunda `doctor_score`, `user_score`, `manufacturer_score`, `scientific_score` mevcut.

---

## Geliştirme Kuralları

- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` **KULLANMA**
- `router.refresh()` → insert/update sonrası cache temizleme
- Auth callback `next` param: sadece `/` ile başlıyorsa geçerli (open redirect koruması)
- AI down → fallback skor göster, sessiz başarısızlık yok
- Server action'larda `redirect()` try/catch **dışında** olmalı

---

## Bekleyen Görevler

### Rename (Yapılacak)
- [ ] Tüm "EGS" → "Skor" / "Estelongy Gençlik Skoru ®"
- [ ] `EGSScoreBar` → `ScoreBar` · `EGSScoreChart` → `ScoreChart` · `EGSFixedBadge` → `ScoreFixedBadge`
- [ ] `EGSPhase` type → `ScorePhase`
- [ ] `ZONE_DEFS` / `getZone()` / `colorZone()` / `zoneLabel()` → 5 yeni bölge
- [ ] SEO meta, OG image, PaylasModal, landing page metinleri

### Manuel (Kod Gerektirmeyen)
- [ ] Supabase → Auth → Google OAuth etkinleştir
- [ ] Vercel Env: `OPENAI_API_KEY` · `CRON_SECRET` · `RESEND_API_KEY`
- [ ] Sentry proje → DSN'leri Vercel'e ekle
- [ ] Stripe live mode → KYC tamamla

### Ziyaret Akışı İyileştirmeleri (Yapılacak)
- [ ] Klinik akışı tamamlanınca `analyses.appointment_id` otomatik dolsun (şu an manuel backfill gerekti)
- [ ] "İşlem sonrası takip" — hasta 10 gün sonra yeni ön analiz yaptığında, sonraki randevuya otomatik ilişkilendir ve öncekinin kartında "takip sonucu" olarak göster
- [ ] Hekim önerileri değişince hastaya bildirim (notification_queue)
- [ ] Kart içinde "öncekine göre" grafik mini-sparkline (nem, kırışıklık trend)

### Bildirim Sistemi (Yapılacak)
- [ ] Randevu alınınca hastaya e-posta gönder (şu an sadece kuyruğa yazılıyor, cron tetiklenmiyor)
- [ ] Randevu onaylanınca hastaya e-posta gönder — `/api/notifications/process` cron bağlantısı kurulacak
- [ ] `RESEND_API_KEY` Vercel'e eklenmeli (Manuel)
- [ ] SMS bildirimi — Netgsm veya benzeri provider (Faz 3)

### Faz 3
- [ ] Mobil App (React Native / Expo)
- [ ] Redis (Upstash) — rate limiting prod
- [ ] Push/SMS provider (FCM / Netgsm)
- [ ] AI fine-tuning
- [ ] API Platformu · Çoklu dil (EN)
- [ ] EGP UI: mağaza rozeti + sıralama + "nasıl hesaplandı" şeffaflık
