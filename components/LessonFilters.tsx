'use client'

import { useState } from 'react'
import { ALL_COURSES, getYearsForCourse } from '@/lib/courses'
import { Location, getCoursesForLocation } from '@/lib/locations'

interface LessonFiltersProps {
  course: string
  year: number | null
  location: Location
  hiddenClassrooms: string[]
  availableClassrooms: string[]
  onCourseChange: (course: string) => void
  onYearChange: (year: number | null) => void
  onHiddenClassroomsChange: (classrooms: string[]) => void
  onReset: () => void
}

export default function LessonFilters({
  course,
  year,
  location,
  hiddenClassrooms,
  availableClassrooms,
  onCourseChange,
  onYearChange,
  onHiddenClassroomsChange,
  onReset,
}: LessonFiltersProps) {
  const [showClassroomFilter, setShowClassroomFilter] = useState(false)
  const [showCourseFilter, setShowCourseFilter] = useState(false)
  const [showYearFilter, setShowYearFilter] = useState(false)
  // Filtra i corsi disponibili per la sede selezionata
  const availableCourses = getCoursesForLocation(location)
  const courseOptions = ALL_COURSES.filter(c => availableCourses.includes(c))

  // Se un corso non è disponibile nella sede corrente, resettalo
  if (course && !availableCourses.includes(course)) {
    onCourseChange('')
  }

  const availableYears = course ? getYearsForCourse(course as any) : []

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-wrap w-full sm:w-auto">
      {/* Filtro Corso - Dropdown Stile Aule */}
      <div className="flex items-center gap-1.5 flex-1 sm:flex-initial relative">
        <label htmlFor="filterCourse" className="text-xs font-medium text-gray-600 whitespace-nowrap">
          Corso:
        </label>
        <div className="relative flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => setShowCourseFilter(!showCourseFilter)}
            className="px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:min-w-[140px] md:min-w-[160px] text-left flex items-center justify-between"
          >
            <span>
              {course 
                ? (course === 'Graphic Design & Multimedia' ? 'Graphic Design' : course)
                : 'Tutti i corsi'}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${showCourseFilter ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showCourseFilter && (
            <>
              <div 
                className="fixed inset-0 z-[40]" 
                onClick={() => setShowCourseFilter(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-[50] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto min-w-full">
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onCourseChange('')
                      onYearChange(null)
                      setShowCourseFilter(false)
                    }}
                    className={`w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs md:text-sm ${
                      !course ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Tutti i corsi
                  </button>
                  {courseOptions.map((c) => {
                    const isSelected = course === c
                    const displayName = c === 'Graphic Design & Multimedia' ? 'Graphic Design' : c
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          onCourseChange(c)
                          onYearChange(null) // Reset anno quando cambia corso
                          setShowCourseFilter(false)
                        }}
                        className={`w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs md:text-sm ${
                          isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {displayName}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filtro Anno - Dropdown Stile Aule */}
      <div className="flex items-center gap-1.5 flex-1 sm:flex-initial relative">
        <label htmlFor="filterYear" className="text-xs font-medium text-gray-600 whitespace-nowrap">
          Anno:
        </label>
        <div className="relative flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => !course || setShowYearFilter(!showYearFilter)}
            disabled={!course}
            className="px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed w-full sm:min-w-[100px] md:min-w-[110px] text-left flex items-center justify-between"
          >
            <span>
              {year ? `${year}° Anno` : 'Tutti gli anni'}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${showYearFilter ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showYearFilter && course && (
            <>
              <div 
                className="fixed inset-0 z-[40]" 
                onClick={() => setShowYearFilter(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-[50] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto min-w-full">
                <div className="p-2 space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      onYearChange(null)
                      setShowYearFilter(false)
                    }}
                    className={`w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs md:text-sm ${
                      !year ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    Tutti gli anni
                  </button>
                  {availableYears.map((y) => {
                    const isSelected = year === y
                    return (
                      <button
                        key={y}
                        type="button"
                        onClick={() => {
                          onYearChange(y)
                          setShowYearFilter(false)
                        }}
                        className={`w-full text-left px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs md:text-sm ${
                          isSelected ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                      >
                        {y}° Anno
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Filtro Aule - Selezione Multipla */}
      <div className="flex items-center gap-1.5 flex-1 sm:flex-initial relative">
        <label htmlFor="filterClassrooms" className="text-xs font-medium text-gray-600 whitespace-nowrap">
          Aule:
        </label>
        <div className="relative flex-1 sm:flex-initial">
          <button
            type="button"
            onClick={() => setShowClassroomFilter(!showClassroomFilter)}
            className="px-2 md:px-3 py-1.5 rounded-md text-xs md:text-sm border border-gray-300 bg-white text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:min-w-[160px] md:min-w-[180px] text-left flex items-center justify-between"
          >
            <span>
              {hiddenClassrooms.length === 0 
                ? 'Tutte le aule' 
                : `${availableClassrooms.length - hiddenClassrooms.length} / ${availableClassrooms.length}`}
            </span>
            <svg 
              className={`w-4 h-4 transition-transform ${showClassroomFilter ? 'rotate-180' : ''}`}
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {showClassroomFilter && (
            <>
              <div 
                className="fixed inset-0 z-[40]" 
                onClick={() => setShowClassroomFilter(false)}
              />
              <div className="absolute top-full left-0 mt-1 z-[50] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto min-w-full">
                <div className="p-2 space-y-1">
                  {availableClassrooms.map((classroom) => {
                    const isHidden = hiddenClassrooms.includes(classroom)
                    return (
                      <label
                        key={classroom}
                        className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 rounded cursor-pointer text-xs md:text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={!isHidden}
                          onChange={(e) => {
                            if (e.target.checked) {
                              onHiddenClassroomsChange(hiddenClassrooms.filter(c => c !== classroom))
                            } else {
                              onHiddenClassroomsChange([...hiddenClassrooms, classroom])
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className={isHidden ? 'text-gray-400 line-through' : 'text-gray-700'}>
                          {classroom}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

