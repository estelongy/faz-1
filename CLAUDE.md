# CLAUDE.md — Estelongy Proje Rehberi

Bu dosya her oturumda otomatik okunur.

---

## Proje Özeti

**Estelongy** — Estetik sağlık alanında yapay zeka destekli klinik yönetim ve hasta takip platformu.

**EGS (Estelongy Gençlik Skoru):** GPT-4 Vision + C250 formülüyle yüz yaşlanma analizi.  
**Hedef kitle:** Estetik klinikler (B2B SaaS) + Bireysel hastalar (B2C)  
**Branch:** `claude/priceless-ellis` → deploy: `estelongy-clean.vercel.app`

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

## Sayfa Yapısı (Güncel)

```
/                        → Landing page
/giris                   → Giriş (email + Google OAuth)
/kayit                   → Kayıt
/panel                   → Hasta paneli (rozetler, analizler, siparişler)
/panel/referral          → Referral kodu + komisyon takibi
/analiz                  → EGS analiz (GPT-4 Vision + C250)
/anket                   → Longevity anketi
/randevu                 → Klinik seç + müsaitlik tabanlı saat + randevu al
/magaza                  → Ürün listesi
/magaza/[slug]           → Ürün detay + yorumlar
/sepet                   → Sepet
/siparis/[orderNumber]   → Sipariş detay + iade
/klinik/basvur           → Klinik başvuru formu
/klinik/panel            → Klinik yönetim paneli (randevular)
/klinik/panel/takvim     → Aylık takvim görünümü
/klinik/panel/musaitlik  → Haftalık müsaitlik ayarları
/admin                   → Admin dashboard
/admin/kullanicilar      → Kullanıcı yönetimi
/admin/klinikler         → Klinik yönetimi
/admin/saticilar         → Satıcı yönetimi
/admin/urunler           → Ürün yönetimi
/admin/kuponlar          → Kupon oluşturma ve yönetimi
/admin/iadeler           → İade arabulucu (satıcı-müşteri anlaşmazlıkları)
/panel/leaderboard       → Anonim skor sıralaması
/klinik/panel/rapor      → Aylık performans raporu
```

---

## Teknik Stack

| Katman | Teknoloji |
|--------|-----------|
| Frontend | Next.js 14 (App Router) |
| Stil | Tailwind CSS |
| Backend | Next.js API Routes + Supabase |
| Database | Supabase PostgreSQL (RLS aktif) |
| AI | OpenAI GPT-4o Vision + C250 formülü ✅ |
| E-posta | Resend API |
| Ödeme | Stripe (Connect + jeton checkout) ✅ |
| Hata İzleme | Sentry (`@sentry/nextjs`) ✅ |
| Cron | Vercel Cron (`vercel.json`, saatlik) ✅ |
| Deploy | Vercel |

---

## Supabase

- **Proje ID:** `dcmnxmqzimrgmholktid`
- **URL:** `https://dcmnxmqzimrgmholktid.supabase.co`
- **Edge Function:** `send-appointment-email` (deploy edildi)

### Mevcut Tablolar (hepsi canlıda)

`profiles` · `clinics` · `vendors` · `appointments` · `analyses` · `scores` · `longevity_surveys` · `products` · `orders` · `order_items` · `addresses` · `carts` · `cart_items` · `returns` · `transactions` · `jeton_transactions` · `reviews` · `notification_queue` · `audit_logs` · `clinic_availability` · `user_badges` · `user_activity_streaks` · `referral_codes` · `referral_uses` · `coupons`

### Kritik Sütun Kısıtlamaları

```
scores.score_type    → CHECK IN ('web','device','doctor_approved','final')
notification_queue.type → CHECK IN ('email','sms','push')
analyses.web_ai_raw  → JSONB (GPT ham sonuç)
analyses.web_scores  → JSONB (bileşen skorları)
appointments.status  → ENUM (pending,confirmed,in_progress,completed,cancelled)
```

### Fonksiyonlar / RPC

