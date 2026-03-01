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
  semester: number  // 1 = set-gen, 2 = feb-giu
}

/** Estrae giorno settimana (0-6) dalla data ISO - usa solo YYYY-MM-DD, mai parsing con timezone */
function getDayOfWeek(isoDateString: string): number {
  const match = isoDateString.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (match) {
    const y = parseInt(match[1], 10)
    const m = parseInt(match[2], 10) - 1
    const d = parseInt(match[3], 10)
    return new Date(y, m, d).getDay()
  }
  return 0
}

/** Estrae HH:mm dalla stringa ISO - usa solo il testo, mai conversione timezone (il JSON ha già l'ora Italia) */
function extractTime(isoDateString: string): string {
  if (!isoDateString || typeof isoDateString !== 'string') return '09:00'
  const tPart = isoDateString.split('T')[1]
  if (tPart && tPart.length >= 5) {
    return tPart.slice(0, 5) // HH:mm dal literal, nessuna conversione
  }
  const match = isoDateString.match(/T(\d{2}):(\d{2})/)
  if (match) return `${match[1]}:${match[2]}`
  return '09:00'
}

function normalizeClassroom(aula: string): string {
  const map: Record<string, string> = {
    'Aula Magna 2': 'Magna 2',
    'Magna': 'Aula Magna',
    'Digital Hub': 'Digital HUB',
  }
  return map[aula] ?? aula
}


export function convertJsonToDb(json: JsonLesson, platformCourse: string, semester: number): DbLesson {
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
    semester,
  }
}

/** Deduplica lezioni uguali (stesso slot, stesso semestre) - tiene la prima */
function deduplicateLessons(lessons: DbLesson[]): DbLesson[] {
  const seen = new Set<string>()
  return lessons.filter((l) => {
    const key = `${l.semester}-${l.course}-${l.year}-${l.title}-${l.day_of_week}-${l.start_time}-${l.end_time}-${l.professor}-${l.group_name ?? ''}`
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

      for (const semester of [1, 2]) {
        const json = await fetchJsonFromGitHub(corso, anno, semester)
        if (!json || json.length === 0) continue

        const converted = json
          .filter((j) => j.anno === anno)
          .map((j) => convertJsonToDb(j, platformCourse, semester))
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
