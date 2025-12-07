'use client'

import { useEffect, useState } from 'react'
import { format, parseISO } from 'date-fns'
import { it } from 'date-fns/locale'

interface Absence {
  id: string
  professor: string
  date: string
  reason?: string
  is_notified: boolean
  lessons?: {
    title: string
    start_time: string
    end_time: string
    classroom: string
  }
}

interface MakeupLesson {
  id: string
  title: string
  professor: string
  classroom: string
  scheduled_date: string
  start_time: string
  end_time: string
  group_name?: string
  course?: string
  year?: number
  notes?: string
}

interface ClassroomChange {
  id: string
  original_classroom: string
  new_classroom: string
  change_date: string
  start_time: string
  end_time: string
  reason?: string
  is_temporary: boolean
  lessons?: {
    title: string
    professor: string
  }
}

interface KPIData {
  absences: {
    today: Absence[]
    thisWeek: Absence[]
    todayCount: number
    weekCount: number
  }
  makeupLessons: MakeupLesson[]
  makeupCount: number
  classroomChanges: ClassroomChange[]
  changesCount: number
}

export default function DashboardKPI() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPI()
    // Aggiorna ogni 5 minuti
    const interval = setInterval(fetchKPI, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchKPI = async () => {
    try {
      const response = await fetch('/api/dashboard/kpi')
      if (response.ok) {
        const data = await response.json()
        setKpiData(data)
      } else {
        // Anche se l'API restituisce errore, prova a parsare i dati
        try {
          const errorData = await response.json()
          console.error('KPI API returned error:', response.status, errorData)
        } catch (e) {
          console.error('KPI API returned error:', response.status)
        }
        // Imposta dati vuoti se l'API fallisce
        setKpiData({
          absences: { today: [], thisWeek: [], todayCount: 0, weekCount: 0 },
          makeupLessons: [],
          makeupCount: 0,
          classroomChanges: [],
          changesCount: 0
        })
      }
    } catch (error) {
      console.error('Error fetching KPI:', error)
      // Imposta dati vuoti in caso di errore
      setKpiData({
        absences: { today: [], thisWeek: [], todayCount: 0, weekCount: 0 },
        makeupLessons: [],
        makeupCount: 0,
        classroomChanges: [],
        changesCount: 0
      })
    } finally {
      setLoading(false)
    }
  }

  // Valori di default per mostrare sempre le card
  const defaultData: KPIData = {
    absences: { today: [], thisWeek: [], todayCount: 0, weekCount: 0 },
    makeupLessons: [],
    makeupCount: 0,
    classroomChanges: [],
    changesCount: 0
  }

  const displayData = kpiData || defaultData

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-3"></div>
            <div className="h-6 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* KPI Assenze - Rosso */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-t-4 border-red-500">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-gray-900">Assenze</h3>
                <p className="text-xs text-gray-500">Oggi</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {displayData.absences.todayCount}
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {displayData.absences.today.length > 0 ? (
              displayData.absences.today.map((absence) => (
                <div key={absence.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-1">
                    {absence.professor}
                  </h4>
                  {absence.lessons && (
                    <p className="text-xs text-gray-700 mb-1">
                      <span className="font-medium">Lezione:</span> {absence.lessons.title}
                    </p>
                  )}
                  {absence.reason && (
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Motivo:</span> {absence.reason}
                    </p>
                  )}
                  {absence.lessons && (
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span>Aula {absence.lessons.classroom}</span>
                      <span>•</span>
                      <span>{absence.lessons.start_time} - {absence.lessons.end_time}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-2">Nessuna assenza comunicata oggi</p>
            )}
        </div>
      </div>

      {/* KPI Recuperi - Verde */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-t-4 border-green-500">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-gray-900">Recuperi</h3>
                <p className="text-xs text-gray-500">Prossimi 7 giorni</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {displayData.makeupCount}
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {displayData.makeupLessons.length > 0 ? (
              displayData.makeupLessons.map((makeup) => (
                <div key={makeup.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">
                    {makeup.title}
                  </h4>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">Professore:</span> {makeup.professor}
                    </p>
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">Aula:</span> {makeup.classroom}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-600 mt-2">
                      <span>{format(new Date(makeup.scheduled_date), "dd MMM yyyy", { locale: it })}</span>
                      <span>•</span>
                      <span>{makeup.start_time} - {makeup.end_time}</span>
                    </div>
                    {makeup.group_name && (
                      <p className="text-xs text-gray-500 mt-1">
                        Gruppo {makeup.group_name}
                      </p>
                    )}
                    {makeup.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">
                        {makeup.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-2">Nessun recupero programmato</p>
            )}
        </div>
      </div>

      {/* KPI Cambi Aula - Blu */}
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden border-t-4 border-blue-500">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-gray-900">Cambi Aula</h3>
                <p className="text-xs text-gray-500">Oggi</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {displayData.changesCount}
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
            {displayData.classroomChanges.length > 0 ? (
              displayData.classroomChanges.map((change) => (
                <div key={change.id} className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900">{change.original_classroom}</span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-sm font-semibold text-gray-900">{change.new_classroom}</span>
                  </div>
                  {change.lessons && (
                    <p className="text-xs text-gray-700 mb-1">
                      <span className="font-medium">Lezione:</span> {change.lessons.title} - {change.lessons.professor}
                    </p>
                  )}
                  {change.reason && (
                    <p className="text-xs text-gray-600 mb-1">
                      <span className="font-medium">Motivo:</span> {change.reason}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>{change.start_time} - {change.end_time}</span>
                    {change.is_temporary && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600">Temporaneo</span>
                      </>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-2">Nessun cambio aula oggi</p>
            )}
        </div>
      </div>
    </div>
  )
}

