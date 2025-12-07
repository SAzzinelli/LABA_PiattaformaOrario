'use client'

import { Location, getLocationName } from '@/lib/locations'

interface LocationSelectorProps {
  selectedLocation: Location
  onLocationChange: (location: Location) => void
}

export default function LocationSelector({ selectedLocation, onLocationChange }: LocationSelectorProps) {
  return (
    <div className="flex items-center gap-3 mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Sede:
      </label>
      <div className="flex gap-2 flex-1">
        <button
          onClick={() => onLocationChange('badia-ripoli')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            selectedLocation === 'badia-ripoli'
              ? 'bg-laba-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Piazza di Badia a Ripoli
        </button>
        <button
          onClick={() => onLocationChange('via-vecchietti')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all ${
            selectedLocation === 'via-vecchietti'
              ? 'bg-laba-primary text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Via de Vecchietti
        </button>
      </div>
    </div>
  )
}

