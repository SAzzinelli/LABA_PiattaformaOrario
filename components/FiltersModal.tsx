'use client'

import { ALL_COURSES, getYearsForCourse, isTriennale, isBiennale } from '@/lib/courses'
import CustomDropdown from './CustomDropdown'

interface FiltersModalProps {
  isOpen: boolean
  onClose: () => void
  course: string
  year: number | null
  onCourseChange: (course: string) => void
  onYearChange: (year: number | null) => void
  onReset: () => void
}

export default function FiltersModal({
  isOpen,
  onClose,
  course,
  year,
  onCourseChange,
  onYearChange,
  onReset,
}: FiltersModalProps) {
  const availableYears = course ? getYearsForCourse(course as any) : []
  const hasActiveFilters = course || year !== null

  // Opzioni corsi
  const courseOptions = [
    { value: '', label: 'Tutti i corsi' },
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
  const yearOptions = [
    { value: '', label: 'Tutti gli anni' },
    ...availableYears.map(y => ({ value: y.toString(), label: `${y}° Anno` })),
  ]

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop blurrato */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-lg z-[100] animate-fade-in"
        onClick={onClose}
      />
      
      {/* Overlay contenuto */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-scale-in pointer-events-none">
        <div 
          className="card-modern w-full max-w-md overflow-hidden pointer-events-auto shadow-2xl bg-white rounded-xl"
          style={{ borderRadius: '12px', overflow: 'hidden' }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-laba-primary text-white p-4 flex items-center justify-between rounded-t-xl" style={{ borderRadius: '12px 12px 0 0' }}>
            <h2 className="text-xl font-bold">Filtri</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-white hover:bg-white hover:bg-opacity-20 smooth-transition flex items-center justify-center text-2xl"
            >
              ×
            </button>
          </div>

          {/* Contenuto */}
          <div className="p-6 space-y-6">
            {/* Corso */}
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

            {/* Anno */}
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

            {/* Reset */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    onReset()
                    onClose()
                  }}
                  className="btn-modern w-full px-4 py-2.5 rounded-full bg-gray-200 text-gray-700 text-sm font-medium shadow-md relative overflow-hidden"
                >
                  <span className="relative z-10">Reset Filtri</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

