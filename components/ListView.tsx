'use client'

import { format } from 'date-fns'
import { it } from 'date-fns/locale'
import { getCourseColor, getCourseCode } from '@/lib/courseColors'

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

interface ListViewProps {
  lessons: Lesson[]
  currentDate: Date
  isAuthenticated: boolean
  onEditLesson?: (lesson: Lesson) => void
  onViewLesson?: (lesson: Lesson) => void
}

export default function ListView({ 
  lessons, 
  currentDate, 
  isAuthenticated,
  onEditLesson,
  onViewLesson 
}: ListViewProps) {
  // Funzione per normalizzare il nome dell'aula (per evitare duplicati)
  const normalizeClassroom = (classroom: string): string => {
    if (classroom === 'Magna 1' || classroom === 'Magna 2') return 'Aula Magna'
    if (classroom === 'Conference 1' || classroom === 'Conference 2') return 'Conference'
    return classroom
  }

  // Filtra lezioni per il giorno corrente e deduplica
  const dayLessonsRaw = lessons.filter(lesson => lesson.dayOfWeek === currentDate.getDay())
  
  // Deduplica lezioni basandosi su titolo, orario, professore e aula normalizzata
  const seen = new Set<string>()
  const dayLessons = dayLessonsRaw
    .filter(lesson => {
      const normalizedClassroom = normalizeClassroom(lesson.classroom)
      const key = `${lesson.title}-${lesson.startTime}-${lesson.endTime}-${lesson.professor}-${normalizedClassroom}-${lesson.course || ''}-${lesson.year || ''}-${lesson.group || ''}`
      
      if (seen.has(key)) {
        return false // Duplicato, escludi
      }
      seen.add(key)
      return true
    })
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const formatTime = (time: string) => time.split(':').slice(0, 2).join(':')

  if (dayLessons.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4 text-gray-500">
        <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-base sm:text-lg font-medium text-center">Nessuna lezione in programma</p>
        <p className="text-xs sm:text-sm text-center mt-1">Per questo giorno non ci sono lezioni programmate</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-2 sm:px-4 py-4 space-y-3 sm:space-y-4">
      {dayLessons.map((lesson) => {
        const courseColor = getCourseColor(lesson.course, lesson.year)
        const handleClick = () => {
          if (isAuthenticated && onEditLesson) {
            onEditLesson(lesson)
          } else if (!isAuthenticated && onViewLesson) {
            onViewLesson(lesson)
          }
        }

        return (
          <div
            key={lesson.id}
            onClick={handleClick}
            className="bg-white rounded-lg border-l-4 border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden group"
            style={{
              borderLeftColor: courseColor.borderColor,
            }}
          >
            <div className="p-3 sm:p-4">
              {/* Header con orario e badge corso */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0 flex-wrap">
                  <div 
                    className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg font-semibold text-xs sm:text-sm whitespace-nowrap flex-shrink-0"
                    style={{ 
                      backgroundColor: courseColor.borderColor + '20',
                      color: courseColor.textHex 
                    }}
                  >
                    {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
                  </div>
                  {lesson.course && lesson.year && (
                    <div 
                      className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0"
                      style={{ 
                        backgroundColor: courseColor.borderColor,
                        color: courseColor.textHex 
                      }}
                    >
                      {getCourseCode(lesson.course)} {lesson.year}
                    </div>
                  )}
                  {lesson.group && (
                    <div 
                      className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold whitespace-nowrap flex-shrink-0"
                      style={{ 
                        backgroundColor: courseColor.borderColor,
                        color: courseColor.textHex 
                      }}
                    >
                      Gruppo {lesson.group}
                    </div>
                  )}
                </div>
                <div 
                  className="px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap flex-shrink-0"
                  style={{ 
                    backgroundColor: courseColor.bgHex,
                    color: courseColor.textHex 
                  }}
                >
                  {lesson.classroom}
                </div>
              </div>

              {/* Titolo lezione */}
              <h3 
                className="text-base sm:text-lg font-bold mb-2 sm:mb-3 break-words"
                style={{ color: courseColor.textHex }}
              >
                {lesson.title}
              </h3>

              {/* Dettagli */}
              <div className="space-y-1.5 sm:space-y-2">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                  <span className="font-semibold text-gray-600">Professore:</span>
                  <span className="text-gray-700">{lesson.professor}</span>
                </div>
                {lesson.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600">{lesson.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
