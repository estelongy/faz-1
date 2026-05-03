# CLAUDE.md — Estelongy Proje Rehberi

## Proje Özeti

**Estelongy** — Estetik sağlık alanında AI destekli klinik yönetim ve hasta takip platformu.  
**Stack:** Next.js 14 (App Router) · Tailwind · Supabase PostgreSQL (RLS) · OpenAI gpt-5.4-mini · Stripe · Resend · Sentry · Vercel

### Git & Deploy Akışı (ÖNEMLİ)

```
Production branch:  claude/priceless-ellis  →  estelongy-clean.vercel.app
```

**Canlıya çıkarmak için tek adım:**
1. Değişiklikleri `claude/priceless-ellis` branch'ine commit + push et → Vercel production build tetiklenir

**ASLA `main`'e push etme** — `main` Vercel'de production değil, push etmek sadece preview üretir ve işe yaramaz.

Build durumu: Vercel MCP `list_deployments` (projectId: `prj_qQ0N5SSfH8kqaY61qyiAFIOy9pVS`, team: `team_6KIGU5JvMoWBV5To6nncBNnc`)

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
/                        → Landing page (3 kapı: Analiz / Randevu / Mağaza)
/giris  /kayit           → Auth (girişli kullanıcı next param'a yönlenir)
/kurumsal/giris          → Klinik & Satıcı girişi (tek sayfa, tip seçimi)

/panel                   → Hasta paneli (3 bölge: Skor / Sıradaki Adım / Yönetim Grid)
/panel/hesabim           → Profil + telefon (SMS OTP) + şifre + hesabı sil
/panel/analizlerim       → Skor geçmiş grafiği + ziyaret zaman çizelgesi
/panel/randevularim      → Tüm randevular (iptal/QR)
/panel/siparislerim      → Sipariş listesi
/panel/iadelerim         → İade talepleri
/panel/adreslerim        → Adres yönetimi
/panel/referral          → Referral + komisyon
/panel/leaderboard       → Anonim skor sıralaması

/analiz                  → gpt-5.4-mini Vision + Estelongy Algoritması
/skor?analysisId=xxx     → Skor merkezi (3 kart: Anket / Randevu / Ürün) + ?open=anket|randevu|urun
/randevu                 → Klinik seç + müsaitlik + randevu
/magaza  /magaza/[slug]  → Ürün listesi + detay
/sepet  /siparis/[no]    → Sepet + sipariş detay/iade

/klinik/basvur           → Klinik başvuru
/klinik/panel            → Klinik yönetim (randevular, takvim, müsaitlik, rapor)
/satici/basvur           → Satıcı başvuru
/satici/panel            → Satıcı yönetim (ürünler, sipariş, kazanç, ödeme hesabı, iade)

/admin                   → Admin dashboard (kullanıcılar, klinikler, satıcılar, ürünler, kuponlar, iadeler)
/rehber                  → SEO hub + alt sayfalar
/hakkinda/*              → SSS, İletişim, Sözleşme, Aydınlatma, Çerez
```

> **Not:** `/anket` standalone sayfa **silindi**. Longevity anketi artık tek yerde: `/skor?analysisId=xxx&open=anket`. Tek soru kaynağı: `src/lib/anket-sorular.ts`.

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

**RPC:** `consume_jeton(p_clinic_id, p_appointment_id, p_description)` · `generate_referral_code(p_user_id)` · `decrement_product_stock` · `adjust_points(p_user_id, p_amount, p_type, p_reference_type, p_reference_id, p_description)`

**Kullanıcı Puan Sistemi:** `profiles.points_balance` (1 puan = 1 TL eşdeğeri) + `point_transactions` ledger (signup_bonus / referral_signup / referral_appointment / referral_order / gamification / redeem_shop / redeem_clinic / admin_adjust / refund_revert). Otomatik tetikleyiciler: yeni profil → +20 hoşgeldin (BEFORE INSERT trigger), randevu completed → davet eden'e +50 (AFTER UPDATE), sipariş paid → davet eden'e %5 (AFTER UPDATE). Referral attribution `profiles.referred_by`. Referans kodu kayıt sayfasında opsiyonel + `/r/[code]` redirect cookie set + `/kayit?ref=` URL param.

**Klinik Kredi Sistemi:** `clinics` tablosuna eklendi → `free_appointments_remaining` (default 20, Estelongy hediyesi), `appointment_credit_price` (numeric, şimdilik 1 TL placeholder), `paid_appointments_this_month`, `paid_mode_accepted_at`. `consume_jeton` RPC önce ücretsiz haktan, sonra `jeton_balance`'tan düşer. View: `clinics_with_credit_status` (total_credit_balance, credit_status: ok/warning/depleted). `/randevu` listesi `total_credit_balance > 0` filtresi uygular — krediler tükenmiş klinikler hasta yönlendirme dışı bırakılır.

---

## Env Variables

```
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY
OPENAI_API_KEY · STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
RESEND_API_KEY · CRON_SECRET · NEXT_PUBLIC_SENTRY_DSN · SENTRY_ORG · SENTRY_PROJECT
NETGSM_USER · NETGSM_PASSWORD · NETGSM_MSGHEADER
UPSTASH_REDIS_REST_URL · UPSTASH_REDIS_REST_TOKEN
```

> **SMS/OTP canlı:** Netgsm + Upstash Redis Production'da. `/api/otp/send` + `/api/otp/verify` aktif. `/kayit` flow'unda Phone OTP zorunlu. `/klinik/basvur` ve `/satici/basvur`'da yok.
> **Stripe:** Vestoriq OÜ Estonya kurulu → EUR bazlı, min €0.50 (~16 TL). 250 TL altı satışlar `amount_too_small` riski. Şu an test mode; live KYC Estonya vergi belgelerine bağlı.

---

## AI — gpt-5.4-mini Vision + Estelongy Algoritması

`POST /api/analiz` (rate limit: IP başına 5/saat) → Base64 → gpt-5.4-mini → 5 bileşen → EA → skor
Response: `{ ok, result, usedFallback, analysisId }` — analysisId frontend'de `/skor?analysisId=...` yönlendirmesi için kullanılır.

**Ağırlıklar:**

| Bileşen | Ağırlık | Yön |
|---------|---------|-----|
| hydration | 0.25 | yüksek = iyi |
| tone_uniformity | 0.25 | yüksek = iyi |
| wrinkles | 0.25 | ters (100−değer) |
| pigmentation | 0.15 | ters (100−değer) |
| under_eye | 0.10 | yüksek = iyi |

**Yaş faktörü:** ≤25→1.02 · ≤35→1.00 · ≤45→0.97 · ≤55→0.93 · 56+→0.88

---

## Longevity Anketi (Tek Kaynak)

**Yer:** `/skor?analysisId=xxx&open=anket` — tam ekran modal wizard
**DB:** `longevity_surveys` (answers JSONB) + `scores` (hasta_anket_puani)
**Soru kaynağı:** `src/lib/anket-sorular.ts`

**Hasta Anketi (5 soru, sıra: beslenme → cilt → uyku → stres → aktivite):**
- Slider 0-100 ölçek
- Tüm sorular "20 yaşınızdan bu yana ... 0-100 arasında puanlayın" formatında
- Wizard adımları: -1 (intro) → 0..4 (sorular) → submit
- **Ağırlıklı katkı (max +3.6 puan):**

| # | Soru | maxKatki |
|---|------|----------|
| 1 | 🥗 Beslenme | 0.9 |
| 2 | ✨ Cilt | 1.0 |
| 3 | 😴 Uyku | 0.7 |
| 4 | 🧘 Stres | 0.5 |
| 5 | 🏃 Aktivite | 0.5 |

`katki = (cevap/100) × maxKatki` — sabit `HASTA_ANKET_MAX_TOPLAM = 3.6`

**Klinik Ek Anketi (5 soru, klinik akışında):**
- sigara · alkol · aile_gecmisi · kronik_hastalik · gunes_maruziyeti
- Aynı 0-100 ölçek, ağırlıklı (max +3.6 — geçici, kullanıcı düzeltecek):

| # | Soru | maxKatki |
|---|------|----------|
| 1 | 🚭 Sigara | 1.1 |
| 2 | 🍷 Alkol | 0.5 |
| 3 | 👨‍👩‍👧 Aile geçmişi | 0.4 |
| 4 | 🏥 Kronik hastalık | 0.6 |
| 5 | ☀️ Güneş maruziyeti | 1.0 |

**Toplam klinik anketi (10 soru) max katkı: +7.2** (`klinikAnketPuani`, sabit `KLINIK_ANKET_MAX_TOPLAM`)

**Skor mantığı:**
- Hasta anketi dolmuşsa ve klinik anketinde aynı 5 soru yeniden cevaplanırsa hasta anket puanı düşülür, klinik toplamı eklenir
- Hasta anketi boşsa klinik anketi direkt eklenir
- Ek 5 klinik sorusu her zaman ek olarak eklenir

---

## Hasta Paneli Mimari (3 Bölge)

`/panel` sade ve net — 5 saniyede anlaşılır:

```
[1] SKOR DURUMU       Büyük skor barı + faz rozeti + "Skor Detayı →" link
[2] SIRADAKİ ADIM     Faza göre tek dinamik CTA (gradient kart)
[3] YÖNETİM GRID      8 ikonik kart (Hesabım/Analizler/Randevular/...)
```

**Sıradaki Adım CTA mantığı (`src/app/panel/page.tsx`):**
1. Hiç analiz yok → "İlk analizinizi yapın" → `/analiz`
2. Klinik onaylı → "Skorun hazır, paylaş veya yeniden ölç"
3. Aktif randevu var → "Randevunuz var: [tarih]" → `/panel/randevularim`
4. Anket dolu, randevu yok → "Klinik randevusu alın" → `/randevu`
5. Ön analiz var, anket yok → "Anketinizi doldurun, +10 puan" → `/skor?...&open=anket`

**Geçmiş analizler ve ziyaret zaman çizelgesi** panelden çıktı, `/panel/analizlerim`'e taşındı.

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

**Başlangıç katalog değerleri** (treatments tablosu kurulduğunda seed olacak):
- HA Dolgu **9.2** · Skin Booster **8.5** · Botoks **7.0** · Altın İğne **6.5**
- Güneş Koruyucu (genel) **8.5**

---

## Geliştirme Kuralları

- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` **KULLANMA**
- `router.refresh()` → insert/update sonrası cache temizleme
- Auth callback `next` param: sadece `/` ile başlıyorsa geçerli (open redirect koruması)
- AI down → fallback skor göster, sessiz başarısızlık yok
- Server action'larda `redirect()` try/catch **dışında** olmalı

---

## Bekleyen Görevler — Sıralı Öncelik

### 🥇 1. Tetkik Puanı Algoritması (Sıradaki — Aktif İş)
Skor algoritmasının kalan parçası. Anket bitti, şimdi tetkik.
- [ ] `src/lib/tetkik-params.ts` parametre listesi gözden geçirilecek
- [ ] Her parametre için skor katkısı kuralı belirlenecek (referans aralığı içi/dışı, yakınlık etkisi)
- [ ] Tetkik max toplam katkısı belirlenecek (anket gibi 3.6 mı, daha fazla mı?)
- [ ] `scores.tetkik_puani` kolonuna otomatik yazılacak
- [ ] Hekim onayı %15 ağırlık formülü netleştirilecek (mevcut: `final = ara_toplam × 0.85 + hekim × 0.15`)

### 🥈 2. Bildirim Sistemi (Aktif)
- [x] `/api/notifications/process` cron **günlük 09:00** (`0 9 * * *`) — Vercel Hobby plan kısıtı (Pro: saatlik)
- [x] Randevu klinik tarafından onaylanınca → anında `appointment_confirmed` (e-posta + SMS) enqueue
- [x] 24h önce → `appointment_reminder_24h` (e-posta + SMS) scheduled
- [x] Score update bildirimi (e-posta + SMS) — KlinikAkışWizard hekim onay step'inden enqueue
- [x] SMS altyapısı — Netgsm `sendInfoSms` (`/sms/rest/v2/send`) + Upstash Redis (OTP)
- [ ] `RESEND_API_KEY` Vercel'e eklenmeli (Manuel) — yoksa e-posta sessiz başarısız
- [ ] **1h hatırlatma** — Vercel Pro'ya geçince saatlik cron eklenecek (şimdilik atlandı)
- [ ] Hekim önerileri değişince ayrı bildirim (procedure_notes/recommendations diff trigger)
- [ ] Push notification (FCM) — Faz 3

### 🥉 3. Sentry Kurulumu (Manuel — kod yok, 10 dk)
Production hata yakalama. Şu an `@sentry/nextjs` paketi yüklü ve `sentry.*.config.ts` dosyaları hazır, AMA env var yok → hatalar uçuyor.
- [ ] sentry.io'da "estelongy" projesi yarat → DSN al
- [ ] Vercel env'e ekle: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_ORG`, `SENTRY_PROJECT`
- [ ] Bir test hatası fırlat, dashboard'da görünüyor mu kontrol et

### 4. SEO — Manuel İşler (kod tamam, 5 dk)
Profesyonel SEO altyapısı kuruldu (JSON-LD, dynamic sitemap, manifest, robots, breadcrumbs). Geriye sadece dış servis kayıtları kaldı.
- [ ] **Google Search Console** → property ekle (`estelongy.com`) → verification kodu al → Vercel env'e `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` ekle
- [ ] Search Console'a `https://estelongy.com/sitemap.xml` submit et
- [ ] **Bing Webmaster Tools** kayıt (Türkiye'de %10 pazar payı)
- [ ] `src/app/layout.tsx` içindeki `sameAs` URL'lerini gerçek sosyal medya hesaplarıyla güncelle (şu an placeholder: instagram/twitter/linkedin)
- [ ] Ürün listesi (`/magaza`) ve detay (`/magaza/[slug]`) sayfalarındaki `<img>` etiketleri `next/image` ile değiştirilecek (build warning + LCP iyileştirme)
- [ ] `/rehber/*` makaleleri için `opengraph-image.tsx` template (her makale için özel OG görseli)
- [ ] Klinik sayfası açılırsa (`/klinik/[slug]`) → sitemap'e ekle + LocalBusiness JSON-LD

### 5. EGS → Skor Rename (Kozmetik temizlik)
Component/type rename'leri yapılmış. Sadece yorumlar ve dosya adı kalmış (kullanıcı UI'da hiç "EGS" görmüyor).
- [x] `EGSScoreBar` → `ScoreBar`, `EGSScoreChart` → `ScoreChart`, `EGSFixedBadge` → `ScoreFixedBadge`
- [x] `EGSPhase` → `ScorePhase`
- [ ] `src/lib/egs.ts` dosya adı → `src/lib/skor.ts` rename + tüm import'ların güncellenmesi
- [ ] 8 yerde kalan EGS yorumları temizlenecek
- [ ] Tetkik params'ta "EGS toplam skora katkı" yorumu güncellensin
- [ ] SEO meta, OG image, PaylasModal'da kalan EGS metinleri (varsa) kontrol edilecek

### 6. Diğer Manuel (Kod Gerektirmeyen)
- [ ] Supabase → Auth → Google OAuth etkinleştir
- [ ] Vercel Env: `OPENAI_API_KEY` · `CRON_SECRET` · `RESEND_API_KEY`
- [ ] Stripe live mode → Vestoriq OÜ Estonya vergi belgeleri tamam olunca KYC
- [ ] Vercel iki proje karışıklığı (`faz1` vs `faz-1`) — birini sil, domain tek projede toplansın
- [ ] **Klinik ek anketi ağırlıkları** bilimsel araştırma ile finalize edilecek (şu an geçici: 1.1/0.5/0.4/0.6/1.0)

### 7. Ziyaret Akışı İyileştirmeleri
- [ ] Klinik akışı tamamlanınca `analyses.appointment_id` otomatik dolsun (şu an manuel backfill gerekti)
- [ ] "İşlem sonrası takip" — hasta 10 gün sonra yeni ön analiz yaptığında, sonraki randevuya otomatik ilişkilendir ve öncekinin kartında "takip sonucu" olarak göster
- [ ] Kart içinde "öncekine göre" grafik mini-sparkline (nem, kırışıklık trend)

### 8. Hesabım Tamamlama
- [ ] **Hesabı sil** şu an `is_active=false` set ediyor — gerçek silme için service role admin endpoint (Faz 2)
- [ ] **E-posta değişikliği** şu an "destek ekibiyle iletişime geç" placeholder — Supabase auth.updateUser({ email }) ile flow eklenecek

### 9. Klinik Deneyim Sistemi — "Hekim Dostu Model"

**Felsefe:** Estelongy yorum platformu değil, ölçüm platformudur. Hekim sanatı **puanlanmaz**, sonucu sistem ölçer. Yıldızlı yorumdan kaçınıp **tacir kliniği veriden ayrıştıran** sinyaller kullanılır. Hedef yol: **akreditasyon** ama 3 fazlı.

#### Yorum formu (randevu completed sonrası)

**Puanlanan boyutlar (sadece objektif, 1-5 ★):**
- 🧹 Klinik hijyeni & ortam
- 👥 Karşılama & personel
- ⏱️ Randevu uyumu
- 💬 Bilgilendirme & iletişim

**Puanlanmayan ama sorulan:**
- 💚 NPS — "Tavsiye eder misin?" (0-4 ölçek)
- 🛡️ Tacir filtresi — "Sana ihtiyacın olmayan işlem önerildi mi?" (yes/no)
- 🔁 Sadakat — "Aynı işlem için tekrar gelir miydin?" (evet/belki/hayır)

**Serbest metin (opsiyonel):**
- ✅ İyi olan tarafı?
- ⚠️ İyileştirilmesi gereken?
- ☐ Anonim paylaşım toggle

**Hekim sanatı / sonuç memnuniyeti ASLA puanlanmaz.** Sonuç sistem tarafından otomatik ölçülür: `klinik_onayli_skor − on_analiz_skor` farkı.

#### Klinik EGP formülü (REVİZE)

```
Klinik EGP = Sonuç Etkinliği    × 0.35   ← skor Δ (objektif, hasta beyanı değil)
           + NPS Score          × 0.25   ← bipolar memnuniyet
           + Operasyonel Puan   × 0.20   ← 4 yıldız ortalaması
           + Estelongy Onayı    × 0.15   ← editöryel/sertifika
           + Profesyonellik     × 0.05   ← hekim deneyimi, lisans

× confidence_factor  (yorum sayısı 5'ten azsa Bayesian smoothing)
× son 6 ay zaman ağırlığı
```

**Tercih sıklığı EGP'ye GİRMEZ** — ayrı `popularity_score` kolonu, listede tiebreaker + rozet ("🔥 Bu ay 87 randevu").

**Bölge** — EGP global hesaplanır, listeleme şehir/ilçe öncelikli, iki rozet ("Kadıköy'ün en iyisi" + "Türkiye Top 20").

#### Akreditasyona Giden Yol — 3 Faz

**🥇 Faz 1: Ölçüm Dönemi (6-12 ay)**
- Veri toplama, sertifika YOK
- Yorum formu canlıya alınır
- Otomatik veri rozetleri: 📈 Yüksek sonuç etkinliği · 💚 Yüksek tavsiye · 🛡️ Doğru endikasyon (>%90)
- Hedef: 50-100 aktif klinik, 1000+ değerlendirilmiş randevu

**🥈 Faz 2: Algoritmik Rozet (12-18 ay sonra)**
- Veri olgunlaşınca otomatik kademeleme
- 🥉 Estelongy Onaylı / 🥈 Önerilen / 🥇 Premium
- Henüz "akreditasyon" değil, başvuru süreci yok — algoritma rozet üretir
- İhlalde otomatik geri alınır

**💎 Faz 3: ELS — Estelongy Longevity Standartları (2-3 yıl sonra)**
- Kurumsal sertifika kuruluşu — SKS modelinde
- 4 seviye: 🥉 Bronze → 🥈 Silver → 🥇 Gold → 💎 Platinum
- Başvuru, denetim, yıllık yenileme
- Tıbbi danışma kurulu + hukuki altyapı
- **Estelongy'nin asıl moat'ı bu** — başkası kopyalayamaz çünkü standartı sen koyuyorsun

**Felsefi pozisyon:**
> "Yemeksepeti restoran sıralıyor. Estelongy klinik akrediteliyor. SKS'in longevity versiyonuyuz."

#### DB Şeması (Faz 1'de oluşturulacak)

```sql
CREATE TABLE clinic_reviews (
  id, appointment_id (UNIQUE), clinic_id, user_id,
  -- Operasyonel (1-5)
  hygiene_rating, staff_rating, punctuality_rating, communication_rating,
  -- Tacir filtresi
  nps_score          smallint CHECK (BETWEEN 0 AND 4),
  unnecessary_offered boolean,                    -- "ihtiyacım olmayan iş önerildi mi"
  would_return       text CHECK (IN ('yes','maybe','no')),
  -- Metin
  positive_text, improvement_text, is_anonymous,
  -- Klinik cevabı
  clinic_response, clinic_responded_at, clinic_responded_by,
  -- Moderasyon
  is_hidden, reported_count,
  created_at, updated_at
);

ALTER TABLE clinics ADD COLUMN
  egp                  numeric(3,1),
  popularity_score     int,
  result_effectiveness numeric(4,2),  -- ortalama skor Δ
  nps_score            int,
  operational_avg      numeric(3,1),
  els_level            text,           -- bronze|silver|gold|platinum (Faz 3)
  els_certified_until  date;
```

#### Faz 1 İş Listesi
- [ ] `clinic_reviews` tablosu + RLS politikaları + indexler
- [ ] `/panel/randevularim/[id]/degerlendir` sayfası (yorum formu)
- [ ] Yorum kaydetme server action (7 gün düzenleme penceresi)
- [ ] `clinics` tablosuna agregate kolonları + cron (günlük EGP hesaplama)
- [ ] Klinik public sayfası `/klinik/[slug]` (yorum listesi + EGP rozeti + alt boyutlar)
- [ ] Randevu listesinde klinik kartında EGP gösterimi
- [ ] Klinik panelinde yorum listesi + tek-seferlik cevap hakkı
- [ ] Otomatik veri rozeti sistemi (📈/💚/🛡️)
- [ ] Bildirim entegrasyonu — randevu completed + 6 saat sonra "deneyimini paylaş" e-postası (bildirim sistemi tamamlandıktan sonra)

> **Sıralama:** Bu iş **bildirim sisteminden sonra** başlar (çünkü yorum tetikleyici e-posta gerekir). Tetkik algoritması → bildirim → klinik deneyim sistemi.

### Faz 3
- [ ] Mobil App (React Native / Expo)
- [ ] Redis (Upstash) — rate limiting prod
- [ ] Push/SMS provider (FCM / Netgsm)
- [ ] AI fine-tuning
- [ ] API Platformu · Çoklu dil (EN)
- [ ] EGP UI: mağaza rozeti + sıralama + "nasıl hesaplandı" şeffaflık
- [ ] Misafir checkout (geçici şifreyle hesap oluşturma) — şu an üyelik zorunlu
- [ ] **ELS — Estelongy Longevity Standartları** (akreditasyon kuruluşu) — bkz. Madde 9 Faz 3

---

## ✅ Tamamlanan Yapısal İşler (referans)

- **Anket sistemi:** İki ayrı flow (`/anket` + `/skor`) tek sistemde birleştirildi → `/anket` silindi
- **Soru sıralaması:** beslenme → cilt → uyku → stres → aktivite (kullanıcı kararı)
- **Soru metinleri:** "20 yaşınızdan bu yana ..." formatında, 0-100 ölçek
- **Skor merkezi (`/skor`):** Tam ekran modal kart sistemi (Anket / Randevu / Ürün), `?open=` query param desteği
- **Panel mimari:** 3 bölge (Skor Durumu / Sıradaki Adım / Yönetim Grid), 565 → 270 satır
- **Yeni alt sayfalar:** `/panel/hesabim`, `/panel/analizlerim`, `/panel/randevularim`
- **Hesabım:** Profil düzenle + telefon SMS OTP + şifre değiştir + hesap pasifleştir
- **Landing kapıları:** Kapı 1 ve 2 → `/giris?next=...` (girişli kullanıcı next'e yönlenir)
- **Production branch:** `claude/priceless-ellis` (main silindi, GitHub default değiştirildi)
- **SMS/OTP altyapısı:** Netgsm + Upstash Redis Production, `/api/otp/send` + `/verify` canlı
- **Stripe Connect:** test mode aktif (live KYC Vestoriq Estonya belgelerine bağlı)
- **AI:** `gpt-5.4-mini` Vision Production'a entegre, fallback Math.random + `usedFallback: true`
