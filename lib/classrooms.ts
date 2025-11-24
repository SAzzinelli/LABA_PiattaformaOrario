// Lista completa delle aule LABA
export const CLASSROOMS = [
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
  'Lab. Tecn. Grafiche',
  'Studio 1',
  'Studio 2',
  'Studio 3',
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
  'Lab. Tecn. Grafiche',
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

// Funzione per ottenere tutte le aule base (senza varianti) nell'ordine corretto
export function getBaseClassrooms(): string[] {
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
export function getFirstExternalIndex(): number {
  // Conta le aule interne base (senza varianti)
  const internalBase = new Set<string>()
  INTERNAL_CLASSROOMS.forEach(aula => {
    if (aula === 'Magna 1' || aula === 'Magna 2') {
      internalBase.add('Aula Magna')
    } else if (aula === 'Conference 1' || aula === 'Conference 2') {
      internalBase.add('Conference')
    } else {
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
