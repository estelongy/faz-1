import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ön Analiz — Gençlik Skoru',
  description: 'Selfie ile ön Gençlik Skorunu (EGS) öğren. Klinik onayıyla kesinleşir.',
}

export default function AnalizLayout({ children }: { children: React.ReactNode }) {
  return children
}
