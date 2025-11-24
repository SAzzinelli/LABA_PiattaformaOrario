'use client'

interface Lesson {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  classroom: string
  professor: string
  group?: string
  notes?: string
}

interface LessonCardProps {
  lesson: Lesson
  compact?: boolean
  onEdit?: (lesson: Lesson) => void
  onDelete?: (id: string) => void
}

export default function LessonCard({ lesson, compact = false, onEdit, onDelete }: LessonCardProps) {
  if (compact) {
    return (
      <div
        className={`bg-blue-50 border-l-4 border-laba-primary p-2 rounded cursor-pointer hover:bg-blue-100 transition-colors ${
          onEdit ? '' : 'cursor-default'
        }`}
        onClick={() => onEdit && onEdit(lesson)}
      >
        <div className="text-xs font-semibold text-laba-primary">
          {lesson.startTime} - {lesson.endTime}
        </div>
        <div className="text-sm font-bold text-gray-800 truncate">{lesson.title}</div>
        <div className="text-xs text-gray-600 truncate">{lesson.professor}</div>
        <div className="text-xs text-gray-500 truncate">{lesson.classroom}</div>
        {lesson.group && (
          <div className="text-xs text-gray-500">Gruppo: {lesson.group}</div>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-laba-primary bg-blue-50 px-2 py-1 rounded">
              {lesson.startTime} - {lesson.endTime}
            </span>
            {lesson.group && (
              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                Gruppo: {lesson.group}
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">{lesson.title}</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Professore:</span>
              <span>{lesson.professor}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">Aula:</span>
              <span>{lesson.classroom}</span>
            </div>
            {lesson.notes && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <span className="font-semibold">Note:</span>
                <p className="text-gray-700 mt-1">{lesson.notes}</p>
              </div>
            )}
          </div>
        </div>
        {onEdit && (
          <div className="flex gap-2 ml-4">
            <button
              onClick={() => onEdit(lesson)}
              className="px-3 py-1 bg-laba-primary text-white text-sm rounded hover:bg-opacity-90"
            >
              Modifica
            </button>
            {onDelete && (
              <button
                onClick={() => onDelete(lesson.id)}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
              >
                Elimina
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

