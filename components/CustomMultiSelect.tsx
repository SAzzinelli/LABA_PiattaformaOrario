'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Option {
  value: string
  label: string
}

interface CustomMultiSelectProps {
  values: string[]
  options: Option[]
  placeholder?: string
  disabled?: boolean
  onChange: (values: string[]) => void
  className?: string
  buttonClassName?: string
  showSelectedCount?: boolean
  showSelectAll?: boolean
  showClear?: boolean
}

export default function CustomMultiSelect({
  values,
  options,
  placeholder = 'Seleziona...',
  disabled = false,
  onChange,
  className = '',
  buttonClassName = '',
  showSelectedCount = true,
  showSelectAll = false,
  showClear = false,
}: CustomMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const selectedOptions = options.filter(opt => values.includes(opt.value))
  const displayText = showSelectedCount
    ? (selectedOptions.length > 0 
        ? selectedOptions.length === 1 
          ? selectedOptions[0].label
          : `${selectedOptions.length} selezionati`
        : placeholder)
    : placeholder // Se showSelectedCount è false, mostra sempre il placeholder

  const allSelected = values.length === options.length && options.length > 0
  const noneSelected = values.length === 0

  const handleSelectAll = () => {
    onChange(options.map(opt => opt.value))
  }

  const handleDeselectAll = () => {
    onChange([])
  }

  const handleInvertSelection = () => {
    const allValues = options.map(opt => opt.value)
    const newValues = allValues.filter(v => !values.includes(v))
    onChange(newValues)
  }

  const handleClear = () => {
    onChange([])
  }

  const handleToggleOption = (optionValue: string) => {
    if (values.includes(optionValue)) {
      onChange(values.filter(v => v !== optionValue))
    } else {
      onChange([...values, optionValue])
    }
  }

  // Calcola posizione quando si apre
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const updatePosition = () => {
        if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect()
          setPosition({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width,
          })
        }
      }
      updatePosition()
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 0)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div ref={dropdownRef} className={`relative ${className}`} style={{ minWidth: '200px', maxWidth: '300px' }}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full text-left text-xs sm:text-sm font-medium whitespace-nowrap ${
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'cursor-pointer'
        } ${buttonClassName || 'input-modern px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg border-2 bg-white hover:border-laba-primary hover-lift'}`}
      >
        <div className="flex items-center justify-between gap-2 min-w-0">
          <span className={`${selectedOptions.length > 0 ? (buttonClassName.includes('text-white') ? 'text-white' : 'text-gray-900') : (buttonClassName.includes('text-white') ? 'text-white opacity-90' : 'text-gray-500')} font-medium truncate`} title={displayText}>
            {displayText}
          </span>
          <svg
            className={`w-3 h-3 sm:w-4 sm:h-4 ${buttonClassName.includes('text-white') ? 'text-white' : 'text-gray-500'} smooth-transition flex-shrink-0 ml-1 sm:ml-2 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && !disabled && typeof window !== 'undefined' && createPortal(
        <>
          {/* Backdrop per chiudere */}
          <div
            className="fixed inset-0 z-[9998]"
            onClick={(e) => {
              if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false)
              }
            }}
          />
          {/* Dropdown menu */}
          <div 
            ref={menuRef}
            className="fixed z-[9999] bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-80 overflow-hidden animate-scale-in hide-scrollbar"
            style={{ 
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${Math.max(position.width, 280)}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Opzioni rapide */}
            {(showSelectAll || showClear) && (
              <div className="border-b border-gray-200 px-2 py-1.5 flex items-center gap-1">
                {showSelectAll && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (allSelected) {
                          handleDeselectAll()
                        } else {
                          handleSelectAll()
                        }
                      }}
                      className="px-2 py-1 text-xs text-laba-primary hover:bg-laba-primary hover:text-white rounded smooth-transition whitespace-nowrap"
                    >
                      {allSelected ? 'Deseleziona tutte' : 'Seleziona tutte'}
                    </button>
                    {!allSelected && !noneSelected && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleInvertSelection()
                        }}
                        className="px-2 py-1 text-xs text-laba-primary hover:bg-laba-primary hover:text-white rounded smooth-transition whitespace-nowrap"
                      >
                        Inverti
                      </button>
                    )}
                  </>
                )}
                {showClear && !noneSelected && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleClear()
                    }}
                    className="ml-auto px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded smooth-transition flex items-center gap-1"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Annulla
                  </button>
                )}
              </div>
            )}
            
            {/* Lista opzioni */}
            <div className="max-h-64 overflow-y-auto hide-scrollbar">
              {options.map((option) => {
                const isSelected = values.includes(option.value)
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleOption(option.value)
                    }}
                    className={`w-full px-4 py-2.5 text-left text-sm smooth-transition flex items-center gap-2 ${
                      isSelected
                        ? 'bg-laba-primary text-white font-medium'
                        : 'text-gray-900 hover:bg-gray-50'
                    }`}
                    title={option.label}
                  >
                    <div className={`w-4 h-4 border-2 rounded flex items-center justify-center flex-shrink-0 ${
                      isSelected 
                        ? 'border-white bg-white' 
                        : 'border-gray-400'
                    }`}>
                      {isSelected && (
                        <svg className="w-3 h-3 text-laba-primary" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className="block truncate flex-1">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

