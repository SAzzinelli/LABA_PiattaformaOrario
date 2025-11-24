'use client'

import { useState } from 'react'
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
  const [isOpen, setIsOpen] = useState(false)
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
    <div className="mb-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-laba-primary text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md border border-gray-200"
        >
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span>Filtri</span>
          {hasActiveFilters && (
            <span className="ml-1 px-2 py-0.5 bg-laba-primary text-white text-xs rounded-full">
              {[course && '1', year !== null && '1'].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-all duration-200 hover:bg-gray-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          >
            Reset Filtri
          </button>
        )}
      </div>

      {isOpen && (
        <div className="mt-3 bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Corso
              </label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Anno
              </label>
              <CustomDropdown
                value={year?.toString() || ''}
                options={yearOptions}
                placeholder="Tutti gli anni"
                disabled={!course}
                onChange={(value) => onYearChange(value ? parseInt(value) : null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