- `consume_jeton(p_clinic_id, p_appointment_id)` — SECURITY DEFINER, atomik jeton düşme
- `generate_referral_code(p_user_id)` — referral kodu üretme

---

## Env Variables (Vercel'de tanımlı olmalı)

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY                  ← GPT-4 Vision için
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY
CRON_SECRET                     ← /api/notifications/process auth
NEXT_PUBLIC_SENTRY_DSN          ← Sentry (opsiyonel, prod'da aktif)
SENTRY_ORG                      ← Sentry (opsiyonel)
SENTRY_PROJECT                  ← Sentry (opsiyonel)
```

---

## Klinik Akış & Skor Hesaplama (Implemente edildi)

### UI Konumu
- **Giriş:** `/klinik/panel/randevu/[appointmentId]` → `KlinikAkisWizard` bileşeni
- **6 adım:** Kabul → Klinik Anketi → Tetkik → İleri Analiz → Hekim → Onay

### Kod Referansları
- `src/components/KlinikAkisWizard.tsx` — 6 adımlı wizard
- `src/lib/anket-sorular.ts` — HASTA_ANKET_SORULARI (5) + KLINIK_EK_SORULARI (5) + puan fonksiyonları
- `src/lib/tetkik-params.ts` — TETKIK_PARAMS (8 sabit parametre) + scoreTetkikValues
- `src/lib/egs.ts` — sumComponents + finalApprovedScore
- `src/app/klinik/panel/randevu/[appointmentId]/page.tsx` — server actions (kabulEt, saveAnket, saveTetkik, saveIleriAnaliz, saveHekim, finalOnay)

### Tam Akış

```
1. Ön Analiz (zorunlu)        → c250_base (fotoğraf → GPT-4 → C250)
2. Hasta Anketi (opsiyonel)   → hasta_anket_puani (5 soru, randevudan sonra, evden)
3. Klinik Anketi (opsiyonel)  → klinik_anket_puani (aynı 5 soru replace + 5 yeni soru)
4. Tetkik Girişi (opsiyonel)  → tetkik_puani (5-10 sabit parametre, referans aralığıyla)
5. İleri Analiz (opsiyonel)   → c250_base replace (fotoğraf veya cihaz → GPT-4 → C250)
6. Hekim Onayı (zorunlu)      → final = (toplam × 0.85) + (hekim_puani × 0.15)
                              → KLİNİK ONAYLI EGS ✅
```

### Skor Hesaplama Kuralları

- **Atlanan her basamak skora sıfır etki** — akış devam eder
- **Hekim atlanamaz** — tüm puanları görür, onaylamadan "Klinik Onaylı EGS" oluşmaz
- **İleri analiz** ön analizin c250_base'ini **replace eder** (üstüne eklenmez)
- **Klinik anketi** hasta anketinin aynı 5 sorusunu **replace eder** (çift sayım önleme) + 5 yeni soru ekler
- **AI analizleri bağımsız** — anket/tetkik puanlarına dokunmaz, sadece c250_base'i etkiler

### Skor Durumları

| Durum | Açıklama |
|-------|----------|
| `tahmini` | Sadece ön analiz var (GPT-4 + C250) |
| `güncelleniyor` | Hasta anketi doldu veya klinik süreci devam ediyor |
| `klinik_onaylı` | Hekim onayladı, final skor sabitlendi |

### Örnek Hesaplama

```
c250_ön_analiz     = 75   → ileri analiz gelince 82 ile replace edilir
hasta_anket        = +1
klinik_anket       = -1 (replace) + 5 (toplam) = +4
tetkik             = 0
c250_ileri_analiz  = 82   (75'in yerini aldı)
─────────────────────────
ara toplam         = 82 + 1 - 1 + 5 + 0 = 87

× 0.85             = 73.95
hekim (78) × 0.15  = 11.7
─────────────────────────
KLİNİK ONAYLI EGS  = 85.65
```

### Anket Yapısı

| | Kim | Nerede | Sorular |
|--|--|--|--|
| Hasta Anketi | Hasta | Telefondan, randevu sonrası | 5 soru (A,B,C,D,E) |
| Klinik Anketi | Klinik personeli | Yüz yüze | Aynı 5 (A-E replace) + 5 yeni |

### Tetkik

- 5-10 **sabit** parametre (kan, hormon vs.)
- Klinik değerleri girer, sistem referans aralığına göre puanı hesaplar

### İleri Analiz

- Ön analizle aynı C250 formülü çalışır
- Girdi: fotoğraf **veya** cihaz verisi (henüz karar verilmedi)
- Ücretli/premium versiyon
- Sonuç ön analizin c250_base'ini replace eder

### Önemli Not

Görünüm yaşı subjektif bir ölçüm — bu sistemin handikabı.
Ama skorun bilimsel dayanağı var (sonraki session'da konuşulacak).
Tetkik verileri + hekim onayı skoru savunulabilir kılıyor.

---

## AI — GPT-4 Vision + C250

### Akış

```
POST /api/analiz  (rate limit: IP başına 5/saat)
  → Base64 görsel → GPT-4o (detail: low)
  → 5 bileşen: wrinkles, pigmentation, hydration, tone_uniformity, under_eye
  → C250 ağırlıklı hesap → yaş faktörü → EGS skoru
  → DB: analyses.web_overall + web_ai_raw + web_scores
  →     scores.c250_base + total_score + color_zone
  → Fallback: AI down → tahmini skor (confidence: 0.3)
```

### C250 Ağırlıkları

| Bileşen | Ağırlık | Yön |
|---------|---------|-----|
| hydration | 0.25 | yüksek = iyi |
| tone_uniformity | 0.25 | yüksek = iyi |
| wrinkles | 0.25 | ters (100-değer) |
| pigmentation | 0.15 | ters (100-değer) |
| under_eye | 0.10 | yüksek = iyi |

### Yaş Faktörü

| Yaş | Faktör |
|-----|--------|
| ≤25 | 1.02 |
| ≤35 | 1.00 |
| ≤45 | 0.97 |
| ≤55 | 0.93 |
| 56+ | 0.88 |

### EGS Renk Bölgeleri

| Renk | Aralık | Anlam |
|------|--------|-------|
| Kırmızı | 0-49 | Yaşından yaşlı |
| Kahverengi | 50-74 | Yaşında |
| Yeşil | 75-89 | Yaşından genç |
| Mavi | 90-100 | Premium |

---

## Jeton Sistemi

- `clinics.jeton_balance` — prepaid bakiye
- Paket satın alma: `/api/stripe/checkout` → Stripe Checkout → webhook → `jeton_balance++`
- Hasta kabulü: `consume_jeton()` RPC (atomik, -1 jeton)
- No-show: jeton yanmaz (kabul yapılmadıysa)
- Paketler: 10/25/50/100 jeton (EUR)

---

## Bildirim Altyapısı

- Tablo: `notification_queue` (status: pending/sent/failed/cancelled)
- Cron: `GET /api/notifications/process` — saatlik, `Authorization: Bearer CRON_SECRET`
- Kanallar: `email` (Resend aktif), `sms`/`push` (altyapı hazır, provider eklenmeli)
- Şablonlar: `appointment_confirmed`, `appointment_reminder_24h`, `appointment_reminder_1h`, `score_update`
- `src/lib/notifications.ts` — `enqueueNotification()`, `sendEmail()`, template fonksiyonları

---

## Rate Limiting

`src/lib/ratelimit.ts` — bellek içi sliding window (pod yeniden başlarsa sıfırlanır)

| Endpoint | Limit |
|----------|-------|
| `/api/analiz` | IP başına 5/saat |
| `/api/checkout/*` | Kullanıcı başına 20/dk |
| Genel API | IP başına 100/dk |
| Auth | IP başına 10/15dk |

---

## Oyunlaştırma

- `src/lib/badges.ts` — 8 rozet tipi
- `src/app/panel/badge-actions.ts` — `checkAndAwardBadges()`, `updateStreak()`
- Tablolar: `user_badges`, `user_activity_streaks`
- Panel sayfasında rozet grid + streak göstergesi
- **Anonim leaderboard:** `/panel/leaderboard` — top 20 klinik onaylı EGS, isimler A*** Y***
- **Klinik aylık rapor:** `/klinik/panel/rapor` — 6 ay analitik, trend, skor artışı
- **Hasta iletişim notları:** `clinic_patient_notes` tablosu, pinned+author
- **Randevu QR:** `RandevuQRModal` — hasta klinikte QR gösterir, check-in

---

## Affiliate / Referral / Kupon

- Referral: `referral_codes` + `referral_uses` (5% komisyon)
- Kupon: `coupons` tablosu (percent/fixed, min_order, max_uses, valid_until)
- Admin kupon yönetimi: `/admin/kuponlar`
- Checkout'ta kupon doğrulama: `POST /api/checkout/create-intent`
- RPC: `generate_referral_code(user_id)`

---

## Marketplace

- Çoklu satıcı: tek ödeme → vendor başına `stripe.transfers.create()`
- Tek satıcı: Stripe destination charge
- İade: 14 günlük pencere (`order_items.delivered_at`)
- Satıcı `stripe_account_id` yoksa veya `stripe_charges_enabled=false` → transfer yapılmaz
- Stok uyarısı: stok ≤ 5 → satıcıya Resend email
- **Sipariş onay e-postası**: müşteriye tam detay (ürünler, adres, toplam) — `sendOrderConfirmationEmail` webhook'ta
- Stok decrement atomik: `decrement_product_stock` RPC `FOR UPDATE` lock ile race-safe
- Yorumlar: satın alıp teslim/iade edene `is_verified: true`

---

## Güvenlik & Altyapı

- `next.config.mjs`: `withSentryConfig` + güvenlik başlıkları (HSTS, XSS, X-Frame)
- `src/instrumentation.ts`: Next.js 14 Sentry kaydı (nodejs + edge)
- Google OAuth: `supabase.auth.signInWithOAuth({ provider: 'google' })`
  - Supabase Dashboard → Auth → Providers → Google (manuel etkinleştirme gerekli)
- `server action` ownership: her zaman `user.id` ile kontrol
- Admin kontrolü: hem `layout.tsx` hem `page.tsx`/`action` katmanında (defense-in-depth)

---

## Geliştirme Kuralları

- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` **KULLANILAMAZ**
- `router.refresh()` → insert/update sonrası Next.js cache temizler
- Auth callback `next` param: sadece `/` ile başlıyorsa geçerli (open redirect koruması)
- AI servisi down → fallback skor göster, sessiz başarısızlık yok
- Server action'larda `redirect()` try/catch dışında olmalı (Next.js fırlatır)

---

## Faz Durumu

### Faz 1 — MVP ✅ Tamamlandı
- [x] Auth (email + Google OAuth)
- [x] Klinik başvuru + panel
- [x] Hasta paneli (randevu, analiz)
- [x] GPT-4 Vision + C250 AI analizi
- [x] Jeton sistemi (Stripe + consume_jeton RPC)
- [x] Admin paneli
- [x] E-posta bildirimleri (Resend)

### Faz 2 — Büyüme ✅ Tamamlandı
- [x] F2-1: Marketplace (çoklu satıcı, yorumlar, iade penceresi, stok uyarı)
- [x] F2-2: Klinik takvim + müsaitlik yönetimi
- [x] F2-3: EGS skor zinciri (`src/lib/egs.ts`)
- [x] F2-4: Bildirim altyapısı (notification_queue + Vercel cron)
- [x] F2-5: Oyunlaştırma (rozetler + streak)
- [x] F2-6: Affiliate + referral + kupon
- [x] F2-8: Altyapı (Google OAuth, güvenlik başlıkları, Sentry, rate limiting, admin kuponlar)
- [x] AI Entegrasyon: GPT-4 Vision + C250 gerçek skorlama

### Faz 3 — Bekleyen
- [ ] Mobil App (React Native / Expo)
- [ ] Stripe live mode (KYC tamamlama)
- [ ] AI fine-tuning (kendi modelimiz)
- [ ] Redis (Upstash) — rate limiting prod için
- [ ] Push/SMS provider (Firebase FCM / Netgsm)
- [ ] API Platformu (3. parti entegrasyon)
- [ ] Çoklu dil (EN)

---

## Randevu Akışı

- `/randevu` → klinik seç → gün + saat → not → onay
- **Müsaitlik entegre**: `clinic_availability` tablosundan haftalık slot hesabı
  - Klinik pasif günler gizleniyor
  - `start_time`/`end_time`/`slot_duration_minutes` → otomatik slot üretimi
- **Dolu slot kontrolü**: `pending/confirmed/in_progress` randevular üzeri çizili gösterilir
- Müsaitlik tanımlanmamış klinikler için kullanıcıya uyarı

---

## Manuel Yapılacaklar (Kod Gerektirmeyen)

- [ ] Supabase → Auth → Providers → Google OAuth etkinleştir
- [ ] Vercel → Settings → Env → `OPENAI_API_KEY` ekle
- [ ] Vercel → Settings → Env → `CRON_SECRET` ekle
- [ ] Vercel → Settings → Env → `RESEND_API_KEY` ekle
- [ ] Sentry proje oluştur → DSN'leri Vercel'e ekle
- [ ] Stripe Dashboard → live mode → KYC tamamla

---

## Ürün Deneyimi İyileştirmeleri (Son Oturum)

### Skor Durumu Etiketi
- `src/lib/skor-durum.ts` — 3 durum tespiti
  - `tahmini` (amber) — yalnızca ön analiz
  - `guncelleniyor` (violet, pulse) — randevu/anket süreci aktif
  - `klinik_onayli` (emerald) — hekim onayı verildi
- Hasta panelinde EGSScoreBar üstünde durum badge'i

### Alışveriş Deneyimi
- **Kupon kodu:** `/api/checkout/validate-coupon` + OdemeFlow UI (Uygula/Kaldır)
- **Kargo:** ₺200 üstü ücretsiz, altı ₺29 (UI ve API tutarlı)
- **Ücretsiz kargo progress bar:** "₺X daha ekle, ücretsiz"
- **Sepet özetinde ürün görselleri**
- **Stok uyarıları (mağaza):**
  - `stock = 0` → "Tükendi" badge
  - `stock ≤ 5` → "Son X adet" amber pulse badge
- **Sipariş başarı celebration:** `SiparisSuccessOverlay` — 24 renkli confetti + scale-in kart, 3.5s auto fade-out

---

## Önemli Commit'ler

```
219269c  feat(alisveris): stok uyarısı + sipariş başarı celebration overlay
34c3f2a  feat(odeme): kupon kodu girişi + gerçek kargo ücreti + sepet özeti
6ff48b8  feat(panel): skor durumu etiketi (tahmini/güncelleniyor/klinik_onaylı)
a05eb64  feat(klinik): 6 adımlı klinik akış + 10 soru + 8 tetkik + ileri analiz
a7c2cc6  feat(AI): GPT-4 Vision + C250 formülü ile gerçek EGS skorlama
4c1a6db  feat(F2-8): Sentry hata izleme + API rate limiting
a9167cb  feat(F2-8): altyapı — Google OAuth, güvenlik başlıkları, admin kupon
6a3e235  feat(F2-6): affiliate + referral + kupon sistemi
b483978  feat(F2-5): oyunlaştırma — rozetler + streak sistemi
290f43b  feat(F2-4): bildirim altyapısı — notification_queue, Resend, Vercel cron
e84be9e  feat(F2-2): klinik takvim + müsaitlik ayarları
039fec5  feat(F2-1): marketplace olgunlaşma
434bd0e  feat(egs): Faz2 Sprint F2-3 - EGS Skor Zinciri
```
