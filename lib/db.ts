import { supabase } from './supabase'

export interface Lesson {
  id: string
  title: string
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  classroom: string
  professor: string
  course?: string // Corso (es. "Graphic Design & Multimedia")
  year?: number // Anno (1, 2, 3 per triennali, 1, 2 per biennali)
  group?: string // optional, if not present means "tutti"
  notes?: string
}

export interface LessonFilters {
  course?: string // Deprecato, usa courses
  year?: number // Deprecato, usa years
  courses?: string[]
  years?: number[]
}

// Convert database row to Lesson interface
function dbRowToLesson(row: any): Lesson {
  return {
    id: row.id,
    title: row.title,
    startTime: row.start_time, // Convert from TIME to HH:mm string
    endTime: row.end_time,
    dayOfWeek: row.day_of_week,
    classroom: row.classroom,
    professor: row.professor,
    course: row.course || undefined,
    year: row.year || undefined,
    group: row.group_name || undefined,
    notes: row.notes || undefined,
  }
}

// Convert Lesson interface to database row
function lessonToDbRow(lesson: Omit<Lesson, 'id'> | Partial<Lesson>): any {
  const row: any = {}
  if ('title' in lesson && lesson.title) row.title = lesson.title
  if ('startTime' in lesson && lesson.startTime) row.start_time = lesson.startTime
  if ('endTime' in lesson && lesson.endTime) row.end_time = lesson.endTime
  if ('dayOfWeek' in lesson && lesson.dayOfWeek !== undefined) row.day_of_week = lesson.dayOfWeek
  if ('classroom' in lesson && lesson.classroom) row.classroom = lesson.classroom
  if ('professor' in lesson && lesson.professor) row.professor = lesson.professor
  if ('course' in lesson) row.course = lesson.course && lesson.course.trim() !== '' ? lesson.course : null
  if ('year' in lesson) row.year = lesson.year && lesson.year > 0 ? lesson.year : null
  if ('group' in lesson) row.group_name = lesson.group && lesson.group.trim() !== '' ? lesson.group : null
  if ('notes' in lesson) row.notes = lesson.notes && lesson.notes.trim() !== '' ? lesson.notes : null
  return row
}

export async function getLessons(filters?: LessonFilters): Promise<Lesson[]> {
  try {
    let query = supabase
      .from('lessons')
      .select('*')

    // Applica filtri se presenti
    // Supporta sia il vecchio formato (singolo) che il nuovo (multiplo)
    if (filters?.courses && filters.courses.length > 0) {
      query = query.in('course', filters.courses)
    } else if (filters?.course) {
      // Backward compatibility
      query = query.eq('course', filters.course)
    }

    if (filters?.years && filters.years.length > 0) {
      // Filtra per anni specifici - include anche lezioni senza anno (generiche)
      // Mostra lezioni con gli anni selezionati O senza anno specificato
      const yearsList = filters.years.join(',')
      query = query.or(`year.in.(${yearsList}),year.is.null`)
    } else if (filters?.year !== undefined) {
      // Backward compatibility - include anche lezioni senza anno
      query = query.or(`year.eq.${filters.year},year.is.null`)
    }

    const { data, error } = await query
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching lessons:', error)
      console.error('Filters applied:', filters)
      return []
    }

    return (data || []).map(dbRowToLesson)
  } catch (error) {
    console.error('Error in getLessons:', error)
    return []
  }
}

export async function addLesson(lesson: Omit<Lesson, 'id'>): Promise<Lesson> {
  try {
    const row = lessonToDbRow(lesson)

    // Log per debug
    // console.log('Adding lesson with row:', JSON.stringify(row, null, 2))

    const { data, error } = await supabase
      .from('lessons')
      .insert(row)
      .select()
      .single()

    if (error) {
      console.error('Error adding lesson:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      throw new Error(error.message || 'Errore durante l\'inserimento della lezione')
    }

    if (!data) {
      throw new Error('Nessun dato restituito dopo l\'inserimento')
    }

    return dbRowToLesson(data)
  } catch (error) {
    console.error('Error in addLesson:', error)
    throw error
  }
}

export async function updateLesson(
  id: string,
  lesson: Partial<Omit<Lesson, 'id'>>
): Promise<Lesson | null> {
  try {
    const row = lessonToDbRow(lesson)
    const { data, error } = await supabase
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
  } catch (error) {
    console.error('Error in updateLesson:', error)
    return null
  }
}

export async function updateLessonAndFuture(
  id: string,
  lesson: Partial<Omit<Lesson, 'id'>>
): Promise<{ count: number; lessons: Lesson[] } | null> {
  try {
    // Prima, ottieni la lezione corrente per identificare le caratteristiche originali
    const { data: currentLesson, error: fetchError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !currentLesson) {
      console.error('Error fetching current lesson:', fetchError)
      return null
    }

    // Identifica le caratteristiche originali per trovare le lezioni future
    const originalLesson = dbRowToLesson(currentLesson)

    // Costruisci la query per trovare tutte le lezioni future con le stesse caratteristiche
    let query = supabase
      .from('lessons')
      .select('*')
      .eq('day_of_week', originalLesson.dayOfWeek)
      .eq('start_time', originalLesson.startTime)
      .eq('end_time', originalLesson.endTime)
      .eq('professor', originalLesson.professor)
      .eq('title', originalLesson.title)
      .neq('id', id) // Escludi la lezione corrente

    // Aggiungi filtri per course, year, group se presenti
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

    if (originalLesson.group) {
      query = query.eq('group_name', originalLesson.group)
    } else {
      query = query.is('group_name', null)
    }

    // Ottieni tutte le lezioni future che corrispondono
    const { data: futureLessons, error: findError } = await query

    if (findError) {
      console.error('Error finding future lessons:', findError)
      return null
    }

    // Prepara i dati da aggiornare
    const updateRow = lessonToDbRow(lesson)

    // Ottieni gli ID delle lezioni future da aggiornare
    const futureIds = (futureLessons || []).map(l => l.id)

    if (futureIds.length === 0) {
      // Nessuna lezione futura trovata, aggiorna solo quella corrente
      const updated = await updateLesson(id, lesson)
      return updated ? { count: 1, lessons: [updated] } : null
    }

    // Aggiorna tutte le lezioni future (inclusa quella corrente)
    const allIds = [id, ...futureIds]
    const { data: updatedLessons, error: updateError } = await supabase
      .from('lessons')
      .update(updateRow)
      .in('id', allIds)
      .select()

    if (updateError) {
      console.error('Error updating future lessons:', updateError)
      return null
    }

    return {
      count: updatedLessons?.length || 0,
      lessons: (updatedLessons || []).map(dbRowToLesson)
    }
  } catch (error) {
    console.error('Error in updateLessonAndFuture:', error)
    return null
  }
}

export async function deleteLesson(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('lessons').delete().eq('id', id)

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
