'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Option {
  value: string
  label: string
}

interface CustomDropdownProps {
  value: string
  options: Option[]
  placeholder?: string
  disabled?: boolean
  onChange: (value: string) => void
  className?: string
}

export default function CustomDropdown({
  value,
  options,
  placeholder = 'Seleziona...',
  disabled = false,
  onChange,
  className = '',
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
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
        className={`input-modern w-full px-4 py-2.5 rounded-lg border-2 bg-white text-left text-sm font-medium ${
          disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'hover:border-laba-primary cursor-pointer hover-lift'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`${selectedOption ? 'text-gray-900 font-medium' : 'text-gray-500'} truncate whitespace-nowrap`} title={selectedOption ? selectedOption.label : placeholder}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          <svg
            className={`w-4 h-4 text-gray-500 smooth-transition flex-shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
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
            onClick={() => setIsOpen(false)}
          />
          {/* Dropdown menu */}
          <div 
            className="fixed z-[9999] bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto animate-scale-in"
            style={{ 
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: `${position.width}px`,
            }}
          >
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full px-4 py-2.5 text-left text-sm smooth-transition ${
                  value === option.value
                    ? 'bg-laba-primary text-white font-medium'
                    : 'text-gray-900 hover:bg-gray-50'
                }`}
                title={option.label}
              >
                <span className="block truncate">{option.label}</span>
              </button>
            ))}
          </div>
        </>,
        document.body
      )}
    </div>
  )
}

