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
import { getBaseClassrooms } from '@/lib/classrooms'
import { generateTimeSlots, timeToMinutes, getLessonSlots } from '@/lib/timeSlots'
import { Location } from '@/lib/locations'
import { usePathname } from 'next/navigation'
import { generateICS } from '@/lib/ics'
import { getCourseColor, getCourseCode } from '@/lib/courseColors'
import { getCoursesForLocation } from '@/lib/locations'
import { ALL_COURSES } from '@/lib/courses'

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
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportCourse, setExportCourse] = useState<string>('')
  const [allLessons, setAllLessons] = useState<Lesson[]>([])
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
    try {
      const res = await fetch(`/api/lessons?${params.toString()}`)
      const data = await res.json()
      const locationClassrooms = getBaseClassrooms(selectedLocation)
      const filteredLessons = data.filter((lesson: Lesson) => {
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

  const loadAllLessons = async () => {
    try {
      const res = await fetch('/api/lessons')
      const data = await res.json()
      const locationClassrooms = getBaseClassrooms(selectedLocation)
      const filteredLessons = data.filter((lesson: Lesson) => {
        const c = lesson.classroom
        if (selectedLocation === 'badia-ripoli') {
          if (c === 'Magna 1' || c === 'Magna 2') return locationClassrooms.includes('Aula Magna')
          if (c === 'Conference 1' || c === 'Conference 2') return locationClassrooms.includes('Conference')
        }
        return locationClassrooms.includes(c)
      })
      setAllLessons(filteredLessons)
    } catch (e) {
      console.error("Failed to load all lessons", e)
    }
  }
  
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
    loadAllLessons()
    const handleExportEvent = () => setShowExportModal(true)
    window.addEventListener('export-calendar', handleExportEvent)
    return () => window.removeEventListener('export-calendar', handleExportEvent)
  }, [])

  useEffect(() => {
    loadLessons()
    loadAllLessons()
  }, [filterCourse, filterYear, selectedLocation])

  const handleExportToCalendar = () => {
    if (!exportCourse) return
    
    // Filtra le lezioni per il corso selezionato
    const filteredLessons = allLessons.filter(lesson => lesson.course === exportCourse)
    
    const courseCode = getCourseCode(exportCourse)
    const fileName = `orario_laba_${courseCode.toLowerCase()}.ics`
    
    const icsContent = generateICS(filteredLessons)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', fileName)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
    
    setShowExportModal(false)
    setExportCourse('')
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
        if (lesson.classroom === 'Magna 1' || lesson.classroom === 'Magna 2') {
          classroomIndex = classrooms.indexOf('Aula Magna')
        } else if (lesson.classroom === 'Conference 1' || lesson.classroom === 'Conference 2') {
          classroomIndex = classrooms.indexOf('Conference')
        }
      }
      
      if (classroomIndex === -1) {
        // Debug: log per vedere lezioni con aula non trovata
        console.warn(`Aula non trovata per lezione: ${lesson.title} - Aula: ${lesson.classroom} - Aule disponibili:`, classrooms)
        return // Aula non trovata in questa sede
      }

      // Trova indice orario inizio
      // Usa timeToMinutes per trovare lo slot corretto
      const startMinutes = timeToMinutes(lesson.startTime)
      const gridStartMinutes = 9 * 60 // 09:00
      const startIndex = Math.floor((startMinutes - gridStartMinutes) / 30)

      // Calcola durata in slot
      // Usa getLessonSlots che calcola correttamente la durata
      const span = getLessonSlots(lesson.startTime, lesson.endTime)

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
              className="flex items-center gap-2 px-3 sm:px-5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium transition-colors border border-gray-200 whitespace-nowrap"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Cerca</span>
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
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 1); setCurrentDate(d) }} className="p-1 rounded bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-2 sm:px-3 py-1 rounded text-xs sm:text-sm bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors">Oggi</button>
            <button onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 1); setCurrentDate(d) }} className="p-1 rounded bg-white bg-opacity-10 hover:bg-opacity-20 transition-colors">
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
                      
                      // Se la cella è occupata da un evento sopra, non renderizzarla
                      if (cell.type === 'occupied') return null

                      // Se c'è un evento, renderizza cella con rowspan
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
                        
                        return (
                          <td 
                            key={`${time}-${classroom}`} 
                            rowSpan={cell.span} 
                            className="border-r border-gray-100 p-0 align-top relative"
                            style={{ 
                              width: `${classroomWidth}px`,
                              height: `${cell.span * 45}px`, 
                              verticalAlign: 'top',
                              ...(classroomIndex === classrooms.length - 1 ? { borderRight: 'none' } : {})
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

      {/* Modal Esportazione Calendario */}
      {showExportModal && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-[90] animate-fade-in"
            onClick={() => { setShowExportModal(false); setExportCourse('') }}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] bg-white rounded-lg shadow-xl border border-gray-200 min-w-[320px] max-w-md animate-scale-in">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Esporta calendario</h3>
              <p className="text-sm text-gray-600 mb-4">Seleziona il corso da esportare:</p>
              <select
                value={exportCourse}
                onChange={(e) => setExportCourse(e.target.value)}
                className="w-full px-3 py-2 rounded-md text-sm border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              >
                <option value="">Seleziona un corso</option>
                {getCoursesForLocation(selectedLocation).map((course) => (
                  <option key={course} value={course}>
                    {course === 'Graphic Design & Multimedia' ? 'Graphic Design' : course}
                  </option>
                ))}
              </select>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => { setShowExportModal(false); setExportCourse('') }}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  Annulla
                </button>
                <button
                  onClick={handleExportToCalendar}
                  disabled={!exportCourse}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Esporta
                </button>
              </div>
            </div>
          </div>
        </>
      )}
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
      
      {lesson.course && lesson.year && (
        <div className="inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap w-fit" style={{ backgroundColor: courseColor.borderColor, color: courseColor.textHex }}>
          {getCourseCode(lesson.course)} {lesson.year}
        </div>
      )}
      
      <div className="mt-auto text-xs opacity-80 truncate" style={{ color: courseColor.textHex }}>
        Prof. {lesson.professor}
      </div>
      
      <div className="text-[10px] font-semibold opacity-80" style={{ color: courseColor.textHex }}>
        {lesson.group ? `Gruppo ${lesson.group}` : 'Tutti'}
      </div>
    </div>
  )
}

