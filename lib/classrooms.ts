// Aule per Piazza di Badia a Ripoli
export const CLASSROOMS_BADIA_RIPOLI = [
  'Aula Magna',
  'Magna 1',
  'Magna 2',
  'Conference',
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

// Funzione per ottenere tutte le aule base (senza varianti) nell'ordine corretto
// Ora accetta un parametro opzionale per la sede
export function getBaseClassrooms(location?: 'badia-ripoli' | 'via-vecchietti'): string[] {
  // Se viene specificata una sede, usa le aule di quella sede
  if (location) {
    const locationClassrooms = getClassroomsForLocation(location)
    
    // Per Badia a Ripoli, gestisci le varianti (Magna 1/2 -> Aula Magna, Conference 1/2 -> Conference)
    if (location === 'badia-ripoli') {
      const baseSet = new Set<string>()
      const result: string[] = []
      
      locationClassrooms.forEach(aula => {
        let baseAula = aula
        if (aula === 'Magna 1' || aula === 'Magna 2') {
          baseAula = 'Aula Magna'
        } else if (aula === 'Conference 1' || aula === 'Conference 2') {
          baseAula = 'Conference'
        }
        
        if (!baseSet.has(baseAula)) {
          baseSet.add(baseAula)
          result.push(baseAula)
        }
      })
      
      return result
    } else {
      // Per Via de Vecchietti, tutte le aule sono già "base" (nessuna variante)
      return locationClassrooms
    }
  }
  
  // Altrimenti usa il comportamento originale (tutte le aule)
  const ordered = getOrderedClassrooms()
  const baseSet = new Set<string>()
  
  ordered.forEach(aula => {
    if (aula === 'Magna 1' || aula === 'Magna 2') {
      baseSet.add('Aula Magna')
    } else if (aula === 'Conference 1' || aula === 'Conference 2') {
      baseSet.add('Conference')
    } else {
      baseSet.add(aula)
    }
  })
  
  // Mantieni l'ordine originale
  const result: string[] = []
  const seen = new Set<string>()
  
  ordered.forEach(aula => {
    let baseAula = aula
    if (aula === 'Magna 1' || aula === 'Magna 2') {
      baseAula = 'Aula Magna'
    } else if (aula === 'Conference 1' || aula === 'Conference 2') {
      baseAula = 'Conference'
    }
    
    if (!seen.has(baseAula)) {
      seen.add(baseAula)
      result.push(baseAula)
    }
  })
  
  return result
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
// Accetta un parametro opzionale per la sede
export function getFirstExternalIndex(location?: 'badia-ripoli' | 'via-vecchietti'): number {
  // Per Via de Vecchietti non ci sono aule "esterne", tutte sono considerate interne
  if (location === 'via-vecchietti') {
    return getBaseClassrooms('via-vecchietti').length // Tutte le aule sono "interne"
  }
  
  // Per Badia a Ripoli, usa la logica originale
  const internalBase = new Set<string>()
  INTERNAL_CLASSROOMS.forEach(aula => {
    // Gestisce le varianti di Conference
    if (aula === 'Conference 1' || aula === 'Conference 2') {
      internalBase.add('Conference')
    } else {
      // Aula Magna, Photo LAB 1, Photo LAB 2, Visual HUB, Movie Hall, 3D LAB, Multimedia LAB, Digital HUB
      internalBase.add(aula)
    }
  })
  return internalBase.size
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
