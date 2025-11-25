'use client'

import { useState, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import LessonForm from './LessonForm'
import LessonFilters from './LessonFilters'
import SearchOverlay from './SearchOverlay'
import LessonDetailsModal from './LessonDetailsModal'
import { CLASSROOMS, getBaseClassrooms, getFirstExternalIndex } from '@/lib/classrooms'
import { generateTimeLines, getTimePosition, getCurrentTime, getTotalCalendarHeight } from '@/lib/timeSlots'
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

// Tutti i giorni hanno lo stesso colore
const dayHeaderColor = 'bg-laba-primary'

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
  
  // Dettagli lezione (per utenti non loggati)
  const [showLessonDetails, setShowLessonDetails] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

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
    
    // Mostra il pin solo se siamo nel giorno corrente e l'orario è nel range 8-21
    if (isSameDay(dayDate, now) && currentMinutes >= 8 * 60 && currentMinutes < 21 * 60) {
      return getTimePosition(currentTime)
    }
    return null
  }

  const renderTimeGrid = (dayLessons: Lesson[], dayDate: Date) => {
    const currentTimePos = getCurrentTimePosition(dayDate)
    const timeLines = generateTimeLines()
    const totalHeight = getTotalCalendarHeight()

    return (
      <div className="relative" style={{ minWidth: `${classrooms.length * minClassroomWidth + 64}px`, height: `${totalHeight}px` }}>
        {/* Colonna orari sticky con sfondo completo */}
        <div className="sticky left-0 z-30 w-16 border-r border-gray-300 bg-white shadow-sm" style={{ height: `${totalHeight}px` }}>
          {timeLines.map((line) => (
            <div
              key={line.time}
              className="absolute left-0 right-0 flex items-start pr-2 bg-white"
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

        {/* Linee orizzontali */}
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
            className="absolute left-16 right-0 z-20 pointer-events-none"
            style={{ top: `${currentTimePos}px` }}
          >
            <div className="flex">
              <div className="w-16 flex-shrink-0"></div>
              <div className="flex-1 border-t-2 border-red-500"></div>
            </div>
          </div>
        )}

        {/* Colonne aule con eventi */}
        {classrooms.map((classroom, classroomIndex) => {
          const classroomLessons = getLessonsForClassroom(dayLessons, classroom)

          return (
            <div
              key={classroom}
              className="absolute top-0 bottom-0 flex-shrink-0 border-r border-gray-200 last:border-r-0"
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
                    className="absolute left-1 right-1 z-10"
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
                      onView={!isAuthenticated ? () => {
                        setSelectedLesson(lesson)
                        setShowLessonDetails(true)
                      } : undefined}
                    />
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    )
  }

  const renderDayView = () => {
    const dayLessons = getLessonsForDay(currentDate)
    const dayOfWeek = currentDate.getDay()
    const headerColor = dayHeaderColor
    const isToday = isSameDay(currentDate, new Date())

    return (
      <div className="flex flex-col h-full card-modern overflow-hidden animate-fade-in">
        {/* Header giorno sticky */}
        <div className={`sticky top-0 z-20 ${headerColor} text-white p-3 flex items-center justify-between rounded-t-lg shadow-md`}>
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
        {/* Container calendario con header sticky */}
        <div className="flex-1 flex flex-col bg-white border border-gray-200 rounded-b-lg overflow-hidden">
          {/* Container scrollabile unico per header e contenuto */}
          <div className="flex-1 overflow-auto relative hide-scrollbar">
            {/* Header aule sticky - dentro il container scrollabile */}
            <div className="sticky top-0 z-40 bg-white border-b border-gray-300 shadow-sm">
              <div className="flex" style={{ minWidth: `${classrooms.length * minClassroomWidth + 64}px` }}>
                {/* Colonna orari nell'header */}
                <div className="sticky left-0 z-50 w-16 flex-shrink-0 border-r border-gray-300 bg-gray-50"></div>
                
                {/* Header aule */}
                {classrooms.map((classroom) => (
                  <div
                    key={classroom}
                    className="flex-shrink-0 border-r border-gray-200 last:border-r-0 px-2 py-2 text-center text-xs font-medium text-gray-700 bg-gray-50 whitespace-nowrap"
                    style={{ width: `${minClassroomWidth}px`, minWidth: `${minClassroomWidth}px` }}
                  >
                    {classroom}
                  </div>
                ))}
              </div>
            </div>

            {/* Contenuto griglia */}
            {renderTimeGrid(dayLessons, currentDate)}
          </div>
        </div>
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
    
    // Se l'utente è loggato, apri modale modifica, altrimenti apri modale dettagli
    if (isAuthenticated) {
      setEditingLesson(lesson)
      setShowForm(true)
    } else {
      setSelectedLesson(lesson)
      setShowLessonDetails(true)
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Controlli sticky (ricerca, filtri) */}
      <div className="sticky top-0 z-30 bg-gray-50 pb-2 mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
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

      {/* Container scrollabile con header sticky */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {renderDayView()}
      </div>

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

      <LessonDetailsModal
        isOpen={showLessonDetails}
        onClose={() => {
          setShowLessonDetails(false)
          setSelectedLesson(null)
        }}
        lesson={selectedLesson}
        dayDate={currentDate}
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
  onView?: () => void
}

function LessonEventCard({ lesson, startSlot, endSlot, onEdit, onView }: LessonEventCardProps) {
  // startSlot e endSlot sono già in pixel (2px per minuto)
  const height = endSlot - startSlot

  // Formatta orario senza secondi (solo HH:mm)
  const formatTime = (time: string) => {
    return time.substring(0, 5) // Prende solo HH:mm
  }

  // Ottieni il colore del corso
  const courseColor = getCourseColor(lesson.course)

  const handleClick = () => {
    if (onEdit) {
      onEdit(lesson)
    } else if (onView) {
      onView()
    }
  }

  return (
    <div
      className={`absolute left-0 right-0 rounded cursor-pointer overflow-hidden group border-l-2 ${courseColor.border} ${courseColor.bg} hover:opacity-90 smooth-transition`}
      style={{
        top: '0px',
        height: `${Math.max(height, 20)}px`,
      }}
      onClick={handleClick}
      title={`${lesson.title} - ${formatTime(lesson.startTime)}-${formatTime(lesson.endTime)} - ${lesson.classroom}`}
    >
      <div className="px-1.5 py-0.5 h-full flex flex-col">
        <div className={`text-[10px] font-medium ${courseColor.text} leading-tight`}>
          {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
        </div>
        <div className={`text-xs font-semibold ${courseColor.text} leading-tight truncate`}>
          {lesson.title}
        </div>
        {height > 40 && (
          <>
            <div className={`text-[10px] ${courseColor.text} opacity-80 truncate mt-0.5`}>
              {lesson.professor}
            </div>
            {lesson.group && (
              <div className={`text-[10px] ${courseColor.text} opacity-70 truncate mt-0.5`}>
                {lesson.group}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
