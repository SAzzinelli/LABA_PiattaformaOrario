import CalendarView from '@/components/CalendarView'
import Header from '@/components/Header'
import { Location } from '@/lib/locations'
import { notFound } from 'next/navigation'

interface LocationPageProps {
  params: Promise<{ location: string }>
}

export default async function LocationPage({ params }: LocationPageProps) {
  const { location } = await params
  
  // Valida che la sede sia valida
  const validLocations: Location[] = ['badia-ripoli', 'via-vecchietti']
  if (!validLocations.includes(location as Location)) {
    notFound()
  }

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      <Header selectedLocation={location as Location} />
      <main className="container mx-auto px-2 py-2 flex-1 overflow-hidden flex flex-col">
        <CalendarView initialLocation={location as Location} />
      </main>
    </div>
  )
}

