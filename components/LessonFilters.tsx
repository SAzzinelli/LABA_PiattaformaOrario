'use client'

import { ALL_COURSES, getYearsForCourse, isTriennale, isBiennale } from '@/lib/courses'

interface LessonFiltersProps {
  course: string
  year: number | null
  group: string
  onCourseChange: (course: string) => void
  onYearChange: (year: number | null) => void
  onGroupChange: (group: string) => void
  onReset: () => void
}

export default function LessonFilters({
  course,
  year,
  group,
  onCourseChange,
  onYearChange,
  onGroupChange,
  onReset,
}: LessonFiltersProps) {
  const availableYears = course ? getYearsForCourse(course as any) : []
  const hasActiveFilters = course || year !== null || group

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 border border-gray-200">
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Corso
          </label>
          <select
            value={course}
            onChange={(e) => {
              onCourseChange(e.target.value)
              onYearChange(null) // Reset anno quando cambia corso
            }}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-laba-primary focus:border-laba-primary transition-all duration-200 text-sm"
          >
            <option value="">Tutti i corsi</option>
            <optgroup label="Triennali">
              {ALL_COURSES.filter(c => isTriennale(c)).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
            <optgroup label="Biennali">
              {ALL_COURSES.filter(c => isBiennale(c)).map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Anno
          </label>
          <select
            value={year || ''}
            onChange={(e) => onYearChange(e.target.value ? parseInt(e.target.value) : null)}
            disabled={!course}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-laba-primary focus:border-laba-primary transition-all duration-200 text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            <option value="">Tutti gli anni</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>
                {y}° Anno
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gruppo
          </label>
          <input
            type="text"
            value={group}
            onChange={(e) => onGroupChange(e.target.value)}
            placeholder="Filtra per gruppo"
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-laba-primary focus:border-laba-primary transition-all duration-200 text-sm"
          />
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium transition-all duration-200 hover:bg-gray-300 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
          >
            Reset Filtri
          </button>
        )}
      </div>
    </div>
  )
}

