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
    'Digital HUB': 'Digital HUB', // sempre Digital HUB
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
// Usa time string direttamente - evita conversione Date che sbaglia fuso (server UTC vs Italia)
function toIsoDateTime(date: Date, time: string): string {
  const [h, m] = time.split(':').map(Number)
  const hr = String(h).padStart(2, '0')
  const min = String(m).padStart(2, '0')
  const y = date.getFullYear()
  const mo = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
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
  /** Altri (course, year) dove la lezione appare */
  additional_courses?: Array<{ course: string; year: number }>
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
  anno: number,
  altriCorsiCodes: Array<[string, number]>,
  sem: number,
  yearStart: number
): JsonLesson[] {
  const { start, end } = getSemesterDates(sem, yearStart)
  const dates = getDatesInRange(lesson.day_of_week, start, end)
  return dates.map((d) => {
    const entry: JsonLesson = {
      corso: lesson.title,
      oidCorso: null,
      oidCorsi: null,
      anno,
      gruppo: lesson.group_name ?? null,
      aula: denormalizeClassroom(lesson.classroom),
      docente: lesson.professor,
      start: toIsoDateTime(d, lesson.start_time),
      end: toIsoDateTime(d, lesson.end_time),
      note: lesson.notes ?? null,
      corsoStudio,
    }
    if (altriCorsiCodes.length > 0) {
      entry.altriCorsi = altriCorsiCodes
    }
    return entry
  })
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

  /** Tutte le coppie (course, year) per una lezione: primario + additional */
  const getCourseYearPairs = (l: DbLessonExport): Array<{ course: string; year: number }> => {
    if (!l.course || l.year == null) return []
    const pairs: Array<{ course: string; year: number }> = [{ course: l.course, year: l.year }]
    const ac = l.additional_courses
    if (Array.isArray(ac)) {
      for (const p of ac) {
        if (p?.course && p?.year != null) {
          const dup = pairs.some((x) => x.course === p.course && x.year === p.year)
          if (!dup) pairs.push({ course: p.course, year: p.year })
        }
      }
    }
    return pairs
  }

  // Raggruppa per (platformCourse, year, semester)
  const byFile = new Map<string, DbLessonExport[]>()
  for (const l of lessons) {
    const pairs = getCourseYearPairs(l)
    for (const { course: platformCourse, year } of pairs) {
      const corso = PLATFORM_TO_CORSO[platformCourse]
      if (!corso) continue
      for (const sem of [1, 2]) {
        const key = `${corso}-${year}-${sem}`
        if (!byFile.has(key)) byFile.set(key, [])
        byFile.get(key)!.push({ ...l, course: platformCourse, year }) // override per corsoStudio corretto
      }
    }
  }

  // Costruisce path -> content e risultati per ogni file
  const filesToCommit: Array<{ path: string; content: string; corso: string; anno: number; sem: number; entries: number }> = []
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
      const pairs = getCourseYearPairs(l)
      const altriCorsiCodes: Array<[string, number]> = pairs
        .filter((p) => !(PLATFORM_TO_CORSO[p.course] === corsoStudio && p.year === anno))
        .map((p) => [PLATFORM_TO_CORSO[p.course], p.year] as [string, number])
        .filter(([c]) => c)
      jsonEntries.push(...dbLessonToJsonEntries(l, corsoStudio, anno, altriCorsiCodes, sem, yearStart))
    }
    jsonEntries.sort((a, b) => a.start.localeCompare(b.start))
    filesToCommit.push({
      path,
      content: JSON.stringify(jsonEntries, null, 2),
      corso: `${corso} ${anno}°`,
      anno,
      sem,
      entries: jsonEntries.length,
    })
  }

  if (filesToCommit.length === 0) return results

  const headers = {
    Authorization: `Bearer ${options.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  }
  const base = `https://api.github.com/repos/${repo}`

  try {
    // 1. Ottieni commit e tree SHA attuali
    const refRes = await fetch(`${base}/git/refs/heads/main`, { headers })
    if (!refRes.ok) {
      const err = await refRes.json().catch(() => ({}))
      return filesToCommit.map((f) => ({
        corso: f.corso,
        anno: f.anno,
        semester: f.sem,
        path: f.path,
        entries: f.entries,
        ok: false,
        error: (err as { message?: string }).message || refRes.statusText,
      }))
    }
    const refData = (await refRes.json()) as { object: { sha: string } }
    const commitSha = refData.object.sha

    const commitRes = await fetch(`${base}/git/commits/${commitSha}`, { headers })
    if (!commitRes.ok) {
      const err = await commitRes.json().catch(() => ({}))
      return filesToCommit.map((f) => ({
        corso: f.corso,
        anno: f.anno,
        semester: f.sem,
        path: f.path,
        entries: f.entries,
        ok: false,
        error: (err as { message?: string }).message || commitRes.statusText,
      }))
    }
    const commitData = (await commitRes.json()) as { tree: { sha: string } }
    const baseTreeSha = commitData.tree.sha

    // 2. Crea blob per ogni file
    const treeEntries: Array<{ path: string; mode: string; type: string; sha: string }> = []
    for (const f of filesToCommit) {
      const blobRes = await fetch(`${base}/git/blobs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: Buffer.from(f.content, 'utf-8').toString('base64'),
          encoding: 'base64',
        }),
      })
      if (!blobRes.ok) {
        const err = await blobRes.json().catch(() => ({}))
        return filesToCommit.map((file) => ({
          corso: file.corso,
          anno: file.anno,
          semester: file.sem,
          path: file.path,
          entries: file.entries,
          ok: false,
          error: (err as { message?: string }).message || blobRes.statusText,
        }))
      }
      const blobData = (await blobRes.json()) as { sha: string }
      treeEntries.push({
        path: f.path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      })
    }

    // 3. Crea tree unico con base_tree + nostri file
    const treeRes = await fetch(`${base}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeEntries,
      }),
    })
    if (!treeRes.ok) {
      const err = await treeRes.json().catch(() => ({}))
      return filesToCommit.map((f) => ({
        corso: f.corso,
        anno: f.anno,
        semester: f.sem,
        path: f.path,
        entries: f.entries,
        ok: false,
        error: (err as { message?: string }).message || treeRes.statusText,
      }))
    }
    const treeData = (await treeRes.json()) as { sha: string }
    const newTreeSha = treeData.sha

    // 4. Crea commit unico
    const newCommitRes = await fetch(`${base}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: `Aggiornamento orari da piattaforma (${filesToCommit.length} file)`,
        tree: newTreeSha,
        parents: [commitSha],
      }),
    })
    if (!newCommitRes.ok) {
      const err = await newCommitRes.json().catch(() => ({}))
      return filesToCommit.map((f) => ({
        corso: f.corso,
        anno: f.anno,
        semester: f.sem,
        path: f.path,
        entries: f.entries,
        ok: false,
        error: (err as { message?: string }).message || newCommitRes.statusText,
      }))
    }
    const newCommitData = (await newCommitRes.json()) as { sha: string }
    const newCommitSha = newCommitData.sha

    // 5. Aggiorna ref main
    const updateRefRes = await fetch(`${base}/git/refs/heads/main`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ sha: newCommitSha }),
    })
    if (!updateRefRes.ok) {
      const err = await updateRefRes.json().catch(() => ({}))
      return filesToCommit.map((f) => ({
        corso: f.corso,
        anno: f.anno,
        semester: f.sem,
        path: f.path,
        entries: f.entries,
        ok: false,
        error: (err as { message?: string }).message || updateRefRes.statusText,
      }))
    }

    // Successo: un solo commit, un solo workflow
    return filesToCommit.map((f) => ({
      corso: f.corso,
      anno: f.anno,
      semester: f.sem,
      path: f.path,
      entries: f.entries,
      ok: true,
    }))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Errore di rete'
    return filesToCommit.map((f) => ({
      corso: f.corso,
      anno: f.anno,
      semester: f.sem,
      path: f.path,
      entries: f.entries,
      ok: false,
      error: msg,
    }))
  }
}
