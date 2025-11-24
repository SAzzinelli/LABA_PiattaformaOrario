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
    <div className="mb-2 animate-fade-in relative">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-modern flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-laba-primary text-sm font-medium shadow-md border border-gray-200 relative overflow-hidden"
        >
          <svg
            className={`w-4 h-4 smooth-transition ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="relative z-10">Filtri</span>
          {hasActiveFilters && (
            <span className="ml-1 px-2.5 py-0.5 bg-laba-primary text-white text-xs rounded-full relative z-10">
              {[course && '1', year !== null && '1'].filter(Boolean).length}
            </span>
          )}
        </button>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="btn-modern px-5 py-2.5 rounded-full bg-gray-200 text-gray-700 text-sm font-medium shadow-md relative overflow-hidden"
          >
            <span className="relative z-10">Reset Filtri</span>
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 card-modern p-5 animate-slide-in z-50 min-w-[400px]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
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
              <label className="block text-sm font-semibold text-gray-700 mb-2.5">
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
