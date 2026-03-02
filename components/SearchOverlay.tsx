'use client'

import { useState, useMemo } from 'react'
import { formatProfessorLines } from '@/lib/formatting'
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

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onSelectLesson: (lesson: Lesson, dayOfWeek: number) => void
  lessons: Lesson[]
}

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

export default function SearchOverlay({ isOpen, onClose, onSelectLesson, lessons }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLessons = useMemo(() => {
    if (searchQuery.trim() === '') return []
    const query = searchQuery.toLowerCase().trim()
    return lessons.filter(lesson =>
      lesson.title.toLowerCase().includes(query) ||
      lesson.professor.toLowerCase().includes(query) ||
      lesson.classroom.toLowerCase().includes(query) ||
      (lesson.course && lesson.course.toLowerCase().includes(query)) ||
      (lesson.notes && lesson.notes.toLowerCase().includes(query))
    )
  }, [searchQuery, lessons])

  const handleClose = () => {
    setSearchQuery('')
    onClose()
  }

  const handleSelectLesson = (lesson: Lesson) => {
    onSelectLesson(lesson, lesson.dayOfWeek)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop blurrato */}
      <div 
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[150] animate-fade-in cursor-pointer"
        onClick={handleClose}
      />
      
      {/* Overlay contenuto - Mobile first design */}
      <div className="fixed inset-0 z-[150] flex items-start justify-center pt-16 sm:pt-20 px-0 sm:px-4 animate-scale-in pointer-events-none">
        <div 
          className="card-modern w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[70vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-laba-primary text-white p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-bold">Cerca Lezione</h2>
            <button
              onClick={handleClose}
              className="cursor-pointer w-8 h-8 rounded-full text-white hover:bg-white/20 smooth-transition flex items-center justify-center text-2xl flex-shrink-0"
            >
              ×
            </button>
          </div>

          {/* Input ricerca */}
          <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per materia, professore, aula..."
              className="input-modern w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-sm sm:text-base"
              autoFocus
            />
          </div>

          {/* Risultati */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {searchQuery.trim() === '' ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-base sm:text-lg mb-2">Inizia a digitare per cercare</p>
                <p className="text-xs sm:text-sm">Cerca per materia, professore, aula o corso</p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="p-6 sm:p-8 text-center text-gray-500">
                <p className="text-base sm:text-lg">Nessun risultato trovato</p>
                <p className="text-xs sm:text-sm mt-2">Prova con altri termini di ricerca</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {filteredLessons.map((lesson) => {
                  const courseColor = getCourseColor(lesson.course, lesson.year)
                  const formatTime = (t: string) => t.split(':').slice(0, 2).join(':')
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => handleSelectLesson(lesson)}
                      className="cursor-pointer w-full p-3 sm:p-4 text-left hover:opacity-95 active:opacity-90 smooth-transition"
                      style={{ backgroundColor: courseColor.borderColor + '0a' }}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Pill: Orario, Corso, Gruppo */}
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span
                              className="px-2.5 py-1 rounded-lg font-semibold text-xs whitespace-nowrap"
                              style={{ backgroundColor: courseColor.borderColor + '25', color: courseColor.textHex }}
                            >
                              {formatTime(lesson.startTime)} – {formatTime(lesson.endTime)}
                            </span>
                            {lesson.course && (
                              <span
                                className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                                style={{ backgroundColor: courseColor.borderColor, color: courseColor.textHex }}
                              >
                                {getCourseCode(lesson.course)}{lesson.year ? ` ${lesson.year}` : ''}
                              </span>
                            )}
                            {lesson.additionalCourses?.map((ac, i) => {
                              const acColor = getCourseColor(ac.course, ac.year)
                              return (
                                <span
                                  key={i}
                                  className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                                  style={{ backgroundColor: acColor.borderColor, color: acColor.textHex }}
                                >
                                  {getCourseCode(ac.course)}{ac.year}
                                </span>
                              )
                            })}
                            <span
                              className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
                              style={{
                                backgroundColor: lesson.group ? courseColor.borderColor : 'rgba(107, 114, 128, 0.2)',
                                color: lesson.group ? courseColor.textHex : '#4b5563',
                              }}
                            >
                              {lesson.group ? `Gruppo ${lesson.group}` : 'Tutti'}
                            </span>
                            <span
                              className="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap"
                              style={{ backgroundColor: courseColor.bgHex, color: courseColor.textHex }}
                            >
                              {lesson.classroom}
                            </span>
                          </div>
                          <h3
                            className="font-bold text-base sm:text-lg mb-2 break-words"
                            style={{ color: courseColor.textHex }}
                          >
                            {lesson.title}
                          </h3>
                          <div className="text-xs sm:text-sm text-slate-600">
                            <span className="font-medium">{DAYS[lesson.dayOfWeek]}</span>
                            <span className="mx-1">·</span>
                            <span className="leading-tight">
                              {formatProfessorLines(lesson.professor).map((line, i) => (
                                <span key={i}>{i > 0 ? ' ' : ''}{line}</span>
                              ))}
                            </span>
                          </div>
                        </div>
                        <div className="flex-shrink-0 sm:text-right pt-1 sm:pt-0">
                          <span
                            className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium rounded-lg"
                            style={{ backgroundColor: courseColor.borderColor, color: courseColor.textHex }}
                          >
                            Vai
                          </span>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

