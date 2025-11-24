import { redirect } from 'next/navigation'
import CalendarView from '@/components/CalendarView'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-laba-primary text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">LABA - Orario Lezioni</h1>
          <p className="text-gray-300 mt-2">Consulta gli orari delle lezioni settimanali</p>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <CalendarView />
      </main>
    </div>
  )
}

