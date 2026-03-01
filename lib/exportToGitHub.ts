/**
 * Export orari da Supabase verso LABA_Orari su GitHub.
 * Converte le lezioni DB (slot settimanali) in JSON con date ISO per ogni settimana del semestre.
 *
 * Richiede: GITHUB_TOKEN (PAT con scope repo), GITHUB_ORARI_REPO (es. SAzzinelli/LABA_Orari)
 */

import type { JsonLesson } from './syncFromGitHub'

// Nome corso in piattaforma -> cartella GitHub
const PLATFORM_TO_CORSO: Record<string, string> = {
  'Design': 'DESIGN',
  'Graphic Design & Multimedia': 'GD',
  'Pittura': 'PITTURA',
  'Fashion Design': 'FASHION',
  'Fotografia': 'FOTOGRAFIA',
  'Regia e Videomaking': 'REGIA',
  'Cinema e Audiovisivi': 'CINEMA',
  'Interior Design': 'INTERIOR',
}

// Aula DB (normalizzata) -> formato JSON GitHub
function denormalizeClassroom(aula: string): string {
  const map: Record<string, string> = {
    'Magna 2': 'Aula Magna 2',
    'Aula Magna': 'Magna',
    'Digital HUB': 'Digital Hub',
  }
  return map[aula] ?? aula
}

// Genera le date di un giorno della settimana tra start e end
function getDatesInRange(dayOfWeek: number, startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = []
  const current = new Date(startDate)
  // Trova il primo giorno corrispondente
  const diff = (dayOfWeek - current.getDay() + 7) % 7
  current.setDate(current.getDate() + diff)
  while (current <= endDate) {
    dates.push(new Date(current))
    current.setDate(current.getDate() + 7)
  }
  return dates
}

// Formato ISO per GitHub (es. 2025-11-03T15:00:00+01:00)
function toIsoDateTime(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const d = new Date(date)
  d.setHours(h, m, 0, 0)
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hr = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${mo}-${day}T${hr}:${min}:00+01:00`
}

export interface DbLessonExport {
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

/** Date semestre: anno accademico 2025-26 -> sem 1: set 2025 - gen 2026, sem 2: feb - giu 2026 */
function getSemesterDates(sem: number, yearStart: number): { start: Date; end: Date } {
  if (sem === 1) {
    return {
      start: new Date(yearStart, 8, 1),   // 1 set
      end: new Date(yearStart + 1, 0, 31), // 31 gen
    }
  }
  return {
    start: new Date(yearStart + 1, 1, 1),  // 1 feb
    end: new Date(yearStart + 1, 5, 30),   // 30 giu
  }
}

/** Converte una lezione DB in array di JsonLesson per un semestre */
function dbLessonToJsonEntries(
  lesson: DbLessonExport,
  corsoStudio: string,
  sem: number,
  yearStart: number
): JsonLesson[] {
  const { start, end } = getSemesterDates(sem, yearStart)
  const dates = getDatesInRange(lesson.day_of_week, start, end)
  return dates.map((d) => ({
    corso: lesson.title,
    oidCorso: null,
    oidCorsi: null,
    anno: lesson.year ?? 1,
    gruppo: lesson.group_name ?? null,
    aula: denormalizeClassroom(lesson.classroom),
    docente: lesson.professor,
    start: toIsoDateTime(d, lesson.start_time),
    end: toIsoDateTime(d, lesson.end_time),
    note: lesson.notes ?? null,
    corsoStudio,
  }))
}

export type ExportResult = {
  corso: string
  anno: number
  semester: number
  path: string
  entries: number
  ok: boolean
  error?: string
}

export async function exportToGitHub(
  lessons: DbLessonExport[],
  options: {
    token: string
    repo?: string
    yearStart?: number
  }
): Promise<ExportResult[]> {
  const repo = options.repo ?? process.env.GITHUB_ORARI_REPO ?? 'SAzzinelli/LABA_Orari'
  const yearStart = options.yearStart ?? parseInt(process.env.GITHUB_EXPORT_YEAR_START || `${new Date().getFullYear()}`, 10)
  const results: ExportResult[] = []

  // Raggruppa per (platformCourse, year, semester)
  const byFile = new Map<string, DbLessonExport[]>()
  for (const l of lessons) {
    if (!l.course || l.year == null) continue
    const corso = PLATFORM_TO_CORSO[l.course]
    if (!corso) continue
    for (const sem of [1, 2]) {
      const key = `${corso}-${l.year}-${sem}`
      if (!byFile.has(key)) byFile.set(key, [])
      byFile.get(key)!.push(l)
    }
  }

  for (const [key, less] of Array.from(byFile.entries())) {
    const [corso, annoStr, semStr] = key.split('-')
    const anno = parseInt(annoStr, 10)
    const sem = parseInt(semStr, 10)
    const path = `orari/${corso}/${anno}/${sem}sem.json`
    const corsoStudio = corso

    const jsonEntries: JsonLesson[] = []
    const seen = new Set<string>()
    for (const l of less) {
      const slotKey = `${l.title}-${l.day_of_week}-${l.start_time}-${l.end_time}-${l.classroom}-${l.professor}-${l.group_name ?? ''}`
      if (seen.has(slotKey)) continue
      seen.add(slotKey)
      jsonEntries.push(...dbLessonToJsonEntries(l, corsoStudio, sem, yearStart))
    }
    jsonEntries.sort((a, b) => a.start.localeCompare(b.start))

    try {
      const content = JSON.stringify(jsonEntries, null, 2)
      const res = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${options.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      })
      let sha: string | undefined
      if (res.ok) {
        const existing = await res.json()
        sha = existing.sha
      }
      const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${options.token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: `Aggiornamento orari ${corso} ${anno}° sem ${sem} da piattaforma`,
          content: Buffer.from(content, 'utf-8').toString('base64'),
          sha,
        }),
      })
      if (!putRes.ok) {
        const err = await putRes.json()
        results.push({
          corso: `${corso} ${anno}°`,
          anno,
          semester: sem,
          path,
          entries: jsonEntries.length,
          ok: false,
          error: err.message || putRes.statusText,
        })
      } else {
        results.push({
          corso: `${corso} ${anno}°`,
          anno,
          semester: sem,
          path,
          entries: jsonEntries.length,
          ok: true,
        })
      }
    } catch (e: any) {
      results.push({
        corso: `${corso} ${anno}°`,
        anno,
        semester: sem,
        path,
        entries: jsonEntries.length,
        ok: false,
        error: e.message || 'Errore di rete',
      })
    }
  }

  return results
}
