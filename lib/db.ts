import { supabase, supabaseAdmin } from './supabase'

// Usa admin client per scritture (bypassa RLS) - la policy blocca INSERT/UPDATE/DELETE per anon
const db = supabaseAdmin ?? supabase

/** Coppia corso+anno aggiuntiva per lezioni condivise */
export interface AdditionalCourse {
  course: string
  year: number
}

export interface Lesson {
  id: string
  title: string
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  classroom: string
  professor: string
  course?: string // Corso principale
  year?: number // Anno principale
  group?: string // optional, if not present means "tutti"
  notes?: string
  /** Altri corsi dove appare la stessa lezione (es. Arte: GD3, Pittura2, Fot2) */
  additionalCourses?: AdditionalCourse[]
}

export interface LessonFilters {
  course?: string
  year?: number
  /** Data visualizzata: filtra per semestre (feb-giu=2, set-gen=1) */
  date?: string // ISO date YYYY-MM-DD
}

// Convert database row to Lesson interface
function dbRowToLesson(row: any): Lesson {
  const raw = row.additional_courses
  const additionalCourses: AdditionalCourse[] = Array.isArray(raw)
    ? raw.filter((x: unknown) => x && typeof x === 'object' && 'course' in x && 'year' in x)
        .map((x: { course: string; year: number }) => ({ course: x.course, year: Number(x.year) }))
    : []
  return {
    id: row.id,
    title: row.title,
    startTime: row.start_time,
    endTime: row.end_time,
    dayOfWeek: row.day_of_week,
    classroom: row.classroom,
    professor: row.professor,
    course: row.course || undefined,
    year: row.year || undefined,
    group: row.group_name || undefined,
    notes: row.notes || undefined,
    additionalCourses: additionalCourses.length > 0 ? additionalCourses : undefined,
  }
}

// Convert Lesson interface to database row
function lessonToDbRow(lesson: Omit<Lesson, 'id'> | Partial<Lesson>): any {
  const row: any = {}
  if ('title' in lesson) row.title = lesson.title
  if ('startTime' in lesson) row.start_time = lesson.startTime
  if ('endTime' in lesson) row.end_time = lesson.endTime
  if ('dayOfWeek' in lesson) row.day_of_week = lesson.dayOfWeek
  if ('classroom' in lesson) row.classroom = lesson.classroom
  if ('professor' in lesson) row.professor = lesson.professor
  if ('course' in lesson) row.course = lesson.course || null
  if ('year' in lesson) row.year = lesson.year || null
  if ('group' in lesson) row.group_name = lesson.group || null
  if ('notes' in lesson) row.notes = lesson.notes || null
  if ('additionalCourses' in lesson) {
    const ac = lesson.additionalCourses
    row.additional_courses = Array.isArray(ac) && ac.length > 0 ? ac : []
  }
  return row
}

/** Calcola semestre da data: feb-giu=2, set-gen=1 */
export function getSemesterFromDate(dateStr: string): number {
  const d = new Date(dateStr)
  const m = d.getMonth() + 1 // 1-12
  return m >= 2 && m <= 6 ? 2 : 1
}

export async function getLessons(filters?: LessonFilters): Promise<Lesson[]> {
  try {
    let query = db
      .from('lessons')
      .select('*')

    if (filters?.course) {
      query = query.eq('course', filters.course)
    }
    if (filters?.year !== undefined) {
      query = query.eq('year', filters.year)
    }
    if (filters?.date) {
      const sem = getSemesterFromDate(filters.date)
      query = query.eq('semester', sem)
    }

    const { data, error } = await query
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching lessons:', error)
      return []
    }

    let lessons = (data || []).map(dbRowToLesson)

    // Se filtri corso+anno, includi anche lezioni dove questo è in additional_courses
    if (filters?.course && filters?.year !== undefined) {
      const { data: extra } = await db
        .from('lessons')
        .select('*')
        .contains('additional_courses', [{ course: filters.course, year: filters.year }])
      if (filters?.date) {
        const sem = getSemesterFromDate(filters.date)
        const filtered = (extra || []).filter((r: any) => r.semester === sem)
        lessons = [...lessons, ...filtered.map(dbRowToLesson)]
      } else {
        lessons = [...lessons, ...(extra || []).map(dbRowToLesson)]
      }
      // Deduplica per id
      const byId = new Map<string, Lesson>()
      for (const l of lessons) byId.set(l.id, l)
      lessons = Array.from(byId.values()).sort(
        (a, b) =>
          (a.dayOfWeek - b.dayOfWeek) || (a.startTime.localeCompare(b.startTime))
      )
    }

    return lessons
  } catch (error) {
    console.error('Error in getLessons:', error)
    return []
  }
}

