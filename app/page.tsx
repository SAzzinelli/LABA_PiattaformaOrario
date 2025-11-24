import CalendarView from '@/components/CalendarView'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-4 py-6 flex-1">
        <CalendarView />
      </main>
      <Footer />
    </div>
  )
}

