'use client'

import { ALL_COURSES, getYearsForCourse } from '@/lib/courses'
import { Location, getCoursesForLocation } from '@/lib/locations'

interface LessonFiltersProps {
  course: string
  year: number | null
  location: Location
  onCourseChange: (course: string) => void
  onYearChange: (year: number | null) => void
  onReset: () => void
}

export default function LessonFilters({
  course,
  year,
  location,
  onCourseChange,
  onYearChange,
  onReset,
}: LessonFiltersProps) {
  // Filtra i corsi disponibili per la sede selezionata
  const availableCourses = getCoursesForLocation(location)
  const courseOptions = ALL_COURSES.filter(c => availableCourses.includes(c))

  // Se un corso non è disponibile nella sede corrente, resettalo
  if (course && !availableCourses.includes(course)) {
    onCourseChange('')
  }

  const availableYears = course ? getYearsForCourse(course as any) : []

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filtro Corso */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filterCourse" className="text-xs font-medium text-gray-600 whitespace-nowrap">
          Corso:
        </label>
        <select
          id="filterCourse"
          value={course || ''}
          onChange={(e) => {
            onCourseChange(e.target.value)
            onYearChange(null) // Reset anno quando cambia corso
          }}
          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
        >
          <option value="">Tutti i corsi</option>
          {courseOptions.map((c) => (
            <option key={c} value={c}>
              {c === 'Graphic Design & Multimedia' ? 'Graphic Design' : c}
            </option>
          ))}
        </select>
      </div>

      {/* Filtro Anno */}
      <div className="flex items-center gap-1.5">
        <label htmlFor="filterYear" className="text-xs font-medium text-gray-600 whitespace-nowrap">
          Anno:
        </label>
        <select
          id="filterYear"
          value={year?.toString() || ''}
          onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!course}
          className="px-3 py-1.5 rounded-md text-sm border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed min-w-[110px]"
        >
          <option value="">Tutti gli anni</option>
          {availableYears.map((y) => (
            <option key={y} value={y}>
              {y}° Anno
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

