/**
 * Sync orari from LABA_Orari GitHub Pages
 * Fetches JSON from https://SAzzinelli.github.io/LABA_Orari/orari/{CORSO}/{ANNO}/{SEM}sem.json
 * and imports into Supabase lessons table.
 */

const GITHUB_BASE = 'https://SAzzinelli.github.io/LABA_Orari/orari'

// Corsi su GitHub (cartelle) -> nome corso nella Piattaforma
const CORSO_TO_PLATFORM: Record<string, string> = {
  DESIGN: 'Design',
  GD: 'Graphic Design & Multimedia',
  PITTURA: 'Pittura',
  FASHION: 'Fashion Design',
  FOTOGRAFIA: 'Fotografia',
  REGIA: 'Regia e Videomaking',
  CINEMA: 'Cinema e Audiovisivi',
  INTERIOR: 'Interior Design',
}

// Anni per corso: triennali 1-3, biennali 1-2
const CORSO_YEARS: Record<string, number[]> = {
  DESIGN: [1, 2, 3],
  GD: [1, 2, 3],
  PITTURA: [1, 2, 3],
  FASHION: [1, 2, 3],
  FOTOGRAFIA: [1, 2, 3],
  REGIA: [1, 2, 3],
  INTERIOR: [1, 2],
  CINEMA: [1, 2],
}

export interface JsonLesson {
  corso: string
  oidCorso: string | null
  oidCorsi: string | null
  anno: number
  gruppo: string | null
  aula: string
  docente: string
  start: string
  end: string
  note: string | null
  corsoStudio: string
}

export interface DbLesson {
  title: string
  start_time: string
  end_time: string
  day_of_week: number
  classroom: string
  professor: string
  course: string | null
  year: number | null
  group_name: string | null
  notes: string | null
}

function getDayOfWeek(isoDateString: string): number {
  const date = new Date(isoDateString)
  return date.getDay()
}

function extractTime(isoDateString: string): string {
  const date = new Date(isoDateString)
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function normalizeClassroom(aula: string): string {
  const map: Record<string, string> = {
    'Aula Magna 2': 'Magna 2',
    'Magna': 'Aula Magna',
    'Digital Hub': 'Digital HUB',
  }
  return map[aula] ?? aula
}


export function convertJsonToDb(json: JsonLesson, platformCourse: string): DbLesson {
  return {
    title: json.corso,
    start_time: extractTime(json.start),
    end_time: extractTime(json.end),
    day_of_week: getDayOfWeek(json.start),
    classroom: normalizeClassroom(json.aula),
    professor: json.docente,
    course: platformCourse,
    year: json.anno,
    group_name: json.gruppo,
    notes: json.note,
  }
}

/** Deduplica lezioni uguali (stesso slot settimanale, stesso corso/anno/gruppo) - tiene la prima per evitare duplicati in aule diverse */
function deduplicateLessons(lessons: DbLesson[]): DbLesson[] {
  const seen = new Set<string>()
  return lessons.filter((l) => {
    // Chiave SENZA classroom: stessa lezione nello stesso slot = una sola (evita "Informatica" in Visual HUB + Movie Hall + Multimedia LAB)
    const key = `${l.course}-${l.year}-${l.title}-${l.day_of_week}-${l.start_time}-${l.end_time}-${l.professor}-${l.group_name ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function fetchJsonFromGitHub(
  corso: string,
  anno: number,
  sem: number
): Promise<JsonLesson[] | null> {
  const url = `${GITHUB_BASE}/${corso}/${anno}/${sem}sem.json`
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error(`Fetch failed ${url}:`, e)
    return null
  }
}

export type SyncResult = {
  corso: string
  anno: number
  semester: number
  imported: number
  deleted: number
  errors: number
}

export async function syncFromGitHub(supabase: any): Promise<SyncResult[]> {
  const results: SyncResult[] = []

  for (const [corso, platformCourse] of Object.entries(CORSO_TO_PLATFORM)) {
    const years = CORSO_YEARS[corso] ?? [1, 2, 3]

    for (const anno of years) {
      const allLessons: DbLesson[] = []
      let totalFetched = 0

      for (const semester of [1, 2]) {
        const json = await fetchJsonFromGitHub(corso, anno, semester)
        if (!json || json.length === 0) continue

        const converted = json
          .filter((j) => j.anno === anno)
          .map((j) => convertJsonToDb(j, platformCourse))
        totalFetched += converted.length
        allLessons.push(...converted)
      }

      if (allLessons.length === 0) {
        results.push({ corso: `${platformCourse} ${anno}°`, anno, semester: 0, imported: 0, deleted: 0, errors: 0 })
        continue
      }

      const unique = deduplicateLessons(allLessons)
      let errors = 0

      const { error: delError } = await supabase
        .from('lessons')
        .delete()
        .eq('course', platformCourse)
        .eq('year', anno)

      if (delError) {
        console.warn(`Delete ${platformCourse} ${anno}°:`, delError.message)
      }

      const BATCH = 200
      let imported = 0
      for (let i = 0; i < unique.length; i += BATCH) {
        const batch = unique.slice(i, i + BATCH)
        const { data, error: insertError } = await supabase
          .from('lessons')
          .insert(batch)
          .select('id')

        if (insertError) {
          errors += batch.length
          console.error(`Insert ${platformCourse} ${anno}° batch:`, insertError.message)
        } else {
          imported += data?.length ?? batch.length
        }
      }

      results.push({
        corso: `${platformCourse} ${anno}°`,
        anno,
        semester: 0,
        imported,
        deleted: 0,
        errors,
      })
    }
  }

  return results
}
