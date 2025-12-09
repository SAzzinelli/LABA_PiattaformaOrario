'use client'

import { useState, useEffect, useMemo } from 'react'
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
    
    const handleExportEvent = () => handleExportToCalendar()
    window.addEventListener('export-calendar', handleExportEvent)
    
    return () => {
      window.removeEventListener('export-calendar', handleExportEvent)
    }
  }, [])

  useEffect(() => {
    loadLessons()
  }, [filterCourse, filterYear, selectedLocation])

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check')
      const data = await res.json()
      setIsAuthenticated(data.authenticated)
    } catch (e) {
      console.error("Auth check failed", e)
    }
  }

  const loadLessons = async () => {
    const params = new URLSearchParams()
    if (filterCourse) params.append('course', filterCourse)
    if (filterYear !== null) params.append('year', filterYear.toString())
    
    try {
      const res = await fetch(`/api/lessons?${params.toString()}`)
      const data = await res.json()
      
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

      // Calcola durata in slot (includendo lo slot finale)
      const endMinutes = timeToMinutes(lesson.endTime)
      const endIndex = Math.floor((endMinutes - gridStartMinutes) / 30)
      const span = endIndex - startIndex + 1 // Include lo slot finale

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
    <div className="flex flex-col h-full">
      {/* Barra superiore strumenti */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex-shrink-0">
        <div className="flex gap-3 items-center justify-between">
          <button
            onClick={() => setShowSearch(true)}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors border border-gray-200 whitespace-nowrap min-w-[140px]"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span>Cerca</span>
          </button>
          <div className="flex items-center gap-3">
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
                className="px-4 py-2 rounded-lg bg-green-500 text-white text-sm font-medium shadow-sm hover:bg-green-600 transition-colors flex items-center gap-2"
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
        {/* Header Giorno */}
        <div className="px-4 py-3 text-white font-semibold flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#033157' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg uppercase">{dayName}</span>
            <span className="text-lg">{dayNumber} {monthName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d) }} className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 rounded text-sm hover:bg-white hover:bg-opacity-20 transition-colors">Oggi</button>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d) }} className="p-1 rounded hover:bg-white hover:bg-opacity-20 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Tabella Calendario - Scrollabile */}
        <div className="flex-1 overflow-auto bg-white" style={{ height: 'calc(100vh - 240px)' }}>
          <table className="w-full border-collapse table-fixed" style={{ minWidth: `${80 + classrooms.length * 150}px` }}>
            {/* Intestazione Aule - Sticky Top */}
            <thead className="sticky top-0 z-20 bg-white shadow-sm">
              <tr>
                <th className="w-20 bg-white border-b border-r border-gray-200 p-2 sticky left-0 z-30"></th>
                {classrooms.map((classroom) => (
                  <th key={classroom} className="border-b border-r border-gray-200 p-2 text-xs font-semibold text-gray-700 bg-gray-50 h-[45px]">
                    {classroom}
                  </th>
                ))}
              </tr>
            </thead>
            
            {/* Corpo Tabella - Orari e Celle */}
            <tbody>
              {timeSlots.map((time, timeIndex) => {
                const isHour = time.endsWith(':00')
                return (
                  <tr key={time} className="h-[45px]">
                    {/* Colonna Orari - Sticky Left */}
                    <td className="sticky left-0 z-10 bg-white border-r border-gray-200 align-middle p-0">
                      <div className="flex items-center justify-end pr-3 h-full w-full relative">
                        {/* Linea che passa attraverso l'orario per simularlo (opzionale, stile macOS) */}
                        <span className={`text-xs ${isHour ? 'font-bold text-gray-800' : 'text-gray-400 text-[10px]'}`}>
                          {time}
                        </span>
                      </div>
                    </td>

                    {/* Celle Aule */}
                    {classrooms.map((classroom, classroomIndex) => {
                      const cell = gridMatrix[timeIndex][classroomIndex]
                      
                      // Se la cella è occupata da un evento sopra, non renderizzarla
                      if (cell.type === 'occupied') return null

                      // Se c'è un evento, renderizza cella con rowspan
                      if (cell.type === 'event') {
                        return (
                          <td 
                            key={`${time}-${classroom}`} 
                            rowSpan={cell.span} 
                            className="border-r border-b border-gray-100 p-0 align-top relative"
                          >
                            <EventCard 
                              lesson={cell.lesson} 
                              onEdit={isAuthenticated ? () => { setEditingLesson(cell.lesson); setShowForm(true) } : undefined}
                              onView={!isAuthenticated ? () => { setSelectedLesson(cell.lesson); setShowLessonDetails(true) } : undefined}
                            />
                          </td>
                        )
                      }

                      // Cella vuota
                      return (
                        <td key={`${time}-${classroom}`} className="border-r border-b border-gray-100"></td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
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

// Componente Evento
function EventCard({ lesson, onEdit, onView }: { lesson: Lesson, onEdit?: () => void, onView?: () => void }) {
  const courseColor = getCourseColor(lesson.course)
  
  const formatTime = (time: string) => time.split(':').slice(0, 2).join(':')

  return (
    <div
      onClick={onEdit || onView}
      className="h-full w-full rounded-lg border-l-4 px-2 py-1 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col group"
      style={{
        backgroundColor: courseColor.bgHex,
        borderLeftColor: courseColor.borderColor
      }}
      title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-bold opacity-90 group-hover:opacity-100" style={{ color: courseColor.textHex }}>
          {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
        </span>
      </div>
      
      <div className="font-bold text-sm leading-tight mb-1 line-clamp-2" style={{ color: courseColor.textHex }}>
        {lesson.title}
      </div>
      
      {lesson.course && lesson.year && (
        <div className="text-xs font-semibold opacity-80" style={{ color: courseColor.textHex }}>
          {getCourseCode(lesson.course)} {lesson.year}
        </div>
      )}
      
      <div className="mt-auto text-xs opacity-80 truncate" style={{ color: courseColor.textHex }}>
        {lesson.professor}
      </div>
      
      {lesson.group && (
        <div className="text-[10px] font-semibold opacity-80" style={{ color: courseColor.textHex }}>
          Gr: {lesson.group}
        </div>
      )}
    </div>
  )
}

