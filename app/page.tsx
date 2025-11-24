import CalendarView from '@/components/CalendarView'
import Header from '@/components/Header'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-6">
        <CalendarView />
      </main>
    </div>
  )
}

