'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import LessonForm from './LessonForm'
import LessonFilters from './LessonFilters'
import SearchOverlay from './SearchOverlay'
import LessonDetailsModal from './LessonDetailsModal'
import { getBaseClassrooms } from '@/lib/classrooms'
import { generateTimeSlots, timeToMinutes } from '@/lib/timeSlots'
import { Location } from '@/lib/locations'
import { usePathname } from 'next/navigation'
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

interface CalendarViewProps {
  initialLocation?: Location
}

// Struttura della cella della griglia
type GridCell = 
  | { type: 'empty' }
  | { type: 'event', lesson: Lesson, span: number }
  | { type: 'occupied' }

export default function CalendarView({ initialLocation }: CalendarViewProps = {}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
  const [filterCourse, setFilterCourse] = useState('')
  const [filterYear, setFilterYear] = useState<number | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [showLessonDetails, setShowLessonDetails] = useState(false)
  const [currentTime, setCurrentTime] = useState('')

  const pathname = usePathname()
  
  const getLocationFromPath = (): Location => {
    if (pathname?.includes('/via-vecchietti')) return 'via-vecchietti'
    if (pathname?.includes('/badia-ripoli')) return 'badia-ripoli'
    return initialLocation || 'badia-ripoli'
  }
  
  const [selectedLocation, setSelectedLocation] = useState<Location>(initialLocation || 'badia-ripoli')
  
  // Gestione URL e Location
  useEffect(() => {
    if (pathname) {
      const locationFromPath = getLocationFromPath()
      if (locationFromPath !== selectedLocation) {
        setSelectedLocation(locationFromPath)
        setFilterCourse('')
        setFilterYear(null)
      }
    }
  }, [pathname, selectedLocation])

  // Caricamento dati e Auth
  useEffect(() => {
    checkAuth()
    loadLessons()
    
    // Aggiorna orario
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(`${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`)
    }
    updateTime()
    const interval = setInterval(updateTime, 60000)
    
    const handleExportEvent = () => handleExportToCalendar()
    window.addEventListener('export-calendar', handleExportEvent)
    
    return () => {
      clearInterval(interval)
      window.removeEventListener('export-calendar', handleExportEvent)
    }
  }, [])

  useEffect(() => {
    loadLessons()
  }, [filterCourse, filterYear, selectedLocation])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check')
      if (!res.ok) {
        setIsAuthenticated(false)
        return
      }
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setIsAuthenticated(false)
        return
      }
      const data = await res.json()
      setIsAuthenticated(data.authenticated || false)
    } catch (e) {
      console.error("Auth check failed", e)
      setIsAuthenticated(false)
    }
  }

  const loadLessons = async () => {
    const params = new URLSearchParams()
    if (filterCourse) params.append('course', filterCourse)
    if (filterYear !== null) params.append('year', filterYear.toString())
    
    try {
      const res = await fetch(`/api/lessons?${params.toString()}`)
      if (!res.ok) {
        console.error("Failed to load lessons: HTTP", res.status)
        setLessons([])
        return
      }
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        console.error("Failed to load lessons: Invalid content type", contentType)
        setLessons([])
        return
      }
      const data = await res.json()
      
      if (!Array.isArray(data)) {
        console.error("Failed to load lessons: Invalid response format", data)
        setLessons([])
        return
      }
      
      const locationClassrooms = getBaseClassrooms(selectedLocation)
      const filteredLessons = data.filter((lesson: Lesson) => {
        // Normalizza il nome dell'aula per il confronto
        const c = lesson.classroom
        if (selectedLocation === 'badia-ripoli') {
          if (c === 'Magna 1' || c === 'Magna 2') return locationClassrooms.includes('Aula Magna')
          if (c === 'Conference 1' || c === 'Conference 2') return locationClassrooms.includes('Conference')
        }
        return locationClassrooms.includes(c)
      })
      
      setLessons(filteredLessons)
    } catch (e) {
      console.error("Failed to load lessons", e)
      setLessons([])
    }
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

  // --- LOGICA DI CALCOLO DELLA GRIGLIA ---
  
  const timeSlots = generateTimeSlots() // ["09:00", "09:30", ...]
  const classrooms = getBaseClassrooms(selectedLocation)
  
  // Matrice della griglia: [TimeIndex][ClassroomIndex] -> GridCell
  const gridMatrix = useMemo(() => {
    // Inizializza la matrice vuota
    const matrix: GridCell[][] = Array(timeSlots.length).fill(null).map(() => 
      Array(classrooms.length).fill({ type: 'empty' })
    )

    // Filtra lezioni del giorno corrente
    const dayLessons = lessons.filter(l => l.dayOfWeek === currentDate.getDay())
    
    // Debug: verifica se ci sono lezioni
    if (dayLessons.length > 0) {
      console.log('Lezioni trovate per il giorno:', dayLessons.length, dayLessons)
    }

    // Popola la matrice
    dayLessons.forEach(lesson => {
      // Trova indice aula
      let classroomIndex = classrooms.indexOf(lesson.classroom)
      if (classroomIndex === -1) {
        // Gestione varianti aule
        if (lesson.classroom === 'Magna 1' || lesson.classroom === 'Magna 2') classroomIndex = classrooms.indexOf('Aula Magna')
        if (lesson.classroom === 'Conference 1' || lesson.classroom === 'Conference 2') classroomIndex = classrooms.indexOf('Conference')
      }
      
      if (classroomIndex === -1) return // Aula non trovata in questa sede

      // Trova indice orario inizio
      // Usa timeToMinutes per trovare lo slot corretto
      const startMinutes = timeToMinutes(lesson.startTime)
      const gridStartMinutes = 9 * 60 // 09:00
      const startIndex = Math.floor((startMinutes - gridStartMinutes) / 30)

      // Calcola durata in slot (arrotondata per eccesso)
      const endMinutes = timeToMinutes(lesson.endTime)
      const durationMinutes = endMinutes - startMinutes
      const span = Math.ceil(durationMinutes / 30)

      if (startIndex >= 0 && startIndex < timeSlots.length) {
        // Inserisci evento nella cella di partenza
        matrix[startIndex][classroomIndex] = { 
          type: 'event', 
          lesson, 
          span: Math.min(span, timeSlots.length - startIndex) // Non uscire dalla griglia
        }

        // Marca le celle successive come occupate
        for (let i = 1; i < span; i++) {
          if (startIndex + i < timeSlots.length) {
            matrix[startIndex + i][classroomIndex] = { type: 'occupied' }
          }
        }
      }
    })

    return matrix
  }, [lessons, currentDate, classrooms, timeSlots, selectedLocation])

  // Formattazione data
  const dayName = format(currentDate, 'EEEE', { locale: it })
  const dayNumber = format(currentDate, 'd', { locale: it })
  const monthName = format(currentDate, 'MMMM yyyy', { locale: it })

  return (
    <div className="h-full flex flex-col">
      {/* Barra superiore strumenti */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-2 md:p-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row gap-2 md:gap-3 items-stretch md:items-center justify-between">
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center justify-center gap-2 px-4 md:px-5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors border border-gray-200 whitespace-nowrap w-full md:w-auto md:min-w-[140px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Cerca</span>
          </button>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 md:gap-3">
            <LessonFilters
              course={filterCourse}
              year={filterYear}
              location={selectedLocation}
              onCourseChange={setFilterCourse}
              onYearChange={setFilterYear}
              onReset={() => { setFilterCourse(''); setFilterYear(null) }}
            />
            {isAuthenticated && (
              <button
                onClick={() => { setEditingLesson(null); setShowForm(true) }}
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-sm hover:bg-green-600 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Aggiungi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenitore Calendario */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden animate-fade-in flex-1 flex flex-col min-h-0">
        {/* Header Giorno */}
        <div className="px-3 md:px-4 py-2 md:py-2.5 text-white flex items-center justify-between" style={{ backgroundColor: '#033157' }}>
          <div className="flex flex-col animate-slide-in">
            <span className="text-base md:text-lg font-bold uppercase tracking-wide">{dayName}</span>
            <span className="text-sm md:text-base font-normal mt-0.5">{dayNumber} {monthName}</span>
          </div>
          <div className="flex items-center gap-1.5 md:gap-2">
            <button 
              onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d) }} 
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-sm"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button 
              onClick={() => setCurrentDate(new Date())} 
              className="px-4 md:px-5 py-1.5 md:py-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-200 hover:scale-105 active:scale-95 text-xs md:text-sm font-medium backdrop-blur-sm"
            >
              Oggi
            </button>
            <button 
              onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d) }} 
              className="px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-white bg-opacity-10 hover:bg-opacity-20 transition-all duration-200 hover:scale-105 active:scale-95 flex items-center justify-center backdrop-blur-sm"
            >
              <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Calendario Grid Moderno - Scrollabile */}
        <div 
          className="overflow-auto hide-scrollbar relative bg-gradient-to-br from-gray-50 to-white flex-1 min-h-0"
          style={{ 
            overflowY: 'auto', 
            overflowX: 'auto',
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
          }}
        >
          <div 
            className="relative"
            style={{
              display: 'grid',
              gridTemplateColumns: `70px repeat(${classrooms.length}, minmax(120px, 140px))`,
              gridTemplateRows: `40px repeat(${timeSlots.length}, 40px)`,
              minWidth: `${70 + classrooms.length * 120}px`,
              backgroundColor: 'white'
            }}
          >
            {/* Header vuoto (angolo in alto a sinistra) - Moderno */}
            <div 
              className="sticky top-0 left-0 z-30 bg-gradient-to-br from-gray-50 to-white border-b-2 border-r-2 border-gray-200 shadow-sm transition-all duration-200"
              style={{ 
                height: '40px',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)'
              }}
            />
            
            {/* Header Aule - Sticky Top - Moderno */}
            {classrooms.map((classroom, idx) => (
              <div
                key={classroom}
                className="sticky top-0 z-20 bg-gradient-to-br from-gray-50 to-white border-b-2 border-r border-gray-200 px-2 md:px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold text-gray-800 flex items-center justify-center shadow-sm hover:bg-gray-100 transition-colors duration-200"
                style={{ 
                  height: '40px',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  letterSpacing: '0.025em',
                  animationDelay: `${idx * 20}ms`
                }}
              >
                <span className="truncate animate-fade-in text-center leading-tight">{classroom}</span>
              </div>
            ))}

            {/* Corpo Calendario - Orari e Celle - Moderno */}
            {timeSlots.map((time, timeIndex) => {
              const isHour = time.endsWith(':00')
              const rowIndex = timeIndex + 2 // +2 perché riga 1 è header
              
              return (
                <React.Fragment key={`row-${time}`}>
                  {/* Colonna Orari - Sticky Left - Moderno */}
                  <div
                    className="sticky left-0 z-10 bg-white border-r-2 border-gray-200 relative transition-all duration-200 hover:bg-gray-50"
                    style={{
                      gridRow: rowIndex,
                      gridColumn: 1,
                      height: '40px',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      animationDelay: `${timeIndex * 10}ms`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '12px'
                    }}
                  >
                    {/* Linea orizzontale elegante che passa attraverso il centro dell'orario */}
                    <div
                      className="absolute pointer-events-none"
                      style={{
                        top: '50%',
                        left: '0',
                        width: `calc(70px + ${classrooms.length} * 120px)`,
                        height: '1px',
                        transform: 'translateY(-50%)',
                        zIndex: 0,
                        background: 'linear-gradient(to right, transparent, #e5e7eb 20%, #e5e7eb 80%, transparent)'
                      }}
                    />
                    <span 
                      className={`relative z-10 bg-white ${isHour ? 'font-bold text-gray-900 text-xs md:text-sm' : 'text-gray-500 text-[10px] md:text-xs'}`}
                      style={{
                        fontVariantNumeric: 'tabular-nums',
                        letterSpacing: isHour ? '0.05em' : '0.025em',
                        lineHeight: '1',
                        margin: 0,
                        padding: 0,
                        display: 'block'
                      }}
                    >
                      {time}
                    </span>
                  </div>

                  {/* Celle Aule - Moderno */}
                  {classrooms.map((classroom, classroomIndex) => {
                    const cell = gridMatrix[timeIndex][classroomIndex]
                    const colIndex = classroomIndex + 2 // +2 perché colonna 1 è orari
                    
                    // Se la cella è occupata da un evento sopra, non renderizzarla
                    if (cell.type === 'occupied') return null

                    // Se c'è un evento, renderizza cella con grid-row-span
                    if (cell.type === 'event') {
                      return (
                        <div
                          key={`${time}-${classroom}-${cell.lesson.id}`}
                          className="border-r border-gray-100 p-1 relative group"
                          style={{
                            gridRow: `${rowIndex} / span ${cell.span}`,
                            gridColumn: colIndex,
                            backgroundColor: 'transparent',
                            zIndex: 5,
                            position: 'relative'
                          }}
                        >
                          <EventCard 
                            lesson={cell.lesson} 
                            onEdit={isAuthenticated ? () => { setEditingLesson(cell.lesson); setShowForm(true) } : undefined}
                            onView={!isAuthenticated ? () => { setSelectedLesson(cell.lesson); setShowLessonDetails(true) } : undefined}
                          />
                        </div>
                      )
                    }

                    // Cella vuota con hover effect
                    return (
                      <div
                        key={`${time}-${classroom}-empty`}
                        className="border-r border-gray-100 hover:bg-gray-50 transition-colors duration-150"
                        style={{
                          gridRow: rowIndex,
                          gridColumn: colIndex,
                          backgroundColor: timeIndex % 2 === 0 ? 'rgba(255, 255, 255, 1)' : 'rgba(249, 250, 251, 0.3)'
                        }}
                      />
                    )
                  })}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      </div>

      {/* Modali e Overlay */}
      {showForm && (
        <LessonForm
          lesson={editingLesson}
          location={selectedLocation}
          onClose={() => { setShowForm(false); setEditingLesson(null); loadLessons() }}
        />
      )}

      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectLesson={(lesson, dayOfWeek) => {
          const today = new Date()
          const diff = dayOfWeek - today.getDay()
          const targetDate = new Date(today)
          targetDate.setDate(today.getDate() + diff)
          setCurrentDate(targetDate)
          setEditingLesson(lesson)
          setShowForm(true)
        }}
        lessons={lessons}
      />

      <LessonDetailsModal
        lesson={selectedLesson}
        currentDate={currentDate}
        isOpen={showLessonDetails}
        onClose={() => { setShowLessonDetails(false); setSelectedLesson(null) }}
        onEdit={isAuthenticated ? (lesson) => { setEditingLesson(lesson); setShowForm(true) } : undefined}
      />
    </div>
  )
}

// Componente Evento - Stile macOS Calendar
function EventCard({ lesson, onEdit, onView }: { lesson: Lesson, onEdit?: () => void, onView?: () => void }) {
  const courseColor = getCourseColor(lesson.course)
  
  const formatTime = (time: string) => time.split(':').slice(0, 2).join(':')
  const formatGroup = (group: string | undefined) => {
    if (!group) return null
    return `Gruppo ${group}`
  }

  // Colori più saturi per stile macOS
  const macosBgColor = courseColor.bgHex.replace('ff', 'e6') // Aggiungi più opacità
  const macosTextColor = courseColor.textHex

  return (
    <div
      onClick={onEdit || onView}
      className="h-full w-full rounded-md p-2.5 cursor-pointer overflow-hidden flex flex-col group relative"
      style={{
        backgroundColor: macosBgColor,
        borderLeft: `3px solid ${courseColor.borderColor}`,
        minHeight: '100%',
        zIndex: 5,
        position: 'relative'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = '0.9'
        e.currentTarget.style.transform = 'scale(1.01)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = '1'
        e.currentTarget.style.transform = 'scale(1)'
      }}
      title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime}`}
    >
      {/* Orario - Stile macOS (sopra) */}
      <div className="mb-1">
        <span 
          className="text-[10px] font-semibold"
          style={{ 
            color: macosTextColor,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.02em'
          }}
        >
          {formatTime(lesson.startTime)}
        </span>
      </div>
      
      {/* Titolo - Stile macOS (grassetto, principale) */}
      <div 
        className="font-semibold text-xs leading-tight mb-1 flex-1" 
        style={{ 
          color: macosTextColor,
          wordBreak: 'break-word',
          overflowWrap: 'break-word'
        }}
      >
        {lesson.title}
      </div>
      
      {/* Professore e Gruppo - Stile macOS (secondario) */}
      <div className="mt-auto">
        <div 
          className="text-[10px] leading-tight truncate" 
          style={{ 
            color: macosTextColor,
            opacity: 0.8
          }}
        >
          {lesson.professor}
        </div>
        
        {lesson.group && (
          <div 
            className="text-[9px] font-medium mt-0.5"
            style={{ 
              color: macosTextColor,
              opacity: 0.7
            }}
          >
            {formatGroup(lesson.group)}
          </div>
        )}
      </div>
    </div>
  )
}

