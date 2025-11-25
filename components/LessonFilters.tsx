'use client'

import { ALL_COURSES, getYearsForCourse, isTriennale, isBiennale } from '@/lib/courses'
import CustomMultiSelect from './CustomMultiSelect'

interface LessonFiltersProps {
  courses: string[]
  years: number[]
  onCoursesChange: (courses: string[]) => void
  onYearsChange: (years: number[]) => void
  onReset: () => void
}

export default function LessonFilters({
  courses,
  years,
  onCoursesChange,
  onYearsChange,
  onReset,
}: LessonFiltersProps) {
  // Ottieni tutti gli anni disponibili per i corsi selezionati
  const allAvailableYears = new Set<number>()
  if (courses.length > 0) {
    courses.forEach(course => {
      const yearsForCourse = getYearsForCourse(course as any)
      yearsForCourse.forEach(year => allAvailableYears.add(year))
    })
  } else {
    // Se nessun corso è selezionato, mostra tutti gli anni possibili
    ALL_COURSES.forEach(course => {
      const yearsForCourse = getYearsForCourse(course as any)
      yearsForCourse.forEach(year => allAvailableYears.add(year))
    })
  }
  const availableYears = Array.from(allAvailableYears).sort()

  const hasActiveFilters = courses.length > 0 || years.length > 0

  // Opzioni corsi
  const courseOptions = [
    ...ALL_COURSES.filter(c => isTriennale(c)).map(c => ({ 
      value: c, 
      label: c === 'Graphic Design & Multimedia' ? 'Graphic Design' : c 
    })),
    ...ALL_COURSES.filter(c => isBiennale(c)).map(c => ({ 
      value: c, 
      label: c === 'Graphic Design & Multimedia' ? 'Graphic Design' : c 
    })),
  ]

  // Opzioni anni
  const yearOptions = availableYears.map(y => ({ 
    value: y.toString(), 
    label: `${y}° Anno` 
  }))

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
      {/* Corsi */}
      <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
          Corso:
        </label>
        <div className="flex-1 sm:flex-initial min-w-0">
          <CustomMultiSelect
            values={courses}
            options={courseOptions}
            placeholder="Tutti i corsi"
            onChange={(selectedCourses) => {
              onCoursesChange(selectedCourses)
              // Se vengono deselezionati tutti i corsi, resetta anche gli anni
              if (selectedCourses.length === 0) {
                onYearsChange([])
              }
            }}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Anni */}
      <div className="flex items-center gap-2 flex-1 sm:flex-initial min-w-0">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">
          Anno:
        </label>
        <div className="flex-1 sm:flex-initial min-w-0">
          <CustomMultiSelect
            values={years.map(y => y.toString())}
            options={yearOptions}
            placeholder="Tutti gli anni"
            disabled={courses.length === 0}
            onChange={(selectedYears) => {
              onYearsChange(selectedYears.map(y => parseInt(y)))
            }}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* Reset */}
      {hasActiveFilters && (
        <button
          onClick={onReset}
          className="btn-modern px-4 py-2 rounded-full bg-gray-200 text-gray-700 text-sm font-medium shadow-md relative overflow-hidden whitespace-nowrap w-full sm:w-auto"
        >
          <span className="relative z-10">Reset</span>
        </button>
      )}
    </div>
  )
}
