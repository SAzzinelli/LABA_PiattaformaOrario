import CalendarView from '@/components/CalendarView'
import Header from '@/components/Header'
import { getLessons } from '@/lib/db'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const initialLessons = await getLessons()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="container mx-auto px-2 py-6 flex-1">
        <CalendarView initialLessons={initialLessons} />
      </main>
    </div>
  )
}

