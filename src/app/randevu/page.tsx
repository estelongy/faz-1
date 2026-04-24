'use client'

import { useSearchParams } from 'next/navigation'
import RandevuFlow from '@/components/RandevuFlow'

export default function RandevuPage() {
  const searchParams = useSearchParams()
  return (
    <RandevuFlow
      preselectedClinicId={searchParams.get('k')}
      preselectedTip={searchParams.get('tip')}
    />
  )
}
