// Colonne calendario Badia: Magna 1, Magna 2, Conference 1, Conference 2 separate (no collapse)
export const BADIA_CALENDAR_COLUMNS = [
  'Magna 1',
  'Magna 2',
  'Conference 1',
  'Conference 2',
  'Photo LAB 1',
  'Photo LAB 2',
  'Visual HUB',
  'Movie Hall',
  '3D LAB',
  'Multimedia LAB',
  'Digital HUB',
  'Design LAB',
  'Pittura',
  'Tecn. Grafiche',
  'Studio 1',
  'Studio 2',
  'Studio 3',
] as const

// Aule per Piazza di Badia a Ripoli (include varianti per backward compat e form)
export const CLASSROOMS_BADIA_RIPOLI = [
  'Aula Magna',
  'Magna 1',
  'Magna 2',
  'Conference',
  'Conference 1',
  'Conference 2',
  'Conference 1+2',
  'Magna 1+2',
  'Photo LAB 1',
  'Photo LAB 2',
  'Visual HUB',
  'Movie Hall',
  '3D LAB',
  'Multimedia LAB',
  'Digital HUB',
  'Design LAB',
  'Pittura',
  'Tecn. Grafiche',
  'Studio 1',
  'Studio 2',
  'Studio 3',
] as const

// Aule per Via de Vecchietti
export const CLASSROOMS_VIA_VECCHIETTI = [
  'Atelier',
  'Bottega',
  'Manifattura',
  'Sala Rossa',
  'Sala Gialla',
  'Sala Verde',
] as const

// Lista completa delle aule (per backward compatibility)
export const CLASSROOMS = [
  ...CLASSROOMS_BADIA_RIPOLI,
  ...CLASSROOMS_VIA_VECCHIETTI,
] as const

export type Classroom = typeof CLASSROOMS[number]

// Aule interne - Piano terra
export const INTERNAL_GROUND_FLOOR = [
  'Aula Magna',
  'Conference 1',
  'Conference 2',
  'Photo LAB 1',
  'Photo LAB 2',
  'Visual HUB',
] as const

// Aule interne - 1° piano
export const INTERNAL_FIRST_FLOOR = [
  'Movie Hall',
  '3D LAB',
  'Multimedia LAB',
  'Digital HUB',
] as const

// Aule interne (tutte)
export const INTERNAL_CLASSROOMS = [
  ...INTERNAL_GROUND_FLOOR,
  ...INTERNAL_FIRST_FLOOR,
] as const

// Aule esterne
export const EXTERNAL_CLASSROOMS = [
  'Design LAB',
  'Pittura',
  'Tecn. Grafiche',
  'Studio 1',
  'Studio 2',
  'Studio 3',
] as const

// Funzione per ottenere tutte le aule nell'ordine corretto
export function getOrderedClassrooms(): string[] {
  return [
    ...INTERNAL_GROUND_FLOOR,
    ...INTERNAL_FIRST_FLOOR,
    ...EXTERNAL_CLASSROOMS,
  ]
}

// Funzione per ottenere le aule per una sede specifica
export function getClassroomsForLocation(location: 'badia-ripoli' | 'via-vecchietti'): string[] {
  if (location === 'badia-ripoli') {
    return Array.from(CLASSROOMS_BADIA_RIPOLI)
  } else {
    return Array.from(CLASSROOMS_VIA_VECCHIETTI)
  }
}

// Funzione per ottenere le colonne del calendario (Magna 1, Magna 2, Conference 1, Conference 2 separate)
export function getBaseClassrooms(location?: 'badia-ripoli' | 'via-vecchietti'): string[] {
  if (location === 'badia-ripoli') {
    return Array.from(BADIA_CALENDAR_COLUMNS)
  }
  if (location === 'via-vecchietti') {
    return Array.from(CLASSROOMS_VIA_VECCHIETTI)
  }
  // Default: Badia
  return Array.from(BADIA_CALENDAR_COLUMNS)
}

// Funzione per verificare se un'aula è interna
export function isInternalClassroom(classroom: string): boolean {
  return INTERNAL_CLASSROOMS.includes(classroom as any)
}

// Funzione per verificare se un'aula è esterna
export function isExternalClassroom(classroom: string): boolean {
  return EXTERNAL_CLASSROOMS.includes(classroom as any)
}

// Funzione per ottenere l'indice della prima aula esterna (basato su aule base)
export function getFirstExternalIndex(location?: 'badia-ripoli' | 'via-vecchietti'): number {
  if (location === 'via-vecchietti') {
    return getBaseClassrooms('via-vecchietti').length
  }
  // Badia: Magna 1, Magna 2, Conf 1, Conf 2, Photo 1, 2, Visual, Movie, 3D, Multimedia, Digital = 11 interne
  return 11
}

// Funzione per ottenere le varianti di un'aula base
export function getClassroomVariants(baseClassroom: string): string[] {
  if (baseClassroom === 'Aula Magna') {
    return ['Aula Magna', 'Magna 1', 'Magna 2']
  }
  if (baseClassroom === 'Conference') {
    return ['Conference', 'Conference 1', 'Conference 2']
  }
  return [baseClassroom]
}

/** Risolve aula lezione -> { startCol, colSpan } per la griglia. Gestisce Conference 1+2, Magna 1+2. */
export function resolveClassroomToColumns(
  classroom: string,
  columns: string[]
): { startCol: number; colSpan: number } {
  const idx = (c: string) => columns.indexOf(c)
  // Spanning: Conference 1+2 -> colonne Conference 1 e 2
  if (classroom === 'Conference 1+2') {
    const start = idx('Conference 1')
    return start >= 0 ? { startCol: start, colSpan: 2 } : { startCol: -1, colSpan: 1 }
  }
  if (classroom === 'Magna 1+2') {
    const start = idx('Magna 1')
    return start >= 0 ? { startCol: start, colSpan: 2 } : { startCol: -1, colSpan: 1 }
  }
  // Mapping aula generica -> prima colonna disponibile
  const direct = idx(classroom)
  if (direct >= 0) return { startCol: direct, colSpan: 1 }
  if (classroom === 'Aula Magna') return { startCol: idx('Magna 1'), colSpan: 1 }
  if (classroom === 'Conference') return { startCol: idx('Conference 1'), colSpan: 1 }
  if (classroom === 'Magna') return { startCol: idx('Magna 1'), colSpan: 1 }
  return { startCol: -1, colSpan: 1 }
}
