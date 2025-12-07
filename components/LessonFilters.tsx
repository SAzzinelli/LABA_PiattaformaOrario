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
    <div className="flex items-center gap-3">
      {/* Filtro Corso */}
      <div className="flex items-center gap-2">
        <label htmlFor="filterCourse" className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
          Corso:
        </label>
        <select
          id="filterCourse"
          value={course || ''}
          onChange={(e) => {
            onCourseChange(e.target.value)
            onYearChange(null) // Reset anno quando cambia corso
          }}
          className="input-modern px-4 py-2 rounded-lg text-sm min-w-[180px]"
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
      <div className="flex items-center gap-2">
        <label htmlFor="filterYear" className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
          Anno:
        </label>
        <select
          id="filterYear"
          value={year?.toString() || ''}
          onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!course}
          className="input-modern px-4 py-2 rounded-lg text-sm min-w-[120px] disabled:bg-gray-100 disabled:cursor-not-allowed"
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

