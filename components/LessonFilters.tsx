'use client'

import { useState } from 'react'
import { ALL_COURSES, getYearsForCourse, isTriennale, isBiennale } from '@/lib/courses'
import { Location, getCoursesForLocation } from '@/lib/locations'
import CustomDropdown from './CustomDropdown'

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
      {/* Filtro Corso */}
      <div className="flex-shrink-0">
        <CustomDropdown
          label="Corso"
          value={course || ''}
          options={courseOptions.map(c => ({ value: c, label: c === 'Graphic Design & Multimedia' ? 'Graphic Design' : c }))}
          onChange={(value) => {
            onCourseChange(value)
            onYearChange(null) // Reset anno quando cambia corso
          }}
          placeholder="Tutti i corsi"
        />
      </div>

      {/* Filtro Anno */}
      <div className="flex-shrink-0">
        <CustomDropdown
          label="Anno"
          value={year?.toString() || ''}
          options={availableYears.map(y => ({ value: y.toString(), label: `${y}° Anno` }))}
          onChange={(value) => onYearChange(value ? parseInt(value) : null)}
          placeholder="Tutti gli anni"
          disabled={!course}
        />
      </div>

      {/* Reset */}
      <button
        onClick={onReset}
        className="btn-modern px-4 py-2.5 rounded-full border-2 border-gray-300 text-gray-700 text-sm font-medium hover:border-gray-400 transition-colors whitespace-nowrap"
      >
        Reset
      </button>
    </div>
  )
}

