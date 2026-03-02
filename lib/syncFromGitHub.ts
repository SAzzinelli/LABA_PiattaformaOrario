/**
 * Sync orari from LABA_Orari.
 * Usa raw.githubusercontent.com (aggiornato subito al push) invece di GitHub Pages
 * (che ha cache 1-5 min) per evitare che il webhook sovrascriva le modifiche appena salvate.
 */

const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/SAzzinelli/LABA_Orari/main/orari'

// Corsi su GitHub (cartelle/codici) -> nome corso nella Piattaforma
const CORSO_TO_PLATFORM: Record<string, string> = {
  DESIGN: 'Design',
  GD: 'Graphic Design & Multimedia',
  GRAPHIC_DESIGN: 'Graphic Design & Multimedia',
  PITTURA: 'Pittura',
  FASHION: 'Fashion Design',
  FOTOGRAFIA: 'Fotografia',
  REGIA: 'Regia e Videomaking',
  CINEMA: 'Cinema e Audiovisivi',
  INTERIOR: 'Interior Design',
  INTERIOR_DESIGN: 'Interior Design',
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
  /** Altri corsi dove la lezione è condivisa: [codiceCorso, anno][] es. [["PITTURA", 2]] */
  altriCorsi?: Array<[string, number]>
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
  /** Altri (course, year) per lezioni condivise */
  additional_courses?: Array<{ course: string; year: number }>
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
    'Magna 1+2': 'Magna 1+2',
    'Conference 1+2': 'Conference 1+2',
  }
  return map[aula] ?? aula
}


export function convertJsonToDb(json: JsonLesson, platformCourse: string, semester: number): DbLesson {
  const ac: Array<{ course: string; year: number }> = []
  if (Array.isArray(json.altriCorsi)) {
    for (const [code, anno] of json.altriCorsi) {
      const pc = CORSO_TO_PLATFORM[code]
      if (pc && pc !== platformCourse) ac.push({ course: pc, year: anno })
    }
  }
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
    additional_courses: ac.length > 0 ? ac : undefined,
  }
}

/** Raggruppa lezioni uguali (stesso slot) da più corsi in una sola con additional_courses */
function mergeMultiCourseLessons(lessons: DbLesson[]): DbLesson[] {
  const bySlot = new Map<string, DbLesson>()
  for (const l of lessons) {
    const slotKey = `${l.semester}-${l.title}-${l.day_of_week}-${l.start_time}-${l.end_time}-${l.professor}-${l.classroom}-${l.group_name ?? ''}`
    const existing = bySlot.get(slotKey)
    if (!existing) {
      bySlot.set(slotKey, { ...l, additional_courses: [] })
    } else {
      const pair = { course: l.course!, year: l.year! }
      if (l.course && l.year != null) {
        const isPrimary = existing.course === l.course && existing.year === l.year
        const inAdditional = existing.additional_courses?.some(
          (a) => a.course === l.course && a.year === l.year
        )
        if (!isPrimary && !inAdditional) {
          const ac = existing.additional_courses ?? []
          existing.additional_courses = [...ac, pair]
        }
      }
    }
  }
  return Array.from(bySlot.values()).map((l) => ({
    ...l,
    additional_courses: (l.additional_courses?.length ?? 0) > 0 ? l.additional_courses : undefined,
  }))
}

export async function fetchJsonFromGitHub(
  corso: string,
  anno: number,
  sem: number
): Promise<JsonLesson[] | null> {
  const url = `${GITHUB_RAW_BASE}/${corso}/${anno}/${sem}sem.json`
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

/** Converte DbLesson per insert Supabase (nomi colonne DB) */
function dbLessonToRow(l: DbLesson): Record<string, unknown> {
  const row: Record<string, unknown> = {
    title: l.title,
    start_time: l.start_time,
    end_time: l.end_time,
    day_of_week: l.day_of_week,
    classroom: l.classroom,
    professor: l.professor,
    course: l.course ?? null,
    year: l.year ?? null,
    group_name: l.group_name ?? null,
    notes: l.notes ?? null,
    semester: l.semester,
  }
  if (l.additional_courses && l.additional_courses.length > 0) {
    row.additional_courses = l.additional_courses
  }
  return row
}

export async function syncFromGitHub(supabase: any): Promise<SyncResult[]> {
  const results: SyncResult[] = []
  const allLessons: DbLesson[] = []

  // 1. Raccogli tutte le lezioni da tutti i file
  for (const [corso, platformCourse] of Object.entries(CORSO_TO_PLATFORM)) {
    const years = CORSO_YEARS[corso] ?? [1, 2, 3]
    for (const anno of years) {
      for (const semester of [1, 2]) {
        const json = await fetchJsonFromGitHub(corso, anno, semester)
        if (!json || json.length === 0) continue
        const converted = json
          .filter((j) => j.anno === anno)
          .map((j) => convertJsonToDb(j, platformCourse, semester))
        allLessons.push(...converted)
      }
    }
  }

  // 2. Merge lezioni duplicate (stesso slot in più corsi) -> una lezione con additional_courses
  const merged = mergeMultiCourseLessons(allLessons)

  // 3. Svuota e reinserisci (full replace per supportare multi-corso)
  const { error: delError } = await supabase
    .from('lessons')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000')

  if (delError) {
    console.error('Sync delete error:', delError)
    return [{ corso: 'Errore', anno: 0, semester: 0, imported: 0, deleted: 0, errors: merged.length }]
  }

  let totalImported = 0
  let totalErrors = 0
  const BATCH = 200

  for (let i = 0; i < merged.length; i += BATCH) {
    const batch = merged.slice(i, i + BATCH).map(dbLessonToRow)
    const { data, error: insertError } = await supabase
      .from('lessons')
      .insert(batch)
      .select('id')

    if (insertError) {
      totalErrors += batch.length
      console.error('Sync insert batch error:', insertError.message)
    } else {
      totalImported += data?.length ?? batch.length
    }
  }

  results.push({
    corso: 'Totale',
    anno: 0,
    semester: 0,
    imported: totalImported,
    deleted: merged.length,
    errors: totalErrors,
  })
  return results
}
