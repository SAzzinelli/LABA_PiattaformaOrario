/**
 * Gruppi per corso/anno.
 * Pittura: nessun gruppo.
 * Graphic Design & altri: A, B, C per anni che prevedono laboratori.
 * Varianti X, Y, Z per situazioni particolari.
 */

// Corsi senza gruppi
const NO_GROUPS: string[] = ['Pittura']

// Gruppi standard (A, B, C) - corsi/anni che li usano
const STANDARD_GROUPS = ['A', 'B', 'C']

// Gruppi varianti per situazioni particolari
const VARIANT_GROUPS = ['X', 'Y', 'Z']

// Corsi che hanno gruppi standard (A,B,C) - triennali 2° e 3° anno tipicamente
const COURSES_WITH_GROUPS: Record<string, number[]> = {
  'Graphic Design & Multimedia': [2, 3],
  'Regia e Videomaking': [2, 3],
  'Fashion Design': [2, 3],
  'Fotografia': [2, 3],
  'Design': [2, 3],
  // Pittura escluso (in NO_GROUPS)
}

// Corsi biennali con gruppi
const BIENNALI_WITH_GROUPS: Record<string, number[]> = {
  'Interior Design': [1, 2],
  'Cinema e Audiovisivi': [1, 2],
}

export function getGroupsForCourse(course: string, year: number | null): string[] {
  if (!course) return []
  if (NO_GROUPS.includes(course)) return []

  const yearsWithGroups = COURSES_WITH_GROUPS[course] ?? BIENNALI_WITH_GROUPS[course]
  if (!yearsWithGroups) return [...STANDARD_GROUPS, ...VARIANT_GROUPS]

  // Se anno specificato, verifica se ha gruppi
  if (year !== null) {
    if (!yearsWithGroups.includes(year)) return []
    return [...STANDARD_GROUPS, ...VARIANT_GROUPS]
  }

  // Anno non specificato: mostra tutti i gruppi possibili
  return [...STANDARD_GROUPS, ...VARIANT_GROUPS]
}
