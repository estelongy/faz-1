import { redirect } from 'next/navigation'

// Sidebar'dan "Randevular" linkine gelince mevcut takvim görünümüne yönlendir
export default function RandevularPage() {
  redirect('/klinik/panel/takvim')
}
