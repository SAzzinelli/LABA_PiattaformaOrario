// Lista completa delle aule LABA
export const CLASSROOMS = [
  'Aula Magna',
  'Magna 1',
  'Magna 2',
  'Conference',
  'Conference 1',
  'Conference 2',
  'Visual HUB',
  'Photo LAB 1',
  'Photo LAB 2',
  'Multimedia LAB',
  '3D LAB',
  'Digital HUB',
  'Movie Hall',
  'Studio 1',
  'Studio 2',
  'Studio 3',
  'Lab. Tecn. Grafiche',
  'Design LAB',
  'Pittura',
] as const

export type Classroom = typeof CLASSROOMS[number]

// Funzione per ottenere tutte le aule base (senza varianti)
export function getBaseClassrooms(): string[] {
  const baseSet = new Set<string>()
  
  CLASSROOMS.forEach(aula => {
    if (aula === 'Magna 1' || aula === 'Magna 2') {
      baseSet.add('Aula Magna')
    } else if (aula === 'Conference 1' || aula === 'Conference 2') {
      baseSet.add('Conference')
    } else {
      baseSet.add(aula)
    }
  })
  
  return Array.from(baseSet).sort()
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

