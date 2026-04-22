import type { MetadataRoute } from 'next'

const BASE_URL = 'https://estelongy.com'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    // ── Ana Sayfa ──────────────────────────────────────────────────────────
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },

    // ── Rehber (SEO — yüksek öncelik) ─────────────────────────────────────
    {
      url: `${BASE_URL}/rehber`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/rehber/estetik-uygulamalar`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/rehber/cihaz-tedavileri`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/rehber/longevity-nedir`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.85,
    },

    // ── Platform ───────────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/randevu`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/magaza`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },

    // ── Auth ───────────────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/giris`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/kayit`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },

    // ── İş Ortakları ───────────────────────────────────────────────────────
    {
      url: `${BASE_URL}/klinik/basvur`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/satici/basvur`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/kurumsal/giris`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },

    // ── Hakkında / Yasal ───────────────────────────────────────────────────
    {
      url: `${BASE_URL}/hakkinda/sss`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/hakkinda/iletisim`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/hakkinda/sozlesme`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/hakkinda/aydinlatma`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/hakkinda/cerez`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ]
}
