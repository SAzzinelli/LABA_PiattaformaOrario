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
  const [hiddenClassrooms, setHiddenClassrooms] = useState<string[]>([])
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
        setHiddenClassrooms([])
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
    const interval = setInterval(updateTime, 60000) // Aggiorna ogni minuto
    // Aggiorna anche ogni 30 secondi per movimento più fluido
    const interval30s = setInterval(updateTime, 30000)
    
    const handleExportEvent = () => handleExportToCalendar()
    window.addEventListener('export-calendar', handleExportEvent)
    
    return () => {
      clearInterval(interval)
      clearInterval(interval30s)
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
  const baseClassrooms = getBaseClassrooms(selectedLocation)
  
  // Logica dinamica per aule unite/divise
  // Analizza le lezioni del giorno per decidere se mostrare varianti separate
  const dayLessonsForClassroomLogic = lessons.filter(l => l.dayOfWeek === currentDate.getDay())
  
  // Verifica se ci sono lezioni con varianti (Magna 1/2, Conference 1/2)
  const hasMagnaVariants = dayLessonsForClassroomLogic.some(l => 
    l.classroom === 'Magna 1' || l.classroom === 'Magna 2'
  )
  const hasConferenceVariants = dayLessonsForClassroomLogic.some(l => 
    l.classroom === 'Conference 1' || l.classroom === 'Conference 2'
  )
  const hasMagnaUnified = dayLessonsForClassroomLogic.some(l => 
    l.classroom === 'Aula Magna'
  )
  const hasConferenceUnified = dayLessonsForClassroomLogic.some(l => 
    l.classroom === 'Conference'
  )
  
  // Costruisci lista aule dinamica
  const dynamicClassrooms: string[] = []
  baseClassrooms.forEach(aula => {
    if (aula === 'Aula Magna') {
      // Se ci sono varianti E non c'è l'unificata, mostra le varianti separate
      if (hasMagnaVariants && !hasMagnaUnified) {
        dynamicClassrooms.push('Magna 1', 'Magna 2')
      } else {
        // Altrimenti mostra l'aula unificata
        dynamicClassrooms.push('Aula Magna')
      }
    } else if (aula === 'Conference') {
      // Se ci sono varianti E non c'è l'unificata, mostra le varianti separate
      if (hasConferenceVariants && !hasConferenceUnified) {
        dynamicClassrooms.push('Conference 1', 'Conference 2')
      } else {
        // Altrimenti mostra l'aula unificata
        dynamicClassrooms.push('Conference')
      }
    } else {
      dynamicClassrooms.push(aula)
    }
  })
  
  const allClassrooms = dynamicClassrooms
  const classrooms = allClassrooms.filter(c => !hiddenClassrooms.includes(c))
  
  // Calcola posizione indicatore ora corrente (solo se è il giorno corrente)
  const isToday = isSameDay(currentDate, new Date())
  const currentTimePosition = useMemo(() => {
    if (!isToday || !currentTime) return null
    
    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const startMinutes = 8 * 60 // 08:00
    const rowHeight = 40 // Altezza riga in px
    
    // Se l'ora corrente è fuori dal range del calendario (8:00-22:00), non mostrare
    if (currentMinutes < startMinutes || currentMinutes >= 22 * 60) return null
    
    // Calcola la posizione precisa in pixel
    const slotIndex = (currentMinutes - startMinutes) / 30 // Slot frazionario (es. 9:15 = 0.5)
    const position = 40 + (slotIndex * rowHeight) // 40px per header + posizione nello slot
    
    return position
  }, [isToday, currentTime, currentDate])
  
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
      // Trova indice aula - gestione dinamica varianti
      let classroomIndex = classrooms.indexOf(lesson.classroom)
      
      // Se non trovata direttamente, prova mapping varianti
      if (classroomIndex === -1) {
        // Se l'aula è "Aula Magna" ma nel calendario ci sono "Magna 1" e "Magna 2"
        if (lesson.classroom === 'Aula Magna' && classrooms.includes('Magna 1')) {
          // Metti nella prima variante disponibile (Magna 1)
          classroomIndex = classrooms.indexOf('Magna 1')
        }
        // Se l'aula è "Magna 1" o "Magna 2" ma nel calendario c'è solo "Aula Magna"
        else if ((lesson.classroom === 'Magna 1' || lesson.classroom === 'Magna 2') && classrooms.includes('Aula Magna')) {
          classroomIndex = classrooms.indexOf('Aula Magna')
        }
        // Se l'aula è "Conference" ma nel calendario ci sono "Conference 1" e "Conference 2"
        else if (lesson.classroom === 'Conference' && classrooms.includes('Conference 1')) {
          classroomIndex = classrooms.indexOf('Conference 1')
        }
        // Se l'aula è "Conference 1" o "Conference 2" ma nel calendario c'è solo "Conference"
        else if ((lesson.classroom === 'Conference 1' || lesson.classroom === 'Conference 2') && classrooms.includes('Conference')) {
          classroomIndex = classrooms.indexOf('Conference')
        }
      }
      
      if (classroomIndex === -1) return // Aula non trovata in questa sede

      // Trova indice orario inizio - deve corrispondere ESATTAMENTE a uno slot
      const startMinutes = timeToMinutes(lesson.startTime)
      const gridStartMinutes = 8 * 60 // 08:00 - deve corrispondere a generateTimeSlots()
      
      // Calcola l'indice dello slot - deve corrispondere ESATTAMENTE a uno slot
      // Ogni slot è di 30 minuti, quindi dividiamo per 30 e usiamo floor per trovare lo slot corretto
      const calculatedIndex = (startMinutes - gridStartMinutes) / 30
      let startIndex = Math.floor(calculatedIndex) // Usa floor per trovare lo slot di inizio
      
      // Verifica che l'indice corrisponda esattamente a uno slot esistente
      if (startIndex < 0 || startIndex >= timeSlots.length) return
      
      // Verifica che l'orario di inizio corrisponda esattamente allo slot
      // Se l'orario non corrisponde esattamente (es. 9:15 invece di 9:00 o 9:30), 
      // cerca lo slot più vicino entro 15 minuti di tolleranza
      const expectedSlotTime = timeSlots[startIndex]
      const expectedSlotMinutes = timeToMinutes(expectedSlotTime)
      const timeDiff = Math.abs(startMinutes - expectedSlotMinutes)
      
      // Se la differenza è > 15 minuti (mezzo slot), cerca lo slot più vicino
      if (timeDiff > 15) {
        // Prova slot successivo (più probabile se l'orario è tra due slot)
        if (startIndex < timeSlots.length - 1) {
          const nextSlotMinutes = timeToMinutes(timeSlots[startIndex + 1])
          if (Math.abs(startMinutes - nextSlotMinutes) < timeDiff) {
            startIndex = startIndex + 1
          }
        }
      }

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
            className="flex items-center justify-start gap-2 px-4 md:px-5 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium transition-colors border border-gray-200 whitespace-nowrap w-full md:w-auto md:min-w-[200px]"
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
              hiddenClassrooms={hiddenClassrooms}
              availableClassrooms={allClassrooms}
              onCourseChange={setFilterCourse}
              onYearChange={setFilterYear}
              onHiddenClassroomsChange={setHiddenClassrooms}
              onReset={() => { setFilterCourse(''); setFilterYear(null); setHiddenClassrooms([]) }}
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
          {/* Indicatore ora corrente - Linea rossa stile macOS */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 pointer-events-none z-[60]"
              style={{
                top: `${currentTimePosition}px`,
                height: '2px',
                backgroundColor: '#ff3b30',
                boxShadow: '0 0 4px rgba(255, 59, 48, 0.5)',
                transform: 'translateY(-1px)' // Centra la linea
              }}
            >
              {/* Punto rosso a sinistra (nella colonna orari) */}
              <div
                className="absolute left-0"
                style={{
                  width: '70px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '8px'
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#ff3b30',
                    boxShadow: '0 0 4px rgba(255, 59, 48, 0.6)'
                  }}
                />
              </div>
            </div>
          )}
          
          <div 
            className="relative"
            style={{
              display: 'grid',
              gridTemplateColumns: `70px repeat(${classrooms.length}, minmax(140px, 160px))`,
              gridTemplateRows: `40px repeat(${timeSlots.length}, 40px)`,
              minWidth: `${70 + classrooms.length * 140}px`,
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
                        width: `calc(70px + ${classrooms.length} * 140px)`,
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
                            zIndex: 15,
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

// Componente Evento - Design Moderno e Pulito
function EventCard({ lesson, onEdit, onView }: { lesson: Lesson, onEdit?: () => void, onView?: () => void }) {
  const courseColor = getCourseColor(lesson.course)
  
  const formatTime = (time: string) => time.split(':').slice(0, 2).join(':')
  const formatGroup = (group: string | undefined) => {
    if (!group) return null
    return `Gruppo ${group}`
  }

  // Colori più saturi e vibranti
  const bgColor = courseColor.bgHex
  const textColor = courseColor.textHex
  const borderColor = courseColor.borderColor

  return (
    <div
      onClick={onEdit || onView}
      className="h-full w-full rounded-lg p-2 cursor-pointer overflow-hidden flex flex-col group relative border"
      style={{
        backgroundColor: bgColor,
        borderColor: borderColor,
        borderWidth: '1.5px',
        minHeight: '100%',
        zIndex: 20,
        position: 'relative',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
        e.currentTarget.style.transform = 'translateY(-1px)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.08)'
        e.currentTarget.style.transform = 'translateY(0)'
      }}
      title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime}`}
    >
      {/* Orario - Badge compatto in alto */}
      <div className="mb-1.5">
        <span 
          className="text-[9px] font-bold px-1.5 py-0.5 rounded"
          style={{ 
            color: textColor,
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: '0.03em'
          }}
        >
          {formatTime(lesson.startTime)}
        </span>
      </div>
      
      {/* Titolo - Principale, ben visibile */}
      <div 
        className="font-bold text-sm leading-snug mb-1.5 flex-1" 
        style={{ 
          color: textColor,
          wordBreak: 'break-word',
          overflowWrap: 'break-word',
          lineHeight: '1.3'
        }}
      >
        {lesson.title}
      </div>
      
      {/* Informazioni secondarie */}
      <div className="mt-auto space-y-0.5">
        <div 
          className="text-[10px] font-medium leading-tight" 
          style={{ 
            color: textColor,
            opacity: 0.85
          }}
        >
          {lesson.professor}
        </div>
        
        {lesson.group && (
          <div 
            className="text-[9px] font-semibold inline-block px-1.5 py-0.5 rounded"
            style={{ 
              color: textColor,
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              opacity: 0.9
            }}
          >
            {formatGroup(lesson.group)}
          </div>
        )}
      </div>
    </div>
  )
}

