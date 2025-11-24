import { supabase } from './supabase'

export interface Lesson {
  id: string
  title: string
  startTime: string // HH:mm format
  endTime: string // HH:mm format
  dayOfWeek: number // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  classroom: string
  professor: string
  group?: string // optional, if not present means "tutti"
  notes?: string
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
    group: row.group_name || undefined,
    notes: row.notes || undefined,
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
  if ('group' in lesson) row.group_name = lesson.group || null
  if ('notes' in lesson) row.notes = lesson.notes || null
  return row
}

export async function getLessons(): Promise<Lesson[]> {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true })

    if (error) {
      console.error('Error fetching lessons:', error)
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
    const { data, error } = await supabase
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
