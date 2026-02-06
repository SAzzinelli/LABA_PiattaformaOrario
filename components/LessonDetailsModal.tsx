'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
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

interface LessonDetailsModalProps {
  lesson: Lesson | null
  currentDate: Date
  isOpen: boolean
  onClose: () => void
  onEdit?: (lesson: Lesson) => void
}

const DAYS_OF_WEEK = [
  'Domenica',
  'Lunedì',
  'Martedì',
  'Mercoledì',
  'Giovedì',
  'Venerdì',
  'Sabato',
]

export default function LessonDetailsModal({
  lesson,
  currentDate,
  isOpen,
  onClose,
  onEdit,
}: LessonDetailsModalProps) {
  if (!isOpen || !lesson) return null

  const courseColor = getCourseColor(lesson.course, lesson.year)
  const dayName = DAYS_OF_WEEK[lesson.dayOfWeek]
  const formattedDate = format(currentDate, 'd MMMM yyyy', { locale: it })

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 animate-scale-in overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header con colore del corso (meno saturo) */}
        <div
          className="px-6 py-4 text-white"
          style={{ backgroundColor: courseColor.bgHex }}
        >
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2
                className="text-xl font-bold mb-1"
                style={{ color: courseColor.textHex }}
              >
                {lesson.title}
              </h2>
              <p className="text-sm opacity-90" style={{ color: courseColor.textHex }}>
                {dayName} - {formattedDate}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black hover:bg-opacity-10 transition-colors"
              style={{ color: courseColor.textHex }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Contenuto principale */}
        <div className="px-6 py-5 space-y-4">
          {/* Orario - come badge discreto */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: courseColor.bgHex }}>
              <svg className="w-5 h-5" style={{ color: courseColor.textHex }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">
                Orario
              </div>
              <div className="text-base font-semibold text-gray-900">
                {lesson.startTime.substring(0, 5)} - {lesson.endTime.substring(0, 5)}
              </div>
            </div>
          </div>

          {/* Aula */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: courseColor.bgHex }}>
              <svg className="w-5 h-5" style={{ color: courseColor.textHex }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">
                Aula
              </div>
              <div className="text-base font-semibold text-gray-900">
                {lesson.classroom}
              </div>
            </div>
          </div>

          {/* Professore */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: courseColor.bgHex }}>
              <svg className="w-5 h-5" style={{ color: courseColor.textHex }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">
                Professore
              </div>
              <div className="text-base font-semibold text-gray-900">
                {lesson.professor}
              </div>
            </div>
          </div>

          {/* Corso (se presente) */}
          {lesson.course && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: courseColor.bgHex }}>
                <svg className="w-5 h-5" style={{ color: courseColor.textHex }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">
                  Corso
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {lesson.course}
                  {lesson.year && ` - ${lesson.year}° Anno`}
                </div>
              </div>
            </div>
          )}

          {/* Gruppo (se presente) */}
          {lesson.group && (
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: courseColor.bgHex }}>
                <svg className="w-5 h-5" style={{ color: courseColor.textHex }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-0.5">
                  Gruppo
                </div>
                <div className="text-base font-semibold text-gray-900">
                  {lesson.group}
                </div>
              </div>
            </div>
          )}

          {/* Note (se presenti) */}
          {lesson.notes && (
            <div className="pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-2">
                Note
              </div>
              <div className="text-sm text-gray-700 leading-relaxed">
                {lesson.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer con pulsante modifica (se admin) */}
        {onEdit && (
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
            <button
              onClick={() => {
                onEdit(lesson)
                onClose()
              }}
              className="px-4 py-2 rounded-lg font-medium text-sm transition-colors"
              style={{
                backgroundColor: courseColor.bgHex,
                color: courseColor.textHex,
              }}
            >
              Modifica
            </button>
          </div>
        )}
      </div>
    </div>
  )
}