export async function addLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson> {
  try {
    const row = lessonToDbRow(lesson)
    const { data, error } = await db
      .from('lessons')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('Error adding lesson:', error)
      throw error
    }

    return dbRowToLesson(data)
  } catch (error) {
    console.error('Error in addLesson:', error)
    throw error
  }
}

export async function updateLesson(
  id: string,
  lesson: Partial<Omit<Lesson, 'id'>>,
  updateScope?: 'single' | 'all_future'
): Promise<Lesson | null> {
  try {
    // Prima ottieni la lezione originale per trovare le caratteristiche da matchare
    const { data: originalLesson } = await db
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()

    if (!originalLesson) {
      return null
    }

    const row = lessonToDbRow(lesson)
    
    if (updateScope === 'all_future') {
      // Trova tutte le lezioni con le stesse caratteristiche della lezione originale
      // e aggiornale tutte
      let query = db
        .from('lessons')
        .update(row)
        .eq('day_of_week', originalLesson.day_of_week)
        .eq('start_time', originalLesson.start_time)
        .eq('end_time', originalLesson.end_time)
        .eq('professor', originalLesson.professor)
        .eq('classroom', originalLesson.classroom)
      
      // Aggiungi filtri opzionali se presenti nella lezione originale
      if (originalLesson.course) {
        query = query.eq('course', originalLesson.course)
      } else {
        query = query.is('course', null)
      }
      
      if (originalLesson.year) {
        query = query.eq('year', originalLesson.year)
      } else {
        query = query.is('year', null)
      }
      
      if (originalLesson.group_name) {
        query = query.eq('group_name', originalLesson.group_name)
      } else {
        query = query.is('group_name', null)
      }

      const { data, error } = await query.select()

      if (error) {
        console.error('Error updating lessons:', error)
        return null
      }

      // Restituisci la lezione originale aggiornata
      const updated = data?.find(l => l.id === id)
      return updated ? dbRowToLesson(updated) : null
    } else {
      // Aggiorna solo questa lezione
      const { data, error } = await db
        .from('lessons')
        .update(row)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating lesson:', error)
        return null
      }

      if (!data) return null

      return dbRowToLesson(data)
    }
  } catch (error) {
    console.error('Error in updateLesson:', error)
    return null
  }
}

/** Ottiene i professori distinti dal DB (per dropdown) */
export async function getDistinctProfessors(): Promise<string[]> {
  try {
    const { data, error } = await db.from('lessons').select('professor')
    if (error) return []
    const set = new Set((data || []).map((r: any) => r.professor).filter(Boolean))
    return Array.from(set).sort()
  } catch {
    return []
  }
}

/** Ottiene le aule distinti dal DB (per dropdown, unione con lista canonica) */
export async function getDistinctClassrooms(): Promise<string[]> {
  try {
    const { data, error } = await db.from('lessons').select('classroom')
    if (error) return []
    const set = new Set((data || []).map((r: any) => r.classroom).filter(Boolean))
    return Array.from(set).sort()
  } catch {
    return []
  }
}

export async function deleteLesson(id: string): Promise<boolean> {
  try {
    const { error } = await db.from('lessons').delete().eq('id', id)

    if (error) {
      console.error('Error deleting lesson:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in deleteLesson:', error)
    return false
  }
}
