import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthHashHandler from '@/components/AuthHashHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Estelongy — Gençlik Skoru Platformu',
    template: '%s | Estelongy',
  },
  description: 'Gençlik Skorunu (EGS) öğren. Selfie ön analizi, longevity anketi, tetkikler ve hekim değerlendirmesiyle Klinik Onaylı Gençlik Skoru sertifikası.',
  keywords: ['gençlik skoru', 'EGS', 'Estelongy Gençlik Skoru', 'klinik onaylı', 'longevity', 'biyolojik yaş', 'estetik klinik'],
  metadataBase: new URL('https://estelongy.com'),
  openGraph: {
    title: 'Estelongy — Gençlik Skorunu Öğren',
    description: 'Gençlik Skorunu (EGS) öğren. Ön analiz, longevity anketi ve klinik değerlendirmesiyle Klinik Onaylı Gençlik Skoru.',
    url: 'https://estelongy.com',
    siteName: 'Estelongy',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estelongy — Gençlik Skorunu Öğren',
    description: 'Klinik Onaylı Gençlik Skoru (EGS). Ön analiz, anket, tetkik ve hekim değerlendirmesi.',
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
