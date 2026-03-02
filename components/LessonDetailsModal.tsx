'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { getCourseColor } from '@/lib/courseColors'
import { formatProfessorLines } from '@/lib/formatting'

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
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[150] animate-fade-in cursor-pointer"
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
              className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/10 transition-colors"
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
              <div className="text-base font-semibold text-gray-900 leading-tight">
                {formatProfessorLines(lesson.professor).map((line, i) => (
                  <div key={i}>{line}</div>
                ))}
              </div>
            </div>
          </div>

          {/* Corso e Gruppo come pill */}
          <div className="flex flex-wrap gap-2 items-center">
            {(lesson.course || (lesson.additionalCourses?.length ?? 0) > 0) && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">
                  Corso{(lesson.additionalCourses?.length ?? 0) > 0 ? 'i' : ''}
                </div>
                <div className="flex flex-wrap gap-2">
                  {lesson.course && (
                    <span
                      className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold"
                      style={{ backgroundColor: courseColor.borderColor, color: courseColor.textHex }}
                    >
                      {lesson.course}
                      {lesson.year && ` ${lesson.year}°`}
                    </span>
                  )}
                  {lesson.additionalCourses?.map((ac, i) => {
                    const acColor = getCourseColor(ac.course, ac.year)
                    return (
                      <span
                        key={i}
                        className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold"
                        style={{ backgroundColor: acColor.borderColor, color: acColor.textHex }}
                      >
                        {ac.course} {ac.year}°
                      </span>
                    )
                  })}
                  <span
                    className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold"
                    style={{
                      backgroundColor: lesson.group ? courseColor.borderColor : 'rgba(107, 114, 128, 0.25)',
                      color: lesson.group ? courseColor.textHex : '#4b5563',
                    }}
                  >
                    {lesson.group ? `Gruppo ${lesson.group}` : 'Tutti'}
                  </span>
                </div>
              </div>
            )}
            {!lesson.course && (
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wide font-medium mb-1.5">
                  Partecipanti
                </div>
                <span
                  className="inline-flex px-3 py-1.5 rounded-full text-sm font-semibold"
                  style={{
                    backgroundColor: lesson.group ? courseColor.borderColor : 'rgba(107, 114, 128, 0.25)',
                    color: lesson.group ? courseColor.textHex : '#4b5563',
                  }}
                >
                  {lesson.group ? `Gruppo ${lesson.group}` : 'Tutti'}
                </span>
              </div>
            )}
          </div>

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
              className="cursor-pointer px-4 py-2 rounded-lg font-medium text-sm transition-colors"
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





