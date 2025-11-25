'use client'

import { useState, useEffect } from 'react'
import LessonForm from './LessonForm'
import LessonFilters from './LessonFilters'
import SearchOverlay from './SearchOverlay'
import LessonDetailsModal from './LessonDetailsModal'
import { getBaseClassrooms } from '@/lib/classrooms'
import { useLessons, Lesson } from '@/hooks/useLessons'
import CalendarHeader from './CalendarHeader'
import CalendarGrid from './CalendarGrid'

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  // Custom hook per le lezioni
  const {
    lessons,
    loading,
    filterCourses,
    setFilterCourses,
    filterYears,
    setFilterYears,
    refreshLessons
  } = useLessons()

  // Filtro aule
  const [selectedClassrooms, setSelectedClassrooms] = useState<string[]>([])
  const classrooms = getBaseClassrooms()

  // Ricerca
  const [showSearch, setShowSearch] = useState(false)

  // Dettagli lezione (per utenti non loggati)
  const [showLessonDetails, setShowLessonDetails] = useState(false)
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  // Inizializza selectedClassrooms con tutte le aule se è vuoto
  useEffect(() => {
    if (selectedClassrooms.length === 0 && classrooms.length > 0) {
      setSelectedClassrooms(classrooms)
    }
  }, [classrooms.length])

  // Filtra le aule da mostrare
  const visibleClassrooms = classrooms.filter(c => selectedClassrooms.includes(c))

  // Calcola la larghezza minima basata sul nome più lungo
  const getMinClassroomWidth = () => {
    const maxLength = Math.max(...classrooms.map(c => c.length))
    return Math.max(110, maxLength * 6 + 24)
  }
  const minClassroomWidth = getMinClassroomWidth()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const res = await fetch('/api/auth/check')
    const data = await res.json()
    setIsAuthenticated(data.authenticated)
  }

  const handleAddLesson = () => {
    setEditingLesson(null)
    setShowForm(true)
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson)
    setShowForm(true)
  }

  const handleFormClose = () => {
    setShowForm(false)
    setEditingLesson(null)
    refreshLessons()
  }

  const navigateDate = (direction: 'prev' | 'next' | 'today') => {
    let newDate = new Date(currentDate)
    if (direction === 'today') {
      newDate = new Date()
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const handleResetFilters = () => {
    setFilterCourses([])
    setFilterYears([])
  }

  const handleSearchSelect = (lesson: Lesson, dayOfWeek: number) => {
    const today = new Date()
    const currentDay = today.getDay()
    const diff = dayOfWeek - currentDay
    const targetDate = new Date(today)
    targetDate.setDate(today.getDate() + diff)

    setCurrentDate(targetDate)

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
      <div className="sticky top-0 z-10 bg-gray-50 pb-2 mb-2 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2 sm:gap-3">
        {/* Ricerca a sinistra */}
        <div className="w-full sm:w-auto">
          <button
            onClick={() => setShowSearch(true)}
            className="btn-modern flex items-center justify-center sm:justify-start gap-2 px-4 sm:px-5 py-2.5 rounded-full bg-white text-laba-primary text-sm font-medium shadow-md border border-gray-200 relative overflow-hidden w-full sm:w-auto"
          >
            <svg className="w-4 h-4 relative z-10 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="relative z-10 whitespace-nowrap">Cerca Lezione</span>
          </button>
        </div>

        {/* Filtri e Aggiungi a destra */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <LessonFilters
            courses={filterCourses}
            years={filterYears}
            onCoursesChange={setFilterCourses}
            onYearsChange={setFilterYears}
            onReset={handleResetFilters}
          />

          {/* Aggiungi Lezione (solo admin) */}
          {isAuthenticated && (
            <button
              onClick={handleAddLesson}
              className="btn-modern px-4 sm:px-6 py-2.5 rounded-full bg-green-500 text-white text-sm font-medium shadow-md whitespace-nowrap relative overflow-hidden w-full sm:w-auto"
            >
              <span className="relative z-10">+ Aggiungi Lezione</span>
            </button>
          )}
        </div>
      </div>

      {/* Container scrollabile con header sticky */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="flex flex-col h-full card-modern overflow-hidden animate-fade-in">
          <CalendarHeader
            currentDate={currentDate}
            onNavigate={navigateDate}
            selectedClassrooms={selectedClassrooms}
            onClassroomsChange={setSelectedClassrooms}
            allClassrooms={classrooms}
          />

          {loading ? (
            <div className="flex-1 flex items-center justify-center bg-white">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-laba-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-500 font-medium animate-pulse">Caricamento lezioni...</div>
              </div>
            </div>
          ) : (
            <CalendarGrid
              lessons={lessons}
              currentDate={currentDate}
              visibleClassrooms={visibleClassrooms}
              minClassroomWidth={minClassroomWidth}
              isAuthenticated={isAuthenticated}
              onEditLesson={handleEditLesson}
              onViewLesson={(lesson) => {
                setSelectedLesson(lesson)
                setShowLessonDetails(true)
              }}
            />
          )}
        </div>
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
