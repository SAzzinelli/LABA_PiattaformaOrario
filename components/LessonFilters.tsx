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
  compact?: boolean
}

export default function LessonFilters({
  course,
  year,
  location,
  onCourseChange,
  onYearChange,
  onReset,
  compact = false,
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
    <div className={`flex items-center gap-2 ${compact ? 'flex-col' : 'flex-wrap'}`}>
      {/* Filtro Corso */}
      <div className={`flex items-center gap-1.5 ${compact ? 'w-full' : ''}`}>
        <label htmlFor="filterCourse" className="text-xs font-medium text-gray-600 whitespace-nowrap shrink-0">
          Corso:
        </label>
        <select
          id="filterCourse"
          value={course || ''}
          onChange={(e) => {
            onCourseChange(e.target.value)
            onYearChange(null)
          }}
          className={`cursor-pointer px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-laba-primary/30 focus:border-laba-primary ${compact ? 'w-full flex-1' : 'min-w-[160px]'}`}
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
      <div className={`flex items-center gap-1.5 ${compact ? 'w-full' : ''}`}>
        <label htmlFor="filterYear" className="text-xs font-medium text-gray-600 whitespace-nowrap shrink-0">
          Anno:
        </label>
        <select
          id="filterYear"
          value={year?.toString() || ''}
          onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!course}
          className={`cursor-pointer px-3 py-2 rounded-lg text-sm border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-laba-primary/30 focus:border-laba-primary disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed ${compact ? 'w-full flex-1' : 'min-w-[110px]'}`}
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

