'use client'

import { useState, useEffect } from 'react'
import { getClassroomsForLocation } from '@/lib/classrooms'
import { ALL_COURSES, getYearsForCourse, isTriennale, isBiennale } from '@/lib/courses'
import { Location, getCoursesForLocation } from '@/lib/locations'
import { getCourseColor } from '@/lib/courseColors'

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
  const availableClassrooms = getClassroomsForLocation(location)
  const availableCourses = getCoursesForLocation(location)
  
  // Filtra i corsi disponibili per la sede
  const courseOptions = ALL_COURSES.filter(c => availableCourses.includes(c))
  const [formData, setFormData] = useState({
    title: '',
    startTime: '',
    endTime: '',
    dayOfWeek: 1,
    classroom: '',
    professor: '',
    course: '',
    year: null as number | null,
    group: '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [updateScope, setUpdateScope] = useState<'single' | 'all_future'>('single')

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title,
        startTime: lesson.startTime,
        endTime: lesson.endTime,
        dayOfWeek: lesson.dayOfWeek,
        classroom: lesson.classroom,
        professor: lesson.professor,
        course: lesson.course || '',
        year: lesson.year || null,
        group: lesson.group || '',
        notes: lesson.notes || '',
      })
    }
  }, [lesson])

  const availableYears = formData.course ? getYearsForCourse(formData.course as any) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        ...formData,
        course: formData.course || undefined,
        year: formData.year || undefined,
        group: formData.group || undefined,
        notes: formData.notes || undefined,
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

  const courseColor = getCourseColor(lesson?.course, lesson?.year)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-scale-in shadow-2xl flex flex-col">
        {/* Header con colore del corso (meno saturo) */}
        <div
          className="px-8 py-6 text-white"
          style={{ backgroundColor: courseColor.bgHex }}
        >
          <div className="flex justify-between items-center">
            <h2
              className="text-2xl font-bold"
              style={{ color: courseColor.textHex }}
            >
              {lesson ? 'Modifica Lezione' : 'Nuova Lezione'}
            </h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black hover:bg-opacity-10 transition-colors"
              style={{ color: courseColor.textHex }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenuto scrollabile */}
        <div className="flex-1 overflow-y-auto p-8">

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Titolo Lezione *
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
                required
              />
            </div>

            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700 mb-1">
                Giorno della Settimana *
              </label>
              <select
                id="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({ ...formData, dayOfWeek: parseInt(e.target.value) })}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
                required
              >
                {DAYS_OF_WEEK.map((day) => (
                  <option key={day.value} value={day.value}>
                    {day.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
                Ora Inizio (HH:mm) *
              </label>
              <input
                id="startTime"
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
                required
              />
            </div>

            <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                Ora Fine (HH:mm) *
              </label>
              <input
                id="endTime"
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="professor" className="block text-sm font-medium text-gray-700 mb-1">
                Professore *
              </label>
              <input
                id="professor"
                type="text"
                value={formData.professor}
                onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
                required
              />
            </div>

            <div>
              <label htmlFor="classroom" className="block text-sm font-medium text-gray-700 mb-1">
                Aula *
              </label>
              <select
                id="classroom"
                value={formData.classroom}
                onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
                required
              >
                <option value="">Seleziona un'aula</option>
                {availableClassrooms.map((classroom) => (
                  <option key={classroom} value={classroom}>
                    {classroom}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                Corso
              </label>
              <select
                id="course"
                value={formData.course}
                onChange={(e) => {
                  setFormData({ ...formData, course: e.target.value, year: null })
                }}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
              >
                <option value="">Nessun corso specifico</option>
                <optgroup label="Triennali">
                  {courseOptions.filter(c => isTriennale(c)).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Biennali">
                  {courseOptions.filter(c => isBiennale(c)).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">
                Anno
              </label>
              <select
                id="year"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : null })}
                disabled={!formData.course}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-laba-primary focus:border-laba-primary transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">Tutti gli anni</option>
                {availableYears.map((y) => (
                  <option key={y} value={y}>
                    {y}° Anno
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
              Gruppo (lascia vuoto per "tutti")
            </label>
            <input
              id="group"
              type="text"
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value })}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
              placeholder="Es: Gruppo A, Gruppo B, oppure lascia vuoto"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Note Aggiuntive
            </label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
                className="input-modern w-full px-4 py-2.5 rounded-lg"
              placeholder="Note aggiuntive sulla lezione..."
            />
          </div>

          {/* Opzione per modificare solo questa o tutte le future (solo in modifica) */}
          {lesson && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Applica modifiche a:
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 cursor-pointer">
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
                    <p className="text-xs text-gray-600">Modifica solo questa occorrenza specifica</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
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
                    <p className="text-xs text-gray-600">Modifica questa e tutte le occorrenze future con le stesse caratteristiche</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
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

