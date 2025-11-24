'use client'

import { useState, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import LessonForm from './LessonForm'
import LessonFilters from './LessonFilters'
import { CLASSROOMS, getBaseClassrooms, getFirstExternalIndex } from '@/lib/classrooms'
import { generateTimeSlots, getTimePosition, getCurrentTime } from '@/lib/timeSlots'

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

const dayHeaderColors: Record<number, string> = {
  0: 'bg-laba-sunday',
  1: 'bg-laba-monday',
  2: 'bg-laba-tuesday',
  3: 'bg-laba-wednesday',
  4: 'bg-laba-thursday',
  5: 'bg-laba-friday',
  6: 'bg-laba-saturday',
}

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [currentTime, setCurrentTime] = useState(getCurrentTime())
  
  // Filtri
  const [filterCourse, setFilterCourse] = useState('')
  const [filterYear, setFilterYear] = useState<number | null>(null)

  const timeSlots = generateTimeSlots()
  const classrooms = getBaseClassrooms()
  
  // Calcola la larghezza minima basata sul nome più lungo
  const getMinClassroomWidth = () => {
    const maxLength = Math.max(...classrooms.map(c => c.length))
    // Approssimativamente 8px per carattere + padding
    return Math.max(140, maxLength * 8 + 32)
  }
  const minClassroomWidth = getMinClassroomWidth()

  useEffect(() => {
    checkAuth()
    loadLessons()
    
    // Aggiorna l'orario corrente ogni minuto
    const interval = setInterval(() => {
      setCurrentTime(getCurrentTime())
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    loadLessons()
  }, [filterCourse, filterYear])

  const checkAuth = async () => {
    const res = await fetch('/api/auth/check')
    const data = await res.json()
    setIsAuthenticated(data.authenticated)
  }

  const loadLessons = async () => {
    const params = new URLSearchParams()
    if (filterCourse) params.append('course', filterCourse)
    if (filterYear !== null) params.append('year', filterYear.toString())
    
    const res = await fetch(`/api/lessons?${params.toString()}`)
    const data = await res.json()
    setLessons(data)
  }

  const handleAddLesson = () => {
    setEditingLesson(null)
    setShowForm(true)
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setShowForm(true)
  }

  const handleDeleteLesson = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa lezione?')) return
    
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        loadLessons()
      }
    } catch (error) {
      console.error('Errore durante l\'eliminazione:', error)
    }
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingLesson(null)
    loadLessons()
  }

  const getLessonsForDay = (date: Date): Lesson[] => {
    const dayOfWeek = date.getDay()
    return lessons.filter(lesson => lesson.dayOfWeek === dayOfWeek)
  }

  const getLessonsForClassroom = (dayLessons: Lesson[], classroom: string): Lesson[] => {
    return dayLessons.filter(lesson => {
      // Gestisce le varianti (Magna 1, Magna 2 -> Aula Magna, etc.)
      if (classroom === 'Aula Magna') {
        return lesson.classroom === 'Aula Magna' || lesson.classroom === 'Magna 1' || lesson.classroom === 'Magna 2'
      }
      if (classroom === 'Conference') {
        return lesson.classroom === 'Conference' || lesson.classroom === 'Conference 1' || lesson.classroom === 'Conference 2'
      }
      return lesson.classroom === classroom
    })
  }

  const getCurrentTimePosition = (dayDate: Date): number | null => {
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    
    // Mostra il pin solo se siamo nel giorno corrente e l'orario è nel range 9-21
    if (isSameDay(dayDate, now) && currentMinutes >= 9 * 60 && currentMinutes < 21 * 60) {
      return getTimePosition(currentTime)
    }
    return null
  }

  const renderTimeGrid = (dayLessons: Lesson[], dayDate: Date) => {
    const currentTimePos = getCurrentTimePosition(dayDate)
    const firstExternalIndex = getFirstExternalIndex()

    return (
      <div className="relative flex-1 overflow-x-auto">
        {/* Header aule */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex" style={{ minWidth: `${classrooms.length * minClassroomWidth}px` }}>
            <div className="w-16 flex-shrink-0 border-r border-gray-200"></div>
            {classrooms.map((classroom, index) => {
              const classroomLessons = getLessonsForClassroom(dayLessons, classroom)
              const isFirstExternal = index === firstExternalIndex
              
              return (
                <div
                  key={classroom}
                  className={`flex-shrink-0 border-r border-gray-200 last:border-r-0 p-2 text-center font-semibold text-xs bg-gray-50 whitespace-nowrap ${
                    isFirstExternal ? 'border-l-4 border-l-gray-400' : ''
                  }`}
                  style={{ width: `${minClassroomWidth}px`, minWidth: `${minClassroomWidth}px` }}
                >
                  {classroom}
                  {classroomLessons.length > 0 && (
                    <span className="ml-1 text-xs text-gray-500">({classroomLessons.length})</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Griglia orari */}
        <div className="relative" style={{ minWidth: `${classrooms.length * minClassroomWidth}px` }}>
          {/* Pin orario corrente */}
          {currentTimePos !== null && (
            <div
              className="absolute left-0 right-0 z-20 pointer-events-none"
              style={{ top: `${currentTimePos * 60}px` }}
            >
              <div className="flex">
                <div className="w-16 flex-shrink-0 flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                  <span className="text-xs font-semibold text-red-600">{currentTime}</span>
                </div>
                <div className="flex-1 border-t-2 border-red-500"></div>
              </div>
            </div>
          )}

          {/* Righe orari */}
          {timeSlots.map((time, timeIndex) => {
            const isHour = time.endsWith(':00')

            return (
              <div key={time} className="flex border-b border-gray-100" style={{ height: '60px' }}>
                {/* Colonna orari */}
                <div className="w-16 flex-shrink-0 border-r border-gray-200 p-1 text-xs text-gray-600 flex items-center">
                  {isHour && <span className="font-semibold">{time}</span>}
                </div>

                {/* Colonne aule */}
                {classrooms.map((classroom, index) => {
                  const classroomLessons = getLessonsForClassroom(dayLessons, classroom)
                  const isFirstExternal = index === firstExternalIndex
                  
                  // Trova la lezione che inizia in questo slot
                  const lessonStarting = classroomLessons.find(lesson => {
                    const lessonStart = getTimePosition(lesson.startTime)
                    return timeIndex === lessonStart
                  })

                  return (
                    <div
                      key={classroom}
                      className={`flex-shrink-0 border-r border-gray-100 last:border-r-0 relative ${
                        isFirstExternal ? 'border-l-4 border-l-gray-400' : ''
                      }`}
                      style={{ width: `${minClassroomWidth}px`, minWidth: `${minClassroomWidth}px` }}
                    >
                      {lessonStarting && (
                        <LessonEventCard
                          lesson={lessonStarting}
                          startSlot={getTimePosition(lessonStarting.startTime)}
                          endSlot={getTimePosition(lessonStarting.endTime)}
                          onEdit={isAuthenticated ? handleEditLesson : undefined}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderDayView = () => {
    const dayLessons = getLessonsForDay(currentDate)
    const dayOfWeek = currentDate.getDay()
    const headerColor = dayHeaderColors[dayOfWeek] || 'bg-laba-primary'
    const isToday = isSameDay(currentDate, new Date())

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className={`${headerColor} text-white p-3 flex items-center justify-between rounded-t-lg`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDate('prev')}
                className="px-2 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                title="Giorno precedente"
              >
                ←
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Oggi
              </button>
              <button
                onClick={() => navigateDate('next')}
                className="px-2 py-1 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95"
                title="Giorno successivo"
              >
                →
              </button>
            </div>
            <div>
              <div className="font-bold text-lg uppercase">
                {format(currentDate, 'EEEE', { locale: it })}
              </div>
              <div className="text-sm opacity-90">
                {format(currentDate, 'd MMMM yyyy', { locale: it })}
              </div>
            </div>
          </div>
        </div>
        {renderTimeGrid(dayLessons, currentDate)}
      </div>
    )
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate = new Date(currentDate)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    setCurrentDate(newDate)
  }

  const handleResetFilters = () => {
    setFilterCourse('')
    setFilterYear(null)
  }

  return (
    <div>
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <LessonFilters
            course={filterCourse}
            year={filterYear}
            onCourseChange={setFilterCourse}
            onYearChange={setFilterYear}
            onReset={handleResetFilters}
          />
          
          {isAuthenticated && (
            <button
              onClick={handleAddLesson}
              className="px-4 py-2 rounded-full bg-green-500 text-white text-sm font-medium transition-all duration-200 hover:bg-green-600 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md whitespace-nowrap"
            >
              + Aggiungi Lezione
            </button>
          )}
        </div>
      </div>

      {renderDayView()}

      {showForm && (
        <LessonForm
          lesson={editingLesson}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}

// Componente per la card della lezione stile iOS/macOS
interface LessonEventCardProps {
  lesson: Lesson
  startSlot: number
  endSlot: number
  onEdit?: (lesson: Lesson) => void
}

function LessonEventCard({ lesson, startSlot, endSlot, onEdit }: LessonEventCardProps) {
  const height = (endSlot - startSlot) * 60 // Ogni slot è 60px (30 minuti)

  return (
    <div
      className="absolute left-1 right-1 rounded-lg shadow-md border-l-4 border-laba-primary bg-gradient-to-r from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 transition-all cursor-pointer overflow-hidden z-10"
      style={{
        top: `${startSlot * 60}px`,
        height: `${Math.max(height, 60)}px`,
      }}
      onClick={() => onEdit && onEdit(lesson)}
      title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime} - ${lesson.classroom}`}
    >
      <div className="p-2 h-full flex flex-col justify-between">
        <div>
          <div className="text-xs font-semibold text-laba-primary mb-1">
            {lesson.startTime} - {lesson.endTime}
          </div>
          <div className="text-sm font-bold text-gray-800 line-clamp-2">
            {lesson.title}
          </div>
        </div>
        <div className="mt-auto">
          <div className="text-xs text-gray-600 truncate">
            {lesson.professor}
          </div>
          {lesson.group && (
            <div className="text-xs text-purple-600 mt-1">
              {lesson.group}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
