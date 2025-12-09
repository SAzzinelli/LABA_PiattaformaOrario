'use client'

type ViewType = 'calendar' | 'list'

interface ViewSelectorProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
}

export default function ViewSelector({ view, onViewChange }: ViewSelectorProps) {
  const views: { value: ViewType; label: string; icon: JSX.Element }[] = [
    { 
      value: 'calendar', 
      label: 'Calendario',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    },
    { 
      value: 'list', 
      label: 'Lista',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      )
    },
  ]

  return (
    <div className="flex gap-2 bg-white rounded-full p-1 shadow-sm">
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onViewChange(v.value)}
          className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 flex items-center gap-1.5 sm:gap-2 ${
            view === v.value
              ? 'bg-laba-primary text-white shadow-sm'
              : 'text-gray-700 hover:bg-gray-100 hover:scale-105 active:scale-95'
          }`}
        >
          {v.icon}
          <span className="hidden sm:inline">{v.label}</span>
        </button>
      ))}
    </div>
  )
}

