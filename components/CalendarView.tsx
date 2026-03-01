'use client'

import { useState, useEffect, useMemo } from 'react'
import { format, isSameDay } from 'date-fns'
import { it } from 'date-fns/locale'
import LessonForm from './LessonForm'
import LessonFilters from './LessonFilters'
import SearchOverlay from './SearchOverlay'
import LessonDetailsModal from './LessonDetailsModal'
import ListView from './ListView'
import ViewSelector from './ViewSelector'
import { getBaseClassrooms, resolveClassroomToColumns } from '@/lib/classrooms'
import { generateTimeSlots, timeToMinutes, getLessonSlots } from '@/lib/timeSlots'
import { Location } from '@/lib/locations'
import { usePathname } from 'next/navigation'
import { getCourseColor, getCourseCode } from '@/lib/courseColors'
import { formatProfessorLines } from '@/lib/formatting'

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
  | { type: 'event', lesson: Lesson, span: number, colSpan?: number }
  | { type: 'occupied' }
  | { type: 'occupied-h' }  // occupata orizzontalmente da evento a sinistra (colSpan)

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
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const pathname = usePathname()
  
  const getLocationFromPath = (): Location => {
    if (pathname?.includes('/via-vecchietti')) return 'via-vecchietti'
    if (pathname?.includes('/badia-ripoli')) return 'badia-ripoli'
    return initialLocation || 'badia-ripoli'
  }
  
  const [selectedLocation, setSelectedLocation] = useState<Location>(initialLocation || 'badia-ripoli')

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
    params.append('date', format(currentDate, 'yyyy-MM-dd'))
    try {
      const res = await fetch(`/api/lessons?${params.toString()}`)
      const data = await res.json()
      const locationClassrooms = getBaseClassrooms(selectedLocation)
      const filteredLessons = data.filter((lesson: Lesson) => {
        const { startCol } = resolveClassroomToColumns(lesson.classroom, locationClassrooms)
        return startCol >= 0
      })
      setLessons(filteredLessons)
    } catch (e) {
      console.error("Failed to load lessons", e)
    }
  }

  // Gestione URL e Location (sync state con pathname)
  useEffect(() => {
    if (pathname) {
      const locationFromPath = getLocationFromPath()
      if (locationFromPath !== selectedLocation) {
        setSelectedLocation(locationFromPath)
        setFilterCourse('')
        setFilterYear(null)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getLocationFromPath from pathname
  }, [pathname, selectedLocation])

  // Caricamento dati e Auth al mount
  useEffect(() => {
    checkAuth()
    loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, [])

  // Ricarica lezioni quando cambiano filtri o data (per semestre corretto)
  useEffect(() => {
    loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when filters/date change
  }, [filterCourse, filterYear, selectedLocation, currentDate])

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
      const { startCol: classroomIndex, colSpan } = resolveClassroomToColumns(lesson.classroom, classrooms)
      
      if (classroomIndex === -1) {
        return
      }

      const startMinutes = timeToMinutes(lesson.startTime)
      const gridStartMinutes = 9 * 60
      const startIndex = Math.floor((startMinutes - gridStartMinutes) / 30)
      const span = getLessonSlots(lesson.startTime, lesson.endTime)

      if (startIndex >= 0 && startIndex < timeSlots.length) {
        matrix[startIndex][classroomIndex] = { 
          type: 'event', 
          lesson, 
          span: Math.min(span, timeSlots.length - startIndex),
          colSpan: colSpan > 1 ? colSpan : undefined
        }

        // Marca celle successive ORIZZONTALI come occupied-h (per colSpan)
        for (let c = 1; c < colSpan && classroomIndex + c < classrooms.length; c++) {
          matrix[startIndex][classroomIndex + c] = { type: 'occupied-h' }
        }
        for (let r = 1; r < span && startIndex + r < timeSlots.length; r++) {
          matrix[startIndex + r][classroomIndex] = { type: 'occupied' }
          for (let c = 1; c < colSpan && classroomIndex + c < classrooms.length; c++) {
            matrix[startIndex + r][classroomIndex + c] = { type: 'occupied-h' }
          }
        }
      }
    })

    return matrix
  }, [lessons, currentDate, classrooms, timeSlots])

  // Formattazione data
  const dayName = format(currentDate, 'EEEE', { locale: it })
  const dayNumber = format(currentDate, 'd', { locale: it })
  const monthName = format(currentDate, 'MMMM yyyy', { locale: it })

  // Calcola la larghezza delle colonne (sempre 150px)
  const classroomWidth = 150
  const tableWidth = 80 + classrooms.length * classroomWidth
  
  // Per Via de' Vecchietti limita la larghezza del contenitore esterno leggermente più della griglia
  const containerMaxWidth = selectedLocation === 'via-vecchietti' ? `${tableWidth + 40}px` : '100%'

  return (
    <div className="flex flex-col h-full">
      {/* Barra superiore strumenti */}
      <div className="mb-4 bg-white rounded-lg shadow-sm border border-gray-200 p-3 flex-shrink-0">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => setShowSearch(true)}
              className="flex items-center gap-2 px-4 sm:px-6 py-2.5 min-w-[180px] sm:min-w-[240px] rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm sm:text-base font-medium transition-colors border border-gray-200 whitespace-nowrap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span>Cerca</span>
            </button>
            <ViewSelector view={viewMode} onViewChange={setViewMode} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-between sm:justify-end">
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
                className="px-3 sm:px-4 py-2 rounded-lg bg-green-500 text-white text-xs sm:text-sm font-medium shadow-sm hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Aggiungi</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Contenitore Calendario/Lista */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden" style={{ maxWidth: viewMode === 'calendar' ? containerMaxWidth : '100%', margin: (viewMode === 'calendar' && selectedLocation === 'via-vecchietti') ? '0 auto' : '0' }}>
        {/* Header Giorno */}
        <div className="px-4 py-3 text-white flex items-center justify-between flex-shrink-0" style={{ backgroundColor: '#033157' }}>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-sm sm:text-lg uppercase font-bold">{dayName}</span>
            <span className="text-xs sm:text-base font-normal">{dayNumber} {monthName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d) }} className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white transition-colors">Oggi</button>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d) }} className="p-1 rounded bg-white/10 hover:bg-white/20 text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </div>

        {/* Vista Calendario o Lista */}
        {viewMode === 'calendar' ? (
          <>
            {/* Tabella Calendario - Scrollabile */}
            <div className="flex-1 overflow-x-auto overflow-y-auto bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] touch-pan-x" style={{ height: 'calc(100vh - 240px)', WebkitOverflowScrolling: 'touch' }}>
          <table className="border-collapse" style={{ width: `${tableWidth}px`, tableLayout: 'fixed', minWidth: `${tableWidth}px`, maxWidth: `${tableWidth}px` }}>
            {/* Intestazione Aule - Sticky Top */}
            <thead className="sticky top-0 z-20 bg-white shadow-sm">
              <tr>
                <th className="bg-white border-b border-r border-gray-200 p-2 sticky left-0 z-30" style={{ width: '80px', minWidth: '80px', maxWidth: '80px' }}></th>
                {classrooms.map((classroom, index) => (
                  <th 
                    key={classroom} 
                    className="border-b border-r border-gray-200 p-2 text-xs font-semibold text-gray-700 bg-gray-50 h-[45px]"
                    style={{ 
                      width: `${classroomWidth}px`,
                      ...(index === classrooms.length - 1 ? { borderRight: 'none' } : {})
                    }}
                  >
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
                  <tr key={time} style={{ height: '45px', position: 'relative' }}>
                    {/* Colonna Orari - Sticky Left - senza righe */}
                    <td className="sticky left-0 z-10 bg-white border-r border-gray-200 p-0" style={{ verticalAlign: 'middle', width: '80px', minWidth: '80px', maxWidth: '80px' }}>
                      <div className="relative h-full w-full flex items-center justify-end pr-3">
                        <span className={`text-xs ${isHour ? 'font-bold text-gray-800' : 'text-gray-400 text-[10px]'}`}>
                          {time}
                        </span>
                      </div>
                    </td>

                    {/* Celle Aule */}
                    {classrooms.map((classroom, classroomIndex) => {
                      const cell = gridMatrix[timeIndex][classroomIndex]
                      
                      if (cell.type === 'occupied' || cell.type === 'occupied-h') return null

                      if (cell.type === 'event') {
                        // Calcola le posizioni delle linee orizzontali per ogni slot
                        // Le linee devono essere centrate verticalmente su ogni riga, come nelle celle vuote
                        const lines = []
                        for (let i = 0; i <= cell.span; i++) {
                          const linePosition = i * 45 + 22.5 // Centro della riga
                          // Verifica se questa linea corrisponde a un'ora intera o mezz'ora
                          const slotIndex = timeIndex + i
                          const isHourLine = slotIndex < timeSlots.length && timeSlots[slotIndex]?.endsWith(':00')
                          lines.push(
                            <div
                              key={`line-${i}`}
                              className="absolute left-0 right-0 pointer-events-none z-0"
                              style={{
                                top: `${linePosition}px`,
                                transform: 'translateY(-50%)',
                                borderTop: isHourLine ? '1px solid #e5e7eb' : '0.5px solid #d1d5db'
                              }}
                            />
                          )
                        }
                        
                        const colSpan = cell.colSpan ?? 1
                        const cellWidth = classroomWidth * colSpan
                        return (
                          <td 
                            key={`${time}-${classroom}`} 
                            rowSpan={cell.span}
                            colSpan={colSpan}
                            className="border-r border-gray-100 p-0 align-top relative"
                            style={{ 
                              width: `${cellWidth}px`,
                              minWidth: `${cellWidth}px`,
                              height: `${cell.span * 45}px`, 
                              verticalAlign: 'top',
                              ...(classroomIndex + colSpan - 1 >= classrooms.length - 1 ? { borderRight: 'none' } : {})
                            }}
                          >
                            {/* Linee orizzontali per ogni slot - dietro la card */}
                            {lines}
                            <div style={{ marginTop: '22.5px', marginBottom: '-22.5px', height: '100%', paddingTop: '2px', paddingBottom: '2px', paddingLeft: '2px', paddingRight: '2px', position: 'relative', zIndex: 1 }}>
                              <EventCard 
                                lesson={cell.lesson} 
                                onEdit={isAuthenticated ? () => { setEditingLesson(cell.lesson); setShowForm(true) } : undefined}
                                onView={!isAuthenticated ? () => { setSelectedLesson(cell.lesson); setShowLessonDetails(true) } : undefined}
                              />
                            </div>
                          </td>
                        )
                      }

                      // Cella vuota - la linea è centrata verticalmente, più sottile per le mezze ore
                      return (
                        <td 
                          key={`${time}-${classroom}`} 
                          className="border-r border-gray-100 relative"
                          style={{ 
                            width: `${classroomWidth}px`,
                            ...(classroomIndex === classrooms.length - 1 ? { borderRight: 'none' } : {})
                          }}
                        >
                          {/* Linea orizzontale centrata verticalmente - più sottile per mezze ore */}
                          <div 
                            className="absolute top-1/2 left-0 right-0" 
                            style={{ 
                              transform: 'translateY(-50%)',
                              borderTop: isHour ? '1px solid #e5e7eb' : '0.5px solid #d1d5db'
                            }}
                          ></div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
          </>
        ) : (
          <ListView
            lessons={lessons}
            currentDate={currentDate}
            isAuthenticated={isAuthenticated}
            onEditLesson={isAuthenticated ? (lesson) => { setEditingLesson(lesson); setShowForm(true) } : undefined}
            onViewLesson={!isAuthenticated ? (lesson) => { setSelectedLesson(lesson); setShowLessonDetails(true) } : undefined}
          />
        )}
      </div>

      {/* Modali e Overlay */}
      {showForm && (
        <LessonForm
          key={editingLesson?.id ?? 'new'}
          lesson={editingLesson}
          location={selectedLocation}
          onClose={() => { setShowForm(false); setEditingLesson(null); loadLessons() }}
          onDelete={async (id) => {
            try {
              const res = await fetch(`/api/lessons/${id}`, {
                method: 'DELETE',
              })
              if (res.ok) {
                loadLessons()
                setShowForm(false)
                setEditingLesson(null)
              }
            } catch (err) {
              console.error('Error deleting lesson:', err)
            }
          }}
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
          
          // Se autenticato: apri form modifica, altrimenti apri modale dettagli
          if (isAuthenticated) {
            setEditingLesson(lesson)
            setShowForm(true)
          } else {
            setSelectedLesson(lesson)
            setShowLessonDetails(true)
          }
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
  const courseColor = getCourseColor(lesson.course, lesson.year)
  
  const formatTime = (time: string) => time.split(':').slice(0, 2).join(':')

  return (
    <div
      onClick={onEdit || onView}
      className="h-full w-full rounded-lg border-l-4 border border-gray-200 px-2 py-1.5 shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden flex flex-col group"
      style={{
        backgroundColor: courseColor.bgHex,
        borderLeftColor: courseColor.borderColor,
        minHeight: '100%',
        height: '100%'
      }}
      title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime}`}
    >
      <div className="flex justify-between items-start mb-1">
        <span className="text-xs font-bold opacity-90 group-hover:opacity-100" style={{ color: courseColor.textHex }}>
          {formatTime(lesson.startTime)} - {formatTime(lesson.endTime)}
        </span>
      </div>
      
      <div className="font-bold text-xs leading-tight mb-1" style={{ color: courseColor.textHex }}>
        {lesson.title}
      </div>
      
      <div className="flex flex-wrap gap-1.5 mt-1">
        {lesson.course && lesson.year && (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap" style={{ backgroundColor: courseColor.borderColor, color: courseColor.textHex }}>
            {getCourseCode(lesson.course)} {lesson.year}
          </span>
        )}
        <span
          className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap"
          style={{
            backgroundColor: lesson.group ? courseColor.borderColor : 'rgba(107, 114, 128, 0.25)',
            color: lesson.group ? courseColor.textHex : '#4b5563',
          }}
        >
          {lesson.group ? `Gruppo ${lesson.group}` : 'Tutti'}
        </span>
      </div>
      
      <div className="mt-auto text-xs opacity-80 truncate leading-tight" style={{ color: courseColor.textHex }}>
        {formatProfessorLines(lesson.professor).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  )
}

