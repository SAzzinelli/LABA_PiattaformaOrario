'use client'

import { ALL_COURSES, getYearsForCourse, isTriennale, isBiennale } from '@/lib/courses'
import CustomDropdown from './CustomDropdown'

interface LessonFiltersProps {
  course: string
  year: number | null
  onCourseChange: (course: string) => void
  onYearChange: (year: number | null) => void
  onReset: () => void
}

export default function LessonFilters({
  course,
  year,
  onCourseChange,
  onYearChange,
  onReset,
}: LessonFiltersProps) {
  const availableYears = course ? getYearsForCourse(course as any) : []
  const hasActiveFilters = course || year !== null

  // Opzioni corsi
  const courseOptions = [
    { value: '', label: 'Tutti i corsi' },
    ...ALL_COURSES.filter(c => isTriennale(c)).map(c => ({ value: c, label: c })),
    ...ALL_COURSES.filter(c => isBiennale(c)).map(c => ({ value: c, label: c })),
  ]

  // Opzioni anni
  const yearOptions = [
    { value: '', label: 'Tutti gli anni' },
    ...availableYears.map(y => ({ value: y.toString(), label: `${y}° Anno` })),
  ]

  return (
    <div className="flex items-center gap-3 relative z-50">
      {/* Corso */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Corso:
        </label>
        <div className="relative">
          <CustomDropdown
            value={course}
            options={courseOptions}
            placeholder="Tutti i corsi"
            onChange={(value) => {
              onCourseChange(value)
              if (value === '') {
                onYearChange(null)
              }
            }}
          />
        </div>
      </div>

      {/* Anno */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Anno:
        </label>
        <div className="relative">
          <CustomDropdown
            value={year?.toString() || ''}
            options={yearOptions}
            placeholder="Tutti gli anni"
            disabled={!course}
            onChange={(value) => onYearChange(value ? parseInt(value) : null)}
          />
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="btn-modern px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium shadow-md relative overflow-hidden whitespace-nowrap"
        >
          <span className="relative z-10">Reset</span>
        </button>
      )}
    </div>
  )
}
