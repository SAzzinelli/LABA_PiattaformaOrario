'use client'

type ViewType = 'day' | 'week'

interface ViewSelectorProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
}

export default function ViewSelector({ view, onViewChange }: ViewSelectorProps) {
  const views: { value: ViewType; label: string }[] = [
    { value: 'day', label: 'Giorno' },
    { value: 'week', label: 'Settimana' },
  ]

  return (
    <div className="flex gap-2 bg-white rounded-full p-1 shadow-sm">
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onViewChange(v.value)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            view === v.value
              ? 'bg-laba-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:scale-105 active:scale-95'
          }`}
        >
          {v.label}
        </button>
      ))}
    </div>
  )
}

