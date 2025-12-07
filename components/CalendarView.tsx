'use client'

import { useState, useEffect } from 'react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import LessonForm from './LessonForm'
import LessonFilters from './LessonFilters'
import SearchOverlay from './SearchOverlay'
import LessonDetailsModal from './LessonDetailsModal'
import { getBaseClassrooms, getFirstExternalIndex } from '@/lib/classrooms'
import { generateTimeSlots, getTimePosition, getCurrentTime } from '@/lib/timeSlots'
import { Location } from '@/lib/locations'
import { useRouter, usePathname } from 'next/navigation'
import { generateICS } from '@/lib/ics'
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

// Colore header calendario sempre #033157

interface CalendarViewProps {
  initialLocation?: Location
}

export default function CalendarView({ initialLocation }: CalendarViewProps = {}) {
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
  
  // Altezza righe calendario (fissa a 45px)
  const rowHeight = 45
  
  // Modale dettaglio lezione
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showLessonDetails, setShowLessonDetails] = useState(false)

  const router = useRouter()
  const pathname = usePathname()
  
  // Estrai la sede dall'URL se disponibile
  const getLocationFromPath = (): Location => {
    if (pathname?.includes('/via-vecchietti')) return 'via-vecchietti'
    if (pathname?.includes('/badia-ripoli')) return 'badia-ripoli'
    return initialLocation || 'badia-ripoli'
  }
  
  // Sede selezionata - usa quella dall'URL se disponibile
  const [selectedLocation, setSelectedLocation] = useState<Location>(initialLocation || 'badia-ripoli')
  
  // Sincronizza con l'URL quando cambia
  useEffect(() => {
    if (pathname) {
      const locationFromPath = getLocationFromPath()
      if (locationFromPath !== selectedLocation) {
        setSelectedLocation(locationFromPath)
        // Reset filtri quando cambia sede
        setFilterCourse('')
        setFilterYear(null)
      }
    }
  }, [pathname, selectedLocation])

  const timeSlots = generateTimeSlots()
  const classrooms = getBaseClassrooms(selectedLocation)
  
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
  }, [filterCourse, filterYear, selectedLocation])

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
    
    // Filtra le lezioni per sede basandosi sulle aule
    const locationClassrooms = getBaseClassrooms(selectedLocation)
    const filteredLessons = data.filter((lesson: Lesson) => {
      // Controlla se l'aula della lezione appartiene alla sede selezionata
      // Gestisce anche le varianti (Magna 1/2 -> Aula Magna, Conference 1/2 -> Conference)
      const lessonClassroom = lesson.classroom
      if (selectedLocation === 'badia-ripoli') {
        // Per Badia a Ripoli, controlla se l'aula è nelle aule di Badia
        if (lessonClassroom === 'Magna 1' || lessonClassroom === 'Magna 2') {
          return locationClassrooms.includes('Aula Magna')
        }
        if (lessonClassroom === 'Conference 1' || lessonClassroom === 'Conference 2') {
          return locationClassrooms.includes('Conference')
        }
        return locationClassrooms.includes(lessonClassroom)
      } else {
        // Per Via de Vecchietti, solo le aule specifiche
        return locationClassrooms.includes(lessonClassroom)
      }
    })
    
    setLessons(filteredLessons)
  }

  const handleAddLesson = () => {
    setEditingLesson(null)
    setShowForm(true)
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setShowForm(true)
  }

  const handleViewLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setShowLessonDetails(true)
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
    const firstExternalIndex = getFirstExternalIndex(selectedLocation)

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
                  className={`flex-shrink-0 border-r border-gray-200 last:border-r-0 p-1.5 text-center font-semibold text-xs bg-gray-50 whitespace-nowrap ${
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
              style={{ top: `${currentTimePos * rowHeight}px` }}
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
            const isHalfHour = time.endsWith(':30')

            return (
              <div key={time} className="flex border-b border-gray-100" style={{ height: `${rowHeight}px` }}>
                {/* Colonna orari */}
                <div className="w-16 flex-shrink-0 border-r border-gray-200 p-1 text-xs text-gray-600 flex items-center">
                  {isHour && <span className="font-semibold">{time}</span>}
                  {isHalfHour && <span className="text-gray-400 text-[10px]">{time}</span>}
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
                          rowHeight={rowHeight}
                          onEdit={isAuthenticated ? handleEditLesson : undefined}
                          onView={!isAuthenticated ? handleViewLesson : undefined}
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
    const isToday = isSameDay(currentDate, new Date())

    return (
      <div className="card-modern overflow-hidden animate-fade-in">
        <div className="text-white p-3 flex items-center justify-between rounded-t-lg shadow-md" style={{ backgroundColor: '#033157' }}>
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

  const handleExportToCalendar = () => {
    const icsContent = generateICS(lessons)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'orario_laba.ics')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
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

        {/* Filtri e Export a destra */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <LessonFilters
            course={filterCourse}
            year={filterYear}
            location={selectedLocation}
            onCourseChange={setFilterCourse}
            onYearChange={setFilterYear}
            onReset={handleResetFilters}
          />
          
          <button
            onClick={handleExportToCalendar}
            className="btn-modern px-5 py-2.5 rounded-full bg-white text-laba-primary text-sm font-medium shadow-md border border-gray-200 relative overflow-hidden hover:bg-laba-primary hover:text-white transition-colors"
            title="Esporta calendario"
          >
            <span className="relative z-10">Esporta</span>
          </button>
          
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
          location={selectedLocation}
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
        lesson={selectedLesson}
        currentDate={currentDate}
        isOpen={showLessonDetails}
        onClose={() => {
          setShowLessonDetails(false)
          setSelectedLesson(null)
        }}
        onEdit={isAuthenticated ? handleEditLesson : undefined}
      />
    </div>
  )
}

// Componente per la card della lezione stile iOS/macOS
interface LessonEventCardProps {
  lesson: Lesson
  startSlot: number
  endSlot: number
  rowHeight: number
  onEdit?: (lesson: Lesson) => void
  onView?: (lesson: Lesson) => void
}

function LessonEventCard({ lesson, startSlot, endSlot, rowHeight, onEdit, onView }: LessonEventCardProps) {
  const height = (endSlot - startSlot) * rowHeight // Altezza dinamica basata su rowHeight
  const courseColor = getCourseColor(lesson.course)

  return (
    <div
      className="absolute left-1 right-1 rounded-lg shadow-md border-l-4 smooth-transition cursor-pointer overflow-hidden z-10 hover-lift group"
      style={{
        top: `${startSlot * rowHeight}px`,
        height: `${Math.max(height, rowHeight)}px`,
        borderLeftColor: courseColor.borderColor,
        backgroundColor: courseColor.bgHex,
      }}
      onClick={() => {
        if (onEdit) onEdit(lesson)
        else if (onView) onView(lesson)
      }}
      title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime} - ${lesson.classroom}`}
    >
      <div className="p-2.5 h-full flex flex-col justify-between">
        <div>
          <div className={`text-xs font-semibold mb-1.5 opacity-80 group-hover:opacity-100 transition-opacity`} style={{ color: courseColor.textHex }}>
            {lesson.startTime} - {lesson.endTime}
          </div>
          <div className={`text-sm font-bold line-clamp-2 transition-colors`} style={{ color: courseColor.textHex }}>
            {lesson.title}
          </div>
        </div>
        <div className="mt-auto">
          <div className={`text-xs truncate group-hover:opacity-100 transition-colors`} style={{ color: courseColor.textHex, opacity: 0.8 }}>
            {lesson.professor}
          </div>
          {lesson.group && (
            <div className={`text-xs mt-1 font-semibold transition-colors`} style={{ color: courseColor.textHex, opacity: 0.8 }}>
              {lesson.group}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
