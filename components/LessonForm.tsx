'use client'

import { useState, useEffect } from 'react'
import { getClassroomsForLocation } from '@/lib/classrooms'
import { ALL_COURSES, getYearsForCourse } from '@/lib/courses'
import { getGroupsForCourse } from '@/lib/courseGroups'
import { Location, getCoursesForLocation } from '@/lib/locations'
import { getCourseColor, getCourseCode } from '@/lib/courseColors'

interface AdditionalCourse {
  course: string
  year: number
}

interface Lesson {
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
  additionalCourses?: AdditionalCourse[]
}

interface LessonFormProps {
  lesson?: Lesson | null
  location: Location
  onClose: () => void
  onDelete?: (id: string) => void
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domenica' },
  { value: 1, label: 'Lunedì' },
  { value: 2, label: 'Martedì' },
  { value: 3, label: 'Mercoledì' },
  { value: 4, label: 'Giovedì' },
  { value: 5, label: 'Venerdì' },
  { value: 6, label: 'Sabato' },
]

export default function LessonForm({ lesson, location, onClose, onDelete }: LessonFormProps) {
  const availableCourses = getCoursesForLocation(location)
  
  // Filtra i corsi disponibili per la sede
  const courseOptions = ALL_COURSES.filter(c => availableCourses.includes(c))

  /** Tutti i corsi della lezione (course+year + additionalCourses unificati) */
  const getInitialCourses = (l: Lesson | null | undefined): AdditionalCourse[] => {
    if (!l) return []
    const out: AdditionalCourse[] = []
    if (l.course && l.year != null) out.push({ course: l.course, year: l.year })
    for (const ac of l.additionalCourses ?? []) {
      if (ac?.course && ac?.year != null && !out.some(c => c.course === ac.course && c.year === ac.year)) {
        out.push({ course: ac.course, year: ac.year })
      }
    }
    return out
  }

  const getInitialFormData = (l: Lesson | null | undefined) =>
    l
      ? {
          title: l.title,
          startTime: l.startTime,
          endTime: l.endTime,
          dayOfWeek: l.dayOfWeek,
          classroom: l.classroom,
          professor: l.professor,
          courses: getInitialCourses(l),
          group: l.group || '',
          notes: l.notes || '',
        }
      : {
          title: '',
          startTime: '',
          endTime: '',
          dayOfWeek: 1,
          classroom: '',
          professor: '',
          courses: [] as AdditionalCourse[],
          group: '',
          notes: '',
        }

  const [formData, setFormData] = useState(() => getInitialFormData(lesson))
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [updateScope, setUpdateScope] = useState<'single' | 'all_future'>('single')
  const [professorOptions, setProfessorOptions] = useState<string[]>([])
  const [extraClassrooms, setExtraClassrooms] = useState<string[]>([])
  const canonicalClassrooms = getClassroomsForLocation(location)

  useEffect(() => {
    fetch('/api/lessons/options')
      .then(res => res.json())
      .then(data => {
        setProfessorOptions(data.professors || [])
        const fromDb = data.classrooms || []
        setExtraClassrooms(fromDb.filter((a: string) => !canonicalClassrooms.includes(a)))
      })
      .catch(() => { setProfessorOptions([]); setExtraClassrooms([]) })
  }, [location])

  const availableClassrooms = [...canonicalClassrooms, ...extraClassrooms]

  const firstCourse = formData.courses[0]
  const availableGroups = firstCourse ? getGroupsForCourse(firstCourse.course, firstCourse.year) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (formData.courses.length === 0) {
      setError('Seleziona almeno un corso')
      return
    }
    setLoading(true)

    try {
      const [primary, ...rest] = formData.courses
      const payload = {
        title: formData.title,
        startTime: formData.startTime,
        endTime: formData.endTime,
        dayOfWeek: formData.dayOfWeek,
        classroom: formData.classroom,
        professor: formData.professor,
        group: formData.group || undefined,
        notes: formData.notes || undefined,
        course: primary?.course,
        year: primary?.year,
        additionalCourses: rest.length > 0 ? rest : undefined,
      }

      const url = lesson ? `/api/lessons/${lesson.id}` : '/api/lessons'
      const method = lesson ? 'PUT' : 'POST'

      // Se è una modifica, aggiungi lo scope dell'aggiornamento
      const requestBody = lesson 
        ? { ...payload, updateScope }
        : payload

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || 'Errore durante il salvataggio')
        setLoading(false)
        return
      }

      onClose()
    } catch (err) {
      setError('Errore di connessione')
      setLoading(false)
    }
  }

  const courseColor = getCourseColor(
    formData.courses[0]?.course ?? lesson?.course,
    formData.courses[0]?.year ?? lesson?.year
  )

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[150] animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in shadow-2xl flex flex-col">
        {/* Header */}
        <div
          className="px-6 sm:px-8 py-5 text-white shrink-0"
          style={{ backgroundColor: courseColor.bgHex }}
        >
          <div className="flex justify-between items-center">
            <h2
              className="text-xl sm:text-2xl font-bold"
              style={{ color: courseColor.textHex }}
            >
              {lesson ? 'Modifica lezione' : 'Nuova lezione'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
              style={{ color: courseColor.textHex }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Sezione: Informazioni base */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Lezione
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Titolo *
                </label>
                <input
                  id="title"
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-laba-primary/50"
                  placeholder="Es. Tecniche di Modellazione Digitale"
                  required
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1.5">Giorno *</label>
                  <select
                    id="dayOfWeek"
                    value={formData.dayOfWeek}
                    onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                    className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200"
                    required
                  >
                    {DAYS_OF_WEEK.map((day) => (
                      <option key={day.value} value={day.value}>{day.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1.5">Ora inizio *</label>
                  <input
                    id="startTime"
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1.5">Ora fine *</label>
                  <input
                    id="endTime"
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200"
                    required
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Sezione: Dove e chi */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Dove e chi
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="professor" className="block text-sm font-medium text-gray-700 mb-1.5">Professore *</label>
                <select
                  id="professor"
                  value={formData.professor}
                  onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                  className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  required
                >
                  <option value="">Seleziona professore</option>
                  {professorOptions.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                  {formData.professor && !professorOptions.includes(formData.professor) && (
                    <option value={formData.professor}>{formData.professor}</option>
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-1.5">Aula *</label>
                <select
                  id="classroom"
                  value={formData.classroom}
                  onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                  className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  required
                >
                  <option value="">Seleziona aula</option>
                  {availableClassrooms.map((classroom) => (
                    <option key={classroom} value={classroom}>{classroom}</option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          {/* Sezione: Corsi (multi-select, nessun corso principale) */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Per quali corsi è questa lezione
            </h3>
            <p className="text-sm text-gray-600 -mt-2">
              Seleziona uno o più corsi. La lezione appartiene a tutti in modo uguale (es. Inglese Comunicazione Artistica → GD 3°, Pittura 3°).
            </p>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl bg-gray-50/80 border border-gray-100 min-h-[52px]">
              {formData.courses.map((c, idx) => {
                const cColor = getCourseColor(c.course, c.year)
                return (
                  <span
                    key={`${c.course}-${c.year}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm"
                    style={{ backgroundColor: cColor.borderColor, color: cColor.textHex }}
                  >
                    {getCourseCode(c.course)} {c.year}°
                    <button
                      type="button"
                      onClick={() => {
                        const next = formData.courses.filter((_, i) => i !== idx)
                        const newGroups = next[0] ? getGroupsForCourse(next[0].course, next[0].year) : []
                        const keepGroup = formData.group && newGroups.includes(formData.group)
                        setFormData({ ...formData, courses: next, group: keepGroup ? formData.group : '' })
                      }}
                      className="hover:opacity-80 rounded-full p-0.5 transition-opacity"
                      aria-label="Rimuovi corso"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
            <select
              id="addCourse"
              className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              value=""
              onChange={(e) => {
                const v = e.target.value
                if (!v) return
                const [course, yearStr] = v.split('|')
                const year = parseInt(yearStr, 10)
                if (formData.courses.some((c) => c.course === course && c.year === year)) return
                const next = [...formData.courses, { course, year }]
                const newGroups = next.length === 1 ? getGroupsForCourse(course, year) : []
                const keepGroup = next.length === 1 && newGroups.includes(formData.group) ? formData.group : ''
                setFormData({ ...formData, courses: next, group: keepGroup })
                e.target.value = ''
              }}
            >
              <option value="">+ Aggiungi corso e anno...</option>
              {courseOptions
                .flatMap((c) =>
                  getYearsForCourse(c as any).map((y) => ({ course: c, year: y, label: `${getCourseCode(c)} ${y}°`, value: `${c}|${y}` }))
                )
                .filter((opt) => !formData.courses.some((c) => c.course === opt.course && c.year === opt.year))
                .map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            {formData.courses.length === 0 && (
              <p className="text-amber-600 text-sm">Seleziona almeno un corso per salvare.</p>
            )}
          </section>

          {/* Sezione: Gruppo e note */}
          <section className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Gruppo e note
            </h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Gruppo
                </label>
                <select
                  id="group"
                  value={formData.group}
                  onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                  className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200"
                  disabled={!firstCourse}
                >
                  <option value="">Tutti</option>
                  {availableGroups.map((g) => (
                    <option key={g} value={g}>Gruppo {g}</option>
                  ))}
                  {formData.group && !availableGroups.includes(formData.group) && (
                    <option value={formData.group}>Gruppo {formData.group}</option>
                  )}
                </select>
                <p className="text-xs text-gray-500 mt-1">Lascia vuoto per lezione aperta a tutti</p>
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">Note</label>
                <textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="input-modern w-full px-4 py-2.5 rounded-xl border border-gray-200 resize-none"
                  placeholder="Note aggiuntive (opzionale)"
                />
              </div>
            </div>
          </section>

          {/* Opzione scope (solo in modifica) */}
          {lesson && (
            <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Applica modifiche a</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/60 transition-colors">
                  <input
                    type="radio"
                    name="updateScope"
                    value="single"
                    checked={updateScope === 'single'}
                    onChange={(e) => setUpdateScope(e.target.value as 'single' | 'all_future')}
                    className="w-4 h-4 text-laba-primary focus:ring-laba-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Solo questa lezione</span>
                    <p className="text-xs text-gray-600">Modifica solo questa occorrenza</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-white/60 transition-colors">
                  <input
                    type="radio"
                    name="updateScope"
                    value="all_future"
                    checked={updateScope === 'all_future'}
                    onChange={(e) => setUpdateScope(e.target.value as 'single' | 'all_future')}
                    className="w-4 h-4 text-laba-primary focus:ring-laba-primary"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Tutte le lezioni future</span>
                    <p className="text-xs text-gray-600">Propaga a tutte le occorrenze con stesse caratteristiche</p>
                  </div>
                </label>
              </div>
            </section>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            {lesson && onDelete && (
              <button
                type="button"
                onClick={async () => {
                  if (confirm('Sei sicuro di voler eliminare questa lezione?')) {
                    try {
                      const res = await fetch(`/api/lessons/${lesson.id}`, {
                        method: 'DELETE',
                      })
                      if (res.ok) {
                        onDelete(lesson.id)
                        onClose()
                      } else {
                        setError('Errore durante l\'eliminazione')
                      }
                    } catch (err) {
                      setError('Errore di connessione')
                    }
                  }
                }}
                className="btn-modern px-5 py-2.5 rounded-full bg-red-600 text-white text-sm font-medium shadow-md relative overflow-hidden hover:bg-red-700"
              >
                <span className="relative z-10">Elimina</span>
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="btn-modern flex-1 rounded-full bg-laba-primary text-white py-2.5 px-6 text-sm font-medium disabled:opacity-50 disabled:hover:scale-100 shadow-md relative overflow-hidden"
            >
              <span className="relative z-10">{loading ? 'Salvataggio...' : lesson ? 'Salva Modifiche' : 'Crea Lezione'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-modern px-5 py-2.5 rounded-full border-2 border-gray-300 text-sm font-medium shadow-md relative overflow-hidden"
            >
              <span className="relative z-10">Annulla</span>
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  )
}

