'use client'

type ViewType = 'day' | 'week' | 'month' | 'year'

interface ViewSelectorProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
}

export default function ViewSelector({ view, onViewChange }: ViewSelectorProps) {
  const views: { value: ViewType; label: string }[] = [
    { value: 'day', label: 'Giorno' },
    { value: 'week', label: 'Settimana' },
    { value: 'month', label: 'Mese' },
    { value: 'year', label: 'Anno' },
  ]

  return (
    <div className="flex gap-2 bg-white rounded-lg p-1 shadow-sm">
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onViewChange(v.value)}
          className={`px-4 py-2 rounded transition-colors ${
            view === v.value
              ? 'bg-laba-primary text-white font-semibold'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

