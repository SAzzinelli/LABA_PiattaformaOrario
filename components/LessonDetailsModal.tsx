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
  isOpen: boolean
  onClose: () => void
  lesson: Lesson | null
  dayDate: Date
}

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

export default function LessonDetailsModal({ isOpen, onClose, lesson, dayDate }: LessonDetailsModalProps) {
  if (!isOpen || !lesson) return null

  // Formatta orario senza secondi (solo HH:mm)
  const formatTime = (time: string) => {
    return time.substring(0, 5) // Prende solo HH:mm
  }

  // Ottieni il colore del corso per l'header
  const courseColor = getCourseColor(lesson.course)

  // Mappa colori header per stili inline (meno vividi, come le pillole)
  const headerColorMap: Record<string, string> = {
    'bg-purple-200': '#e9d5ff',
    'bg-red-200': '#fecaca',
    'bg-pink-200': '#fce7f3',
    'bg-blue-200': '#bfdbfe',
    'bg-green-200': '#bbf7d0',
    'bg-yellow-200': '#fef08a',
    'bg-orange-200': '#fed7aa',
    'bg-indigo-200': '#c7d2fe',
    'bg-laba-primary': '#033157',
  }

  const headerBgColor = headerColorMap[courseColor.header] || '#033157'

  return (
    <>
      {/* Backdrop blurrato */}
      <div
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-lg z-[100] animate-fade-in"
        onClick={onClose}
      />

      {/* Overlay contenuto */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-scale-in pointer-events-none">
        <div
          className="card-modern w-full max-w-2xl max-h-[85vh] overflow-hidden pointer-events-auto bg-white shadow-2xl rounded-xl"
          style={{ borderRadius: '12px', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div 
            className={`${courseColor.header} text-white p-6 flex items-center justify-between rounded-t-xl`} 
            style={{ borderRadius: '12px 12px 0 0', backgroundColor: headerBgColor }}
          >
            <div>
              <h2 className="text-2xl font-bold mb-1">{lesson.title}</h2>
              <div className="text-sm opacity-90">
                {DAYS[lesson.dayOfWeek]} - {format(dayDate, 'd MMMM yyyy', { locale: it })}
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full text-white hover:bg-white hover:bg-opacity-20 smooth-transition flex items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>

          {/* Contenuto */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-120px)]">
            <div className="space-y-6">
              {/* Pill con informazioni importanti - organizzate logicamente */}
              <div className="space-y-3">
                {/* Prima riga: Informazioni base (Orario e Aula) */}
                <div className="flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                    {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                  </span>
                  <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {lesson.classroom}
                  </span>
                </div>
                
                {/* Seconda riga: Informazioni di classificazione (Corso, Anno, Gruppo) */}
                {(lesson.course || lesson.year || lesson.group) && (
                  <div className="flex flex-wrap gap-3">
                    {lesson.course && (
                      <span className={`px-4 py-2 ${courseColor.bg} ${courseColor.text} rounded-full text-sm font-semibold`}>
                        {lesson.course}
                      </span>
                    )}
                    {lesson.year && (
                      <span className="px-4 py-2 bg-orange-100 text-orange-800 rounded-full text-sm font-semibold">
                        {lesson.year}° Anno
                      </span>
                    )}
                    {lesson.group && (
                      <span className="px-4 py-2 bg-pink-100 text-pink-800 rounded-full text-sm font-semibold">
                        {lesson.group.startsWith('Gruppo ') ? lesson.group : `Gruppo ${lesson.group}`}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Dettagli */}
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <div className="text-sm font-semibold text-gray-500 mb-2">Prof.</div>
                  <div className="text-lg text-gray-900">{lesson.professor}</div>
                </div>

                {lesson.notes && (
                  <div className="border-b border-gray-200 pb-4">
                    <div className="text-sm font-semibold text-gray-500 mb-2">Note</div>
                    <div className="text-base text-gray-900 whitespace-pre-wrap">{lesson.notes}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}


