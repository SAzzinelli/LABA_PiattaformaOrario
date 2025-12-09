'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

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

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
  onSelectLesson: (lesson: Lesson, dayOfWeek: number) => void
  lessons: Lesson[]
}

const DAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato']

export default function SearchOverlay({ isOpen, onClose, onSelectLesson, lessons }: SearchOverlayProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([])

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setFilteredLessons([])
      return
    }
  }, [isOpen])

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredLessons([])
      return
    }

    const query = searchQuery.toLowerCase().trim()
    const filtered = lessons.filter(lesson => {
      return (
        lesson.title.toLowerCase().includes(query) ||
        lesson.professor.toLowerCase().includes(query) ||
        lesson.classroom.toLowerCase().includes(query) ||
        (lesson.course && lesson.course.toLowerCase().includes(query)) ||
        (lesson.notes && lesson.notes.toLowerCase().includes(query))
      )
    })

    setFilteredLessons(filtered)
  }, [searchQuery, lessons])

  const handleSelectLesson = (lesson: Lesson) => {
    onSelectLesson(lesson, lesson.dayOfWeek)
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop blurrato */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Overlay contenuto - Mobile first design */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-0 sm:px-4 animate-scale-in pointer-events-none">
        <div 
          className="card-modern w-full h-full sm:h-auto sm:max-w-3xl sm:max-h-[70vh] overflow-hidden pointer-events-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-laba-primary text-white p-3 sm:p-4 flex items-center justify-between flex-shrink-0">
            <h2 className="text-lg sm:text-xl font-bold">Cerca Lezione</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-white hover:bg-white hover:bg-opacity-20 smooth-transition flex items-center justify-center text-2xl flex-shrink-0"
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
              <div className="divide-y divide-gray-100">
                {filteredLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className="w-full p-3 sm:p-4 text-left hover:bg-gray-50 active:bg-gray-100 smooth-transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-base sm:text-lg text-laba-primary mb-1.5 break-words">
                          {lesson.title}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-medium whitespace-nowrap">Giorno:</span>
                            <span>{DAYS[lesson.dayOfWeek]}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-medium whitespace-nowrap">Orario:</span>
                            <span className="whitespace-nowrap">{lesson.startTime.split(':').slice(0, 2).join(':')} - {lesson.endTime.split(':').slice(0, 2).join(':')}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-medium whitespace-nowrap">Aula:</span>
                            <span>{lesson.classroom}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <span className="font-medium whitespace-nowrap">Professore:</span>
                            <span>{lesson.professor}</span>
                          </div>
                          {lesson.course && (
                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                              <span className="font-medium whitespace-nowrap">Corso:</span>
                              <span>{lesson.course} {lesson.year && `- ${lesson.year}° Anno`}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-shrink-0 sm:text-right pt-1 sm:pt-0">
                        <div className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-laba-primary text-white text-xs sm:text-sm font-medium rounded-lg sm:rounded-full">
                          Vai
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

