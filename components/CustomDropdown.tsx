'use client'

import { useState, useRef, useEffect } from 'react'

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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const selectedOption = options.find(opt => opt.value === value)

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

      {isOpen && !disabled && buttonRef.current && (
        <div 
          className="absolute z-[9999] mt-2 w-full bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto animate-scale-in"
          style={{ 
            width: buttonRef.current.offsetWidth,
            top: '100%',
            left: 0,
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
      )}
    </div>
  )
}

