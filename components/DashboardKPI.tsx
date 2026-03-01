'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
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

const defaultData: KPIData = {
  absences: { today: [], thisWeek: [], todayCount: 0, weekCount: 0 },
  makeupLessons: [],
  makeupCount: 0,
  classroomChanges: [],
  changesCount: 0
}

export default function DashboardKPI() {
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchKPI()
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
        setKpiData(defaultData)
      }
    } catch {
      setKpiData(defaultData)
    } finally {
      setLoading(false)
    }
  }

  const data = kpiData || defaultData

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl bg-white border border-slate-100 p-6 animate-pulse">
            <div className="h-4 bg-slate-200 rounded-lg w-24 mb-4" />
            <div className="h-10 bg-slate-200 rounded-lg w-16 mb-6" />
            <div className="space-y-3">
              <div className="h-3 bg-slate-100 rounded w-full" />
              <div className="h-3 bg-slate-100 rounded w-4/5" />
              <div className="h-3 bg-slate-100 rounded w-3/5" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Assenze */}
      <article className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Assenze</h3>
                <p className="text-xs text-slate-500 mt-0.5">Oggi</p>
              </div>
            </div>
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {data.absences.todayCount}
            </span>
          </div>
        </div>
        <div className="px-6 pb-6 space-y-3 max-h-80 overflow-y-auto">
          {data.absences.today.length > 0 ? (
            data.absences.today.map((absence) => (
              <div key={absence.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <p className="font-medium text-slate-900">{absence.professor}</p>
                {absence.lessons && (
                  <p className="text-sm text-slate-600 mt-1">{absence.lessons.title}</p>
                )}
                {absence.reason && (
                  <p className="text-xs text-slate-500 mt-2 italic">{absence.reason}</p>
                )}
                {absence.lessons && (
                  <p className="text-xs text-slate-400 mt-2">
                    {absence.lessons.classroom} · {absence.lessons.start_time}–{absence.lessons.end_time}
                  </p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">Nessuna assenza comunicata oggi</p>
          )}
        </div>
      </article>

      {/* Recuperi */}
      <article className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Recuperi</h3>
                <p className="text-xs text-slate-500 mt-0.5">Prossimi 7 giorni</p>
              </div>
            </div>
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {data.makeupCount}
            </span>
          </div>
        </div>
        <div className="px-6 pb-6 space-y-3 max-h-80 overflow-y-auto">
          {data.makeupLessons.length > 0 ? (
            data.makeupLessons.map((makeup) => (
              <div key={makeup.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <p className="font-medium text-slate-900">{makeup.title}</p>
                <p className="text-sm text-slate-600 mt-1">{makeup.professor} · {makeup.classroom}</p>
                <p className="text-xs text-slate-500 mt-2">
                  {format(new Date(makeup.scheduled_date), "d MMM", { locale: it })} · {makeup.start_time}–{makeup.end_time}
                </p>
                {makeup.notes && (
                  <p className="text-xs text-slate-400 mt-1 italic">{makeup.notes}</p>
                )}
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">Nessun recupero programmato</p>
          )}
        </div>
      </article>

      {/* Cambi Aula */}
      <article className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Cambi Aula</h3>
                <p className="text-xs text-slate-500 mt-0.5">Oggi</p>
              </div>
            </div>
            <span className="text-3xl font-bold text-slate-900 tabular-nums">
              {data.changesCount}
            </span>
          </div>
        </div>
        <div className="px-6 pb-6 space-y-3 max-h-80 overflow-y-auto">
          {data.classroomChanges.length > 0 ? (
            data.classroomChanges.map((change) => (
              <div key={change.id} className="p-4 rounded-xl bg-slate-50/80 border border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-slate-900">{change.original_classroom}</span>
                  <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span className="font-medium text-slate-900">{change.new_classroom}</span>
                  {change.is_temporary && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">Temporaneo</span>
                  )}
                </div>
                {change.lessons && (
                  <p className="text-sm text-slate-600 mt-1">{change.lessons.title} · {change.lessons.professor}</p>
                )}
                <p className="text-xs text-slate-500 mt-2">
                  {change.start_time}–{change.end_time}
                  {change.reason && ` · ${change.reason}`}
                </p>
              </div>
            ))
          ) : (
            <p className="text-sm text-slate-400 py-6 text-center">Nessun cambio aula oggi</p>
          )}
        </div>
      </article>
    </div>
  )
}
