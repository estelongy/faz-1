import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthHashHandler from '@/components/AuthHashHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Estelongy — Klinik Onaylı Cilt Gençlik Skoru',
    template: '%s | Estelongy',
  },
  description: 'Selfie ile ön analizini al. Longevity anketi ve klinik muayenesiyle Klinik Onaylı EGS (Estelongy Gençlik Skoru) sertifikası.',
  keywords: ['cilt analizi', 'klinik onaylı', 'EGS skoru', 'gençlik skoru', 'cilt yaşlanma', 'klinik', 'estetik', 'longevity'],
  metadataBase: new URL('https://estelongy.com'),
  openGraph: {
    title: 'Estelongy — Cilt Yaşınızı Öğrenin',
    description: 'Selfie ile ön analizi al, klinik onayıyla kesinleştir. Klinik Onaylı EGS (Estelongy Gençlik Skoru).',
    url: 'https://estelongy.com',
    siteName: 'Estelongy',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estelongy — Cilt Yaşınızı Öğrenin',
    description: 'Selfie ile ön analizi al, klinik onayıyla kesinleştir. Klinik Onaylı EGS skoru.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>
        <AuthHashHandler />
        {children}
      </body>
    </html>
  )
}
