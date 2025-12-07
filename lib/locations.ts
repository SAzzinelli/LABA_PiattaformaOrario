// Definizione delle sedi LABA

export type Location = 'badia-ripoli' | 'via-vecchietti'

export interface LocationInfo {
  id: Location
  name: string
  address: string
  courses: string[] // Corsi disponibili in questa sede
}

export const LOCATIONS: Record<Location, LocationInfo> = {
  'badia-ripoli': {
    id: 'badia-ripoli',
    name: 'Piazza di Badia a Ripoli',
    address: 'Piazza di Badia a Ripoli',
    courses: [
      'Graphic Design & Multimedia',
      'Regia e Videomaking',
      'Fotografia',
      'Design',
      'Pittura',
      'Interior Design',
      'Cinema e Audiovisivi',
      // Fashion Design NON è incluso
    ],
  },
  'via-vecchietti': {
    id: 'via-vecchietti',
    name: 'Via de Vecchietti',
    address: 'Via de Vecchietti',
    courses: [
      'Fashion Design', // Solo Fashion Design
    ],
  },
}

// Funzione per ottenere i corsi disponibili per una sede
export function getCoursesForLocation(location: Location): string[] {
  return LOCATIONS[location].courses
}

// Funzione per verificare se un corso è disponibile in una sede
export function isCourseAvailableInLocation(course: string, location: Location): boolean {
  return LOCATIONS[location].courses.includes(course)
}

// Funzione per ottenere il nome della sede
export function getLocationName(location: Location): string {
  return LOCATIONS[location].name
}


