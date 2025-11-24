'use client'

import { useState, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import LessonForm from './LessonForm'
import LessonFilters from './LessonFilters'
import SearchOverlay from './SearchOverlay'
import { CLASSROOMS, getBaseClassrooms, getFirstExternalIndex } from '@/lib/classrooms'
import { generateTimeLines, getTimePosition, getCurrentTime, getTotalCalendarHeight } from '@/lib/timeSlots'

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
  
  // Ricerca
  const [showSearch, setShowSearch] = useState(false)

  const classrooms = getBaseClassrooms()
  
  // Calcola la larghezza minima basata sul nome più lungo
  const getMinClassroomWidth = () => {
    const maxLength = Math.max(...classrooms.map(c => c.length))
    // Approssimativamente 6px per carattere + padding ridotto
    return Math.max(110, maxLength * 6 + 24)
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
    const timeLines = generateTimeLines()
    const totalHeight = getTotalCalendarHeight()

    return (
      <div className="relative flex-1 overflow-x-auto overflow-y-auto bg-white">
        {/* Header aule */}
        <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
          <div className="flex" style={{ minWidth: `${classrooms.length * minClassroomWidth + 64}px` }}>
            {/* Colonna vuota per gli orari */}
            <div className="w-16 flex-shrink-0 border-r border-gray-200 bg-gray-50"></div>
            
            {/* Header aule */}
            {classrooms.map((classroom, index) => {
              const classroomLessons = getLessonsForClassroom(dayLessons, classroom)
              const isFirstExternal = index === firstExternalIndex
              
              return (
                <div
                  key={classroom}
                  className={`flex-shrink-0 border-r border-gray-200 last:border-r-0 px-2 py-2 text-center text-xs font-medium text-gray-700 bg-gray-50 whitespace-nowrap ${
                    isFirstExternal ? 'border-l-2 border-l-gray-400' : ''
                  }`}
                  style={{ width: `${minClassroomWidth}px`, minWidth: `${minClassroomWidth}px` }}
                >
                  {classroom}
                </div>
              )
            })}
          </div>
        </div>

        {/* Griglia calendario */}
        <div 
          className="relative bg-white" 
          style={{ 
            minWidth: `${classrooms.length * minClassroomWidth + 64}px`,
            height: `${totalHeight}px`
          }}
        >
          {/* Colonna orari fissa sulla sinistra */}
          <div className="absolute left-0 top-0 bottom-0 w-16 border-r border-gray-200 bg-white z-10">
            {timeLines.map((line) => (
              <div
                key={line.time}
                className="absolute left-0 right-0 flex items-start pr-2"
                style={{ 
                  top: `${line.position - (line.isHour ? 0 : 6)}px`,
                }}
              >
                {line.isHour ? (
                  <span className="text-xs font-medium text-gray-600 ml-auto">{line.time}</span>
                ) : (
                  <span className="text-[10px] text-gray-400 ml-auto">{line.time}</span>
                )}
              </div>
            ))}
          </div>

          {/* Linee orizzontali sottili che attraversano tutto il calendario */}
          {timeLines.map((line) => (
            <div
              key={`line-${line.time}`}
              className="absolute left-16 right-0 pointer-events-none z-0"
              style={{ 
                top: `${line.position}px`,
                borderTop: line.isHour ? '1px solid #e5e7eb' : '1px solid #f3f4f6'
              }}
            />
          ))}

          {/* Pin orario corrente */}
          {currentTimePos !== null && (
            <div
              className="absolute left-16 right-0 z-30 pointer-events-none"
              style={{ top: `${currentTimePos}px` }}
            >
              <div className="flex">
                <div className="w-16 flex-shrink-0 flex items-center bg-white pr-2">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full ml-auto"></div>
                </div>
                <div className="flex-1 border-t border-red-500"></div>
              </div>
            </div>
          )}

          {/* Colonne aule con eventi */}
          {classrooms.map((classroom, classroomIndex) => {
            const classroomLessons = getLessonsForClassroom(dayLessons, classroom)
            const isFirstExternal = classroomIndex === firstExternalIndex

            return (
              <div
                key={classroom}
                className={`absolute top-0 bottom-0 flex-shrink-0 ${
                  isFirstExternal ? 'border-l-2 border-l-gray-400' : ''
                }`}
                style={{ 
                  left: `${64 + classroomIndex * minClassroomWidth}px`,
                  width: `${minClassroomWidth}px`,
                  minWidth: `${minClassroomWidth}px`
                }}
              >
                {classroomLessons.map((lesson) => {
                  const startPos = getTimePosition(lesson.startTime)
                  const endPos = getTimePosition(lesson.endTime)
                  const height = endPos - startPos

                  return (
                    <div
                      key={lesson.id}
                      className="absolute left-0.5 right-0.5 z-20"
                      style={{
                        top: `${startPos}px`,
                        height: `${Math.max(height, 20)}px`,
                      }}
                    >
                      <LessonEventCard
                        lesson={lesson}
                        startSlot={startPos}
                        endSlot={endPos}
                        onEdit={isAuthenticated ? handleEditLesson : undefined}
                      />
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
      <div className="card-modern overflow-hidden animate-fade-in">
        <div className={`${headerColor} text-white p-3 flex items-center justify-between rounded-t-lg shadow-md`}>
          <div>
            <div className="font-bold text-xl uppercase tracking-wide">
              {format(currentDate, 'EEEE', { locale: it })}
            </div>
            <div className="text-sm opacity-90 mt-0.5">
              {format(currentDate, 'd MMMM yyyy', { locale: it })}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="btn-modern px-3 py-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium backdrop-blur-sm"
              title="Giorno precedente"
            >
              <span className="relative z-10">←</span>
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="btn-modern px-4 py-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium backdrop-blur-sm"
            >
              <span className="relative z-10">Oggi</span>
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="btn-modern px-3 py-1.5 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white text-sm font-medium backdrop-blur-sm"
              title="Giorno successivo"
            >
              <span className="relative z-10">→</span>
            </button>
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

  const handleSearchSelect = (lesson: Lesson, dayOfWeek: number) => {
    // Calcola la data del giorno della settimana
    const today = new Date()
    const currentDay = today.getDay()
    const diff = dayOfWeek - currentDay
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + diff)
    
    setCurrentDate(targetDate)
    setEditingLesson(lesson)
    setShowForm(true)
  }

  return (
    <div>
      <div className="mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Ricerca a sinistra */}
        <div className="w-full sm:w-auto">
          <button
            onClick={() => setShowSearch(true)}
            className="btn-modern flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-laba-primary text-sm font-medium shadow-md border border-gray-200 relative overflow-hidden"
          >
            <svg className="w-4 h-4 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="relative z-10">Cerca Lezione</span>
          </button>
        </div>

        {/* Filtri a destra */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
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
              className="btn-modern px-6 py-2.5 rounded-full bg-green-500 text-white text-sm font-medium shadow-md whitespace-nowrap relative overflow-hidden"
            >
              <span className="relative z-10">+ Aggiungi Lezione</span>
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

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectLesson={handleSearchSelect}
        lessons={lessons}
      />
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
  // startSlot e endSlot sono già in pixel (2px per minuto)
  const height = endSlot - startSlot

  return (
    <div
      className="absolute left-0 right-0 rounded cursor-pointer overflow-hidden group border-l-2 border-laba-primary bg-blue-50 hover:bg-blue-100 smooth-transition"
      style={{
        top: '0px',
        height: `${Math.max(height, 20)}px`,
      }}
      onClick={() => onEdit && onEdit(lesson)}
      title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime} - ${lesson.classroom}`}
    >
      <div className="px-1.5 py-0.5 h-full flex flex-col">
        <div className="text-[10px] font-medium text-laba-primary leading-tight">
          {lesson.startTime}
        </div>
        <div className="text-xs font-semibold text-gray-900 leading-tight truncate">
          {lesson.title}
        </div>
        {height > 40 && (
          <div className="text-[10px] text-gray-600 truncate mt-0.5">
            {lesson.professor}
          </div>
        )}
      </div>
    </div>
  )
}
