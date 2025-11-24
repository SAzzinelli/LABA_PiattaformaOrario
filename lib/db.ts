import fs from 'fs'
import path from 'path'

const dataDir = path.join(process.cwd(), 'data')
const dbPath = path.join(dataDir, 'lessons.json')

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

// Initialize database if it doesn't exist
function ensureDbExists() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([], null, 2))
  }
}

export function getLessons(): Lesson[] {
  ensureDbExists()
  try {
    const data = fs.readFileSync(dbPath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

export function saveLessons(lessons: Lesson[]): void {
  ensureDbExists()
  fs.writeFileSync(dbPath, JSON.stringify(lessons, null, 2))
}

export function addLesson(lesson: Omit<Lesson, 'id'>): Lesson {
  const lessons = getLessons()
  const newLesson: Lesson = {
    ...lesson,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
  }
  lessons.push(newLesson)
  saveLessons(lessons)
  return newLesson
}

export function updateLesson(id: string, lesson: Partial<Omit<Lesson, 'id'>>): Lesson | null {
  const lessons = getLessons()
  const index = lessons.findIndex(l => l.id === id)
  if (index === -1) return null
  lessons[index] = { ...lessons[index], ...lesson }
  saveLessons(lessons)
  return lessons[index]
}

export function deleteLesson(id: string): boolean {
  const lessons = getLessons()
  const index = lessons.findIndex(l => l.id === id)
  if (index === -1) return false
  lessons.splice(index, 1)
  saveLessons(lessons)
  return true
}

