'use client'

import { useState, useEffect } from 'react'
import { CLASSROOMS } from '@/lib/classrooms'
import { ALL_COURSES, getYearsForCourse, isTriennale, isBiennale } from '@/lib/courses'

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
  onClose: () => void
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

export default function LessonForm({ lesson, onClose }: LessonFormProps) {
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
  const [updateScope, setUpdateScope] = useState<'single' | 'future'>('single')

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
        updateScope: lesson ? updateScope : undefined, // Solo per modifiche
      }

      const url = lesson ? `/api/lessons/${lesson.id}` : '/api/lessons'
      const method = lesson ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="card-modern p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-laba-primary">
            {lesson ? 'Modifica Lezione' : 'Nuova Lezione'}
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 smooth-transition flex items-center justify-center text-2xl hover-scale"
          >
            ×
          </button>
        </div>

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
                {CLASSROOMS.map((classroom) => (
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
                  {ALL_COURSES.filter(c => isTriennale(c)).map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Biennali">
                  {ALL_COURSES.filter(c => isBiennale(c)).map((c) => (
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

          {/* Scelta ambito modifica (solo per modifiche) */}
          {lesson && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-3">
              Modifica:
            </label>
            <div className="flex gap-4">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="updateScope"
                  value="single"
                  checked={updateScope === 'single'}
                  onChange={(e) => setUpdateScope(e.target.value as 'single' | 'future')}
                  className="mr-2 w-4 h-4 text-laba-primary focus:ring-laba-primary"
                />
                <span className="text-sm text-gray-700">Solo questa lezione</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="updateScope"
                  value="future"
                  checked={updateScope === 'future'}
                  onChange={(e) => setUpdateScope(e.target.value as 'single' | 'future')}
                  className="mr-2 w-4 h-4 text-laba-primary focus:ring-laba-primary"
                />
                <span className="text-sm text-gray-700">Tutte le lezioni future con le stesse caratteristiche</span>
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
  )
}

