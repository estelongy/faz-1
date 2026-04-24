# CLAUDE.md — Estelongy Proje Rehberi

## Proje Özeti

**Estelongy** — Estetik sağlık alanında AI destekli klinik yönetim ve hasta takip platformu.  
**Stack:** Next.js 14 (App Router) · Tailwind · Supabase PostgreSQL (RLS) · OpenAI GPT-4o · Stripe · Resend · Sentry · Vercel

### Git & Deploy Akışı

```
Production branch:  claude/priceless-ellis  →  estelongy-clean.vercel.app
```

Vercel production branch ayarı `claude/priceless-ellis` yapıldı. Branch'e her push direkt production'a gider — merge/main adımı **yok**.

**Canlıya çıkarmak:**
1. `claude/priceless-ellis` worktree'sinde commit + `git push origin claude/priceless-ellis`
2. Build durumu: Vercel MCP `list_deployments` (projectId: `prj_qQ0N5SSfH8kqaY61qyiAFIOy9pVS` — `faz-1`, team: `team_6KIGU5JvMoWBV5To6nncBNnc`)

Main branch kullanılmıyor, unutulabilir.

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
/giris  /kayit           → Auth (kayıt artık Phone OTP zorunlu)
/panel                   → Hasta paneli (Güncel Analiz + Önceki Analizler + üst sabit skor rozeti)
/panel/referral          → Referral + komisyon
/panel/leaderboard       → Anonim skor sıralaması
/skor                    → Skor Merkezi (sticky gauge + anket wizard + hızlı randevu + ürün vitrini)
/skor?analysisId=X       → Belirli bir analiz için skor merkezi
/analiz                  → GPT-4 Vision + C250 analiz (biter bitmez /skor'a yönlendirir)
/anket                   → Longevity anketi (eski, /skor'da wizard olarak gömülü)
/randevu                 → Klinik filtre + takvim + onay (RandevuFlow bileşeni)
/magaza  /magaza/[slug]  → Ürün listesi + detay
/sepet  /siparis/[no]    → Sepet + sipariş detay/iade
/klinik/basvur           → Klinik başvuru (SMS OTP yok — admin onay yeterli)
/klinik/panel            → Klinik yönetim (randevular, takvim, müsaitlik, rapor)
/satici/basvur           → Satıcı başvuru
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
profiles.phone_verified    → boolean DEFAULT false  (OTP doğrulama sonrası true)
profiles.birth_year        → smallint (analiz için zorunlu, kayıtta alınır)
```

**RPC:** `consume_jeton(p_clinic_id, p_appointment_id)` · `generate_referral_code(p_user_id)` · `decrement_product_stock` · `set_user_role(target_user_id, new_role)`

**Trigger:** `trg_add_default_availability` — yeni klinik eklendiğinde `clinic_availability`'ye Pzt-Cmt 09:00-18:30, 30dk slot default ekler.

---

## Env Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL · NEXT_PUBLIC_SUPABASE_ANON_KEY · SUPABASE_SERVICE_ROLE_KEY

# AI & Payment
OPENAI_API_KEY · STRIPE_SECRET_KEY · STRIPE_WEBHOOK_SECRET · NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

# Email & Cron & Monitoring
RESEND_API_KEY · FROM_EMAIL · CRON_SECRET · NEXT_PUBLIC_SENTRY_DSN · SENTRY_ORG · SENTRY_PROJECT

# Netgsm OTP SMS (Vercel Production'da ayarlı)
NETGSM_USERCODE · NETGSM_PASSWORD · NETGSM_MSGHEADER  (DRIGOK)

# Upstash Redis (OTP rate limit + kod saklama)
UPSTASH_REDIS_REST_URL · UPSTASH_REDIS_REST_TOKEN
```

---

## AI — GPT-4 Vision + C250

`POST /api/analiz` (rate limit: IP başına 5/saat) → Base64 → GPT-4o → 5 bileşen → C250 → skor

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

## Phone OTP (Netgsm) — Kayıt Doğrulama

Kayıt sırasında telefon doğrulaması zorunlu. Giriş'te SMS yok (normal email+password).

- **Endpoints:**
  - `POST /api/otp/send` — body `{ phone }` → SMS gönderir, Redis'e 5 dk TTL kod yazar
  - `POST /api/otp/verify` — body `{ phone, code }` → kodu kontrol eder, login'liyse `profiles.phone_verified=true`
- **Client bileşen:** `src/components/PhoneOtpStep.tsx` — autoSend, resend cooldown (3 dk, `mm:ss` format), 5 yanlış deneme limit
- **Netgsm helper:** `src/lib/netgsm.ts` — `sendOtpSms`, `normalizePhone`, `generateOtpCode`, `mapNetgsmError`
  - Endpoint: `https://api.netgsm.com.tr/sms/rest/v2/otp` (Basic auth)
  - Telefon: `5XXXXXXXXX` (10 hane, 0/+90 sıyrılır)
  - Mesaj: **Türkçe karaktersiz** — `"ESTELONGY ile Genclik yolculuguna hos geldiniz! Dogrulama kodunuz: XXXXXX"`
  - Önkoşul (Netgsm): API Kullanıcısı alt hesabı + OTP SMS paketi aktif + `DRIGOK` başlığı onaylı
- **Redis (Upstash):**
  - `otp:code:{phone}` — kod, TTL 300s
  - `otp:attempts:{phone}` — yanlış deneme sayacı
  - `ratelimit:otp:min` — 1 istek / 3 dk (aynı telefon)
  - `ratelimit:otp:hour` — 5 istek / saat

Kayıt akışında doğrulama sonrası `/api/kayit` çağrılır — `phone_verified=true` profile'a yazılır. Klinik ve satıcı başvurularında OTP yok, admin onayı yeterli (sahte başvuruyu admin filtreliyor).

---

## Skor Merkezi (/skor)

Tek sayfada birleşik kullanıcı deneyimi — analiz bitince buraya yönlendirilir.

- **Yapı (lg breakpoint):**
  - **Sol (3fr, sticky):** skor gauge + biyolojik yaş (tek satır inline) + 4 cilt metriği (yatay)
  - **Sağ (2fr):** 3 dikey aksiyon kartı (Anket / Hızlı Randevu / Hızlı Ürün)
  - Kart tıklanınca `inset-x-0` ile tüm container'ı kaplar, backdrop ile kapanır
- **Kartlar:**
  - **Longevity Anketi** — AnketWizard (tek soru, emoji + 2xl başlık + 4xl değer, ileri/geri, noktalı ilerleme). Slider hareket ettikçe sol gauge canlı günceller (`previousScore` + "Skorunuz güncelleniyor" chip).
  - **Hızlı Randevu** — 8 klinik vitrini; tıklayınca `RandevuFlow embedded` başlar (gün/saat/onay). Alt CTA: "Başka bir klinik arıyorum" → `/randevu`
  - **Hızlı Ürün** — 8 ürün vitrini (görsel + isim + fiyat + EGP). Alt CTA: "Mağazaya göz atmak istiyorum" → `/magaza`
- **URL param:** `/skor?analysisId=<uuid>` belirli bir analizi gösterir (önceki analizler panel'den buradan açılır).
- **Biyolojik yaş formülü (PLACEHOLDER):** `scoreToApparentAge(score) = round(18 + (100 - score) × 0.74)` — gerçek algoritma Faz 2.

---

## Öneri Sistemi (src/lib/recommendations.ts) — İki Aşamalı

**Aşama 1 (TASLAK):** Skor zonu → işlem ve ürün anahtarları (statik mapping). `ZONE_RECOMMENDATIONS` objesinde 5 zon için kontrol edilmiş vocabulary:
- `cok_dusuk` (<55) — **tüm menü açık dahil cerrahi** (agresif yoğunluk). Doldu.
- `dusuk` (56-65) — orta-yoğun klinik + medikal ürün (aktif yoğunluk). Doldu.
- `normal` / `iyi` / `cok_iyi` — **TODO** (çift amaçlı işlemler her zone'da olabilir: preventif_botox, profhilo, prp, mesoterapi, hidrafacial, led_terapi — frekans farkı).

**İşlem vokabüleri (`IslemKey`):** 40+ anahtar — lazer, enjeksiyon, sıkılaştırma, cerrahi (yüz germe, blefaroplasti, rinoplasti, lipoenjeksiyon...), peeling, bakım. `ISLEM_LABELS` map ile UI etiketi.

**Ürün kategorileri (`UrunKategori`):** 19 kategori — retinol (3 doz), C vit, niasinamid, hyaluronik, peptit, SPF, takviyeler. `URUN_LABELS`.

**Aşama 2 (TODO — eşleştirme):** `clinic.specialties` içinde zone'un önerdiği işlemler → klinik filtreleme. Ayrıca metrik bazlı top 3 işlem seçimi (en zayıf metriğe göre) — "Sana özel önerimiz" vitrini.

**UX kararı:** Skor 50 gibi düşük bir kişiye 30+ öneri çıkarmak yerine "100+ öneri bulduk, en uygun 3'ü bunlar, bu uzmanlarla görüşün" pattern'i.

---

## Klinik Default Müsaitlik

Yeni klinik oluştuğunda trigger otomatik doldurur: Pazartesi-Cumartesi, 09:00-18:30, 30 dk slot. Admin panelde klinik istediği zaman değiştirebilir.

---

## Geliştirme Kuralları

- `'use client'` bileşenlerinde `export const dynamic = 'force-dynamic'` **KULLANMA**
- `router.refresh()` → insert/update sonrası cache temizleme
- Auth callback `next` param: sadece `/` ile başlıyorsa geçerli (open redirect koruması)
- AI down → fallback skor göster, sessiz başarısızlık yok
- Server action'larda `redirect()` try/catch **dışında** olmalı

---

## Bekleyen Görevler

### Öneri Sistemi (Yapılacak — recommendations.ts)
- [ ] `normal` / `iyi` / `cok_iyi` zonları için işlem + ürün listesi doldurulacak
- [ ] Çift amaçlı işlemlerin her zone'da frekans önerisi (yıllık/aylık)
- [ ] Klinik eşleştirme: `clinic.specialties` ↔ önerilen işlem anahtarları
- [ ] Metrik bazlı top-3 seçim: en zayıf 2-3 cilt metriğine göre öncelikli işlem önerisi
- [ ] UI: Skor Merkezi'nde "Sana özel 3 öneri + bu uzmanlarla görüş" vitrini

### Biyolojik Yaş (Yapılacak)
- [ ] `scoreToApparentAge()` gerçek algoritma (şu an placeholder) — C250 zaten skor→yaş dönüştürücü olarak tasarlanmış, mapping tablosu belirlenecek

### Rename (Yapılacak — düşük öncelik, mevcut bileşenler çalışıyor)
- [ ] Tüm "EGS" → "Skor" / "Estelongy Gençlik Skoru ®"
- [ ] `EGSScoreBar` → `ScoreBar` · `EGSScoreChart` → `ScoreChart` (zaten rename edildi, kontrol et)
- [ ] `EGSPhase` type → `ScorePhase`
- [ ] SEO meta, OG image, PaylasModal, landing page metinleri

### Manuel (Kod Gerektirmeyen)
- [ ] Supabase → Auth → Google OAuth etkinleştir
- [ ] Vercel Env: `RESEND_API_KEY` + `FROM_EMAIL` → welcome email ve kuyruk mailleri aktif olur
- [ ] Sentry proje → DSN'leri Vercel'e ekle
- [ ] Stripe live mode → KYC tamamla
- [ ] Netgsm panel: OTP SMS paket kontörünü izle (biter → SMS gitmez)

### Ziyaret Akışı İyileştirmeleri (Yapılacak)
- [ ] Klinik akışı tamamlanınca `analyses.appointment_id` otomatik dolsun (şu an manuel backfill gerekti)
- [ ] "İşlem sonrası takip" — hasta 10 gün sonra yeni ön analiz yaptığında, sonraki randevuya otomatik ilişkilendir
- [ ] Hekim önerileri değişince hastaya bildirim (notification_queue)
- [ ] Kart içinde "öncekine göre" grafik mini-sparkline

### Bildirim Sistemi (Yapılacak)
- [ ] Randevu alınınca hastaya e-posta (şu an kuyruğa yazılıyor, cron tetiklenmiyor)
- [ ] Randevu onaylanınca hastaya e-posta — `/api/notifications/process` cron bağlantısı
- [ ] Randevu SMS bildirimi — Netgsm'in normal SMS endpoint'iyle (`/sms/rest/v2/send`, Türkçe destekli, OTP farklı)
- [ ] Welcome email test edilmeli (Resend key girilince)

### Phone OTP Genişletme (Opsiyonel)
- [ ] Girişsiz randevu alan kullanıcı için: `RandevuOnayModal` email OTP yerine (ya da yanına) phone OTP sekmesi eklenebilir

### Faz 3
- [ ] Mobil App (React Native / Expo)
- [ ] Push provider (FCM)
- [ ] AI fine-tuning
- [ ] API Platformu · Çoklu dil (EN)
- [ ] EGP UI: mağaza rozeti + sıralama + "nasıl hesaplandı" şeffaflık
