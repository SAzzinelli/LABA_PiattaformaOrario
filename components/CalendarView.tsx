'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'
import LessonCard from './LessonCard'
import ViewSelector from './ViewSelector'
import LoginModal from './LoginModal'
import LessonForm from './LessonForm'

type ViewType = 'day' | 'week' | 'month' | 'year'

interface Lesson {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  classroom: string
  professor: string
  group?: string
  notes?: string
}

const dayColors: Record<number, string> = {
  0: 'bg-laba-sunday', // Sunday
  1: 'bg-laba-monday', // Monday
  2: 'bg-laba-tuesday', // Tuesday
  3: 'bg-laba-wednesday', // Wednesday
  4: 'bg-laba-thursday', // Thursday
  5: 'bg-laba-friday', // Friday
  6: 'bg-laba-saturday', // Saturday
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
  const [view, setView] = useState<ViewType>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)

  useEffect(() => {
    checkAuth()
    loadLessons()
  }, [])

  const checkAuth = async () => {
    const res = await fetch('/api/auth/check')
    const data = await res.json()
    setIsAuthenticated(data.authenticated)
  }

  const loadLessons = async () => {
    const res = await fetch('/api/lessons')
    const data = await res.json()
    setLessons(data)
  }

  const handleLogin = () => {
    setShowLogin(true)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setIsAuthenticated(false)
    setShowForm(false)
    setEditingLesson(null)
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowLogin(false)
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

  const renderDayView = () => {
    const dayLessons = getLessonsForDay(currentDate)
    const dayOfWeek = currentDate.getDay()
    const headerColor = dayHeaderColors[dayOfWeek] || 'bg-laba-primary'

    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className={`${headerColor} text-white p-4 rounded-t-lg mb-4`}>
          <h2 className="text-2xl font-bold">
            {format(currentDate, 'EEEE d MMMM yyyy', { locale: it })}
          </h2>
        </div>
        <div className="space-y-4">
          {dayLessons.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nessuna lezione per questo giorno</p>
          ) : (
            dayLessons
              .sort((a, b) => a.startTime.localeCompare(b.startTime))
              .map(lesson => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onEdit={isAuthenticated ? handleEditLesson : undefined}
                  onDelete={isAuthenticated ? handleDeleteLesson : undefined}
                />
              ))
          )}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-7">
          {weekDays.map((day, index) => {
            const dayLessons = getLessonsForDay(day)
            const dayOfWeek = day.getDay()
            const headerColor = dayHeaderColors[dayOfWeek] || 'bg-laba-primary'

            return (
              <div key={index} className="border-r border-gray-200 last:border-r-0">
                <div className={`${headerColor} text-white p-3 text-center`}>
                  <div className="font-bold">{format(day, 'EEE', { locale: it })}</div>
                  <div className="text-sm">{format(day, 'd MMM', { locale: it })}</div>
                </div>
                <div className="p-2 min-h-[400px] space-y-2">
                  {dayLessons
                    .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    .map(lesson => (
                      <LessonCard
                        key={lesson.id}
                        lesson={lesson}
                        compact
                        onEdit={isAuthenticated ? handleEditLesson : undefined}
                      />
                    ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
    const calendarEnd = endOfMonth(monthStart)
    const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const weeks: Date[][] = []
    for (let i = 0; i < calendarDays.length; i += 7) {
      weeks.push(calendarDays.slice(i, i + 7))
    }

    return (
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-200">
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day, index) => {
            const headerColor = dayHeaderColors[index === 6 ? 0 : index + 1] || 'bg-laba-primary'
            return (
              <div key={day} className={`${headerColor} text-white p-2 text-center font-bold`}>
                {day}
              </div>
            )
          })}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="grid grid-cols-7 border-b border-gray-200 last:border-b-0">
            {week.map((day, dayIndex) => {
              const dayLessons = getLessonsForDay(day)
              const isCurrentMonth = day.getMonth() === currentDate.getMonth()
              const dayOfWeek = day.getDay()
              const headerColor = dayHeaderColors[dayOfWeek] || 'bg-laba-primary'

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[120px] p-2 border-r border-gray-200 last:border-r-0 ${
                    !isCurrentMonth ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className={`${headerColor} text-white text-xs p-1 rounded mb-1 text-center`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-1">
                    {dayLessons.slice(0, 3).map(lesson => (
                      <div
                        key={lesson.id}
                        className="text-xs bg-blue-100 p-1 rounded truncate cursor-pointer hover:bg-blue-200"
                        onClick={() => isAuthenticated && handleEditLesson(lesson)}
                        title={`${lesson.title} - ${lesson.startTime}-${lesson.endTime}`}
                      >
                        {lesson.startTime} {lesson.title}
                      </div>
                    ))}
                    {dayLessons.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayLessons.length - 3} altre
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const monthDate = new Date(currentDate.getFullYear(), i, 1)
      return monthDate
    })

    return (
      <div className="grid grid-cols-3 gap-4">
        {months.map((month, index) => {
          const monthStart = startOfMonth(month)
          const monthEnd = endOfMonth(month)
          const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 })
          const calendarDays = eachDayOfInterval({ start: calendarStart, end: monthEnd })

          const weeks: Date[][] = []
          for (let i = 0; i < calendarDays.length; i += 7) {
            weeks.push(calendarDays.slice(i, i + 7))
          }

          return (
            <div key={index} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-laba-primary text-white p-3 text-center font-bold">
                {format(month, 'MMMM yyyy', { locale: it })}
              </div>
              <div className="p-2">
                <div className="grid grid-cols-7 gap-1 mb-1">
                  {['L', 'M', 'M', 'G', 'V', 'S', 'D'].map((day, i) => (
                    <div key={i} className="text-xs text-center font-bold text-gray-600">
                      {day}
                    </div>
                  ))}
                </div>
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="grid grid-cols-7 gap-1">
                    {week.map((day, dayIndex) => {
                      const dayLessons = getLessonsForDay(day)
                      const isCurrentMonth = day.getMonth() === month.getMonth()
                      const hasLessons = dayLessons.length > 0

                      return (
                        <div
                          key={dayIndex}
                          className={`text-xs p-1 text-center ${
                            !isCurrentMonth ? 'text-gray-300' : ''
                          } ${hasLessons ? 'bg-blue-100 rounded' : ''}`}
                        >
                          {format(day, 'd')}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate = new Date(currentDate)
    
    switch (view) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1))
        break
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1))
        break
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1))
        break
    }
    
    setCurrentDate(newDate)
  }

  return (
    <div>
      <div className="mb-6 flex justify-between items-center">
        <ViewSelector view={view} onViewChange={setView} />
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate('prev')}
              className="px-4 py-2 bg-laba-primary text-white rounded hover:bg-opacity-90"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Oggi
            </button>
            <button
              onClick={() => navigateDate('next')}
              className="px-4 py-2 bg-laba-primary text-white rounded hover:bg-opacity-90"
            >
              →
            </button>
          </div>
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddLesson}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                + Aggiungi Lezione
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogin}
              className="px-4 py-2 bg-laba-primary text-white rounded hover:bg-opacity-90"
            >
              Login Admin
            </button>
          )}
        </div>
      </div>

      {view === 'day' && renderDayView()}
      {view === 'week' && renderWeekView()}
      {view === 'month' && renderMonthView()}
      {view === 'year' && renderYearView()}

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {showForm && (
        <LessonForm
          lesson={editingLesson}
          onClose={handleFormClose}
        />
      )}
    </div>
  )
}

