/** @type {import('next').NextConfig} */
const nextConfig = {
  // Görsel optimizasyonu: Supabase + Vercel blob'larına izin ver
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.vercel-storage.com' },
    ],
  },

  // Güvenlik başlıkları
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // XSS koruması
          { key: 'X-Content-Type-Options',   value: 'nosniff' },
          { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
          { key: 'X-XSS-Protection',          value: '1; mode=block' },
          { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
          // HSTS (Vercel HTTPS enforce)
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
          // İzin politikası — kamerayı yalnızca analiz sayfasında kullan
          { key: 'Permissions-Policy',        value: 'camera=(self), microphone=(), geolocation=()' },
        ],
      },
      // API route'larına cache yok
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ]
  },

  // Webpack: Sentry yüklenirse source map gönder
  // (Sentry paketi eklendiğinde otomatik devreye girer)
  experimental: {
    serverActions: {
      // Server action body limit: 4MB (selfie upload için)
      bodySizeLimit: '4mb',
    },
  },
}

export default nextConfig
