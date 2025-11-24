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
      
      {/* Overlay contenuto */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 animate-scale-in pointer-events-none">
        <div 
          className="card-modern w-full max-w-3xl max-h-[70vh] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-laba-primary text-white p-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Cerca Lezione</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-white hover:bg-white hover:bg-opacity-20 smooth-transition flex items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>

          {/* Input ricerca */}
          <div className="p-4 border-b border-gray-200">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cerca per materia, professore, aula, corso..."
              className="input-modern w-full px-4 py-3 rounded-lg text-base"
              autoFocus
            />
          </div>

          {/* Risultati */}
          <div className="overflow-y-auto max-h-[calc(70vh-140px)]">
            {searchQuery.trim() === '' ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg mb-2">Inizia a digitare per cercare</p>
                <p className="text-sm">Cerca per materia, professore, aula o corso</p>
              </div>
            ) : filteredLessons.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <p className="text-lg">Nessun risultato trovato</p>
                <p className="text-sm mt-2">Prova con altri termini di ricerca</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredLessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => handleSelectLesson(lesson)}
                    className="w-full p-4 text-left hover:bg-gray-50 smooth-transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="font-bold text-lg text-laba-primary mb-1">
                          {lesson.title}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Giorno:</span>
                            <span>{DAYS[lesson.dayOfWeek]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Orario:</span>
                            <span>{lesson.startTime} - {lesson.endTime}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Aula:</span>
                            <span>{lesson.classroom}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Professore:</span>
                            <span>{lesson.professor}</span>
                          </div>
                          {lesson.course && (
                            <div className="flex items-center gap-2">
                              <span className="font-medium">Corso:</span>
                              <span>{lesson.course} {lesson.year && `- ${lesson.year}° Anno`}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="px-3 py-1 bg-laba-primary text-white text-xs font-medium rounded-full">
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

