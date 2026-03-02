/**
 * Deduplicazione lezioni condivise: stesso slot = una sola card con pill di tutti i corsi
 */

export interface CourseYear {
  course: string
  year: number
}

export interface LessonWithCourses {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  classroom: string
  professor: string
  course?: string
  year?: number
  group?: string
  notes?: string
  additionalCourses?: CourseYear[]
  /** Per display: tutti i (course, year) dopo merge deduplicazione */
  displayCourses?: CourseYear[]
}

function slotKey(lesson: { title: string; startTime: string; endTime: string; professor: string; classroom: string; group?: string }): string {
  return `${lesson.title}|${lesson.startTime}|${lesson.endTime}|${lesson.professor}|${lesson.classroom}|${lesson.group ?? ''}`
}

function getAllCourseYears(lesson: LessonWithCourses): CourseYear[] {
  const out: CourseYear[] = []
  if (lesson.course && lesson.year != null) {
    out.push({ course: lesson.course, year: lesson.year })
  }
  for (const ac of lesson.additionalCourses ?? []) {
    if (ac?.course && ac?.year != null && !out.some((c) => c.course === ac.course && c.year === ac.year)) {
      out.push({ course: ac.course, year: ac.year })
    }
  }
  return out
}

/** Deduplica lezioni con stesso slot; restituisce una card per slot con displayCourses = tutti i corsi */
export function deduplicateLessonsForDisplay<T extends LessonWithCourses>(lessons: T[]): T[] {
  const bySlot = new Map<string, T>()
  for (const l of lessons) {
    const key = slotKey(l)
    const existing = bySlot.get(key)
    if (!existing) {
      const displayCourses = getAllCourseYears(l)
      bySlot.set(key, { ...l, displayCourses: displayCourses.length > 0 ? displayCourses : undefined } as T)
    } else {
      const merged = [...getAllCourseYears(existing)]
      for (const c of getAllCourseYears(l)) {
        if (!merged.some((m) => m.course === c.course && m.year === c.year)) merged.push(c)
      }
      const updated = { ...existing, displayCourses: merged.length > 0 ? merged : undefined } as T
      bySlot.set(key, updated)
    }
  }
  return Array.from(bySlot.values())
}
