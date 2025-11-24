// Corsi triennali (3 anni)
export const TRIENNALI = [
  'Graphic Design & Multimedia',
  'Regia e Videomaking',
  'Fashion Design',
  'Fotografia',
  'Design',
  'Pittura',
] as const

// Corsi biennali (2 anni)
export const BIENNALI = [
  'Interior Design',
  'Cinema e Audiovisivi',
] as const

// Tutti i corsi
export const ALL_COURSES = [...TRIENNALI, ...BIENNALI] as const

export type Course = typeof ALL_COURSES[number]

// Funzione per ottenere gli anni disponibili per un corso
export function getYearsForCourse(course: Course): number[] {
  if (TRIENNALI.includes(course as typeof TRIENNALI[number])) {
    return [1, 2, 3]
  }
  if (BIENNALI.includes(course as typeof BIENNALI[number])) {
    return [1, 2]
  }
  return []
}

// Funzione per verificare se un corso è triennale
export function isTriennale(course: Course): boolean {
  return TRIENNALI.includes(course as typeof TRIENNALI[number])
}

// Funzione per verificare se un corso è biennale
export function isBiennale(course: Course): boolean {
  return BIENNALI.includes(course as typeof BIENNALI[number])
}

