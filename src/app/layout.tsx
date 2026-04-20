import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthHashHandler from '@/components/AuthHashHandler'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Estelongy — Yapay Zeka Destekli Cilt Yaşlanma Analizi',
    template: '%s | Estelongy',
  },
  description: 'Selfie ile biyolojik cilt yaşınızı öğrenin. EGS (Estelongy Gençlik Skoru) ile AI analizi, longevity anketi ve klinik onaylı sertifika.',
  keywords: ['cilt analizi', 'yapay zeka', 'EGS skoru', 'cilt yaşlanma', 'klinik', 'estetik'],
  metadataBase: new URL('https://estelongy.com'),
  openGraph: {
    title: 'Estelongy — Cilt Yaşınızı Öğrenin',
    description: 'Selfie ile biyolojik cilt yaşınızı öğrenin. AI analizi ve klinik onaylı EGS skoru.',
    url: 'https://estelongy.com',
    siteName: 'Estelongy',
    locale: 'tr_TR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Estelongy — Cilt Yaşınızı Öğrenin',
    description: 'Selfie ile biyolojik cilt yaşınızı öğrenin. AI analizi ve klinik onaylı EGS skoru.',
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
