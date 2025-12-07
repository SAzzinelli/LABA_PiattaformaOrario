'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { it } from 'date-fns/locale'

interface Lesson {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  classroom: string
  professor: string
}

interface Absence {
  id: string
  professor: string
  lesson_id?: string
  date: string
  reason?: string
  is_notified: boolean
  lessons?: Lesson
}

interface MakeupLesson {
  id: string
  original_lesson_id?: string
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
  lesson_id?: string
  original_classroom: string
  new_classroom: string
  change_date: string
  start_time: string
  end_time: string
  reason?: string
  is_temporary: boolean
  lessons?: Lesson
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'absences' | 'makeup' | 'changes'>('absences')
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [absences, setAbsences] = useState<Absence[]>([])
  const [makeupLessons, setMakeupLessons] = useState<MakeupLesson[]>([])
  const [classroomChanges, setClassroomChanges] = useState<ClassroomChange[]>([])
  const [loading, setLoading] = useState(true)

  // Form states
  const [showAbsenceForm, setShowAbsenceForm] = useState(false)
  const [showMakeupForm, setShowMakeupForm] = useState(false)
  const [showChangeForm, setShowChangeForm] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Carica lezioni per i dropdown
      const lessonsRes = await fetch('/api/lessons')
      if (lessonsRes.ok) {
        const lessonsData = await lessonsRes.json()
        setLessons(lessonsData || [])
      }

      // Carica assenze
      const absencesRes = await fetch('/api/admin/absences')
      if (absencesRes.ok) {
        const absencesData = await absencesRes.json()
        setAbsences(absencesData || [])
      }

      // Carica recuperi
      const makeupRes = await fetch('/api/admin/makeup-lessons')
      if (makeupRes.ok) {
        const makeupData = await makeupRes.json()
        setMakeupLessons(makeupData || [])
      }

      // Carica cambi aula
      const changesRes = await fetch('/api/admin/classroom-changes')
      if (changesRes.ok) {
        const changesData = await changesRes.json()
        setClassroomChanges(changesData || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAbsence = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questa assenza?')) return

    try {
      const res = await fetch(`/api/admin/absences?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setAbsences(absences.filter(a => a.id !== id))
      }
    } catch (error) {
      console.error('Error deleting absence:', error)
      alert('Errore nell\'eliminazione')
    }
  }

  const handleDeleteMakeup = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo recupero?')) return

    try {
      const res = await fetch(`/api/admin/makeup-lessons?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setMakeupLessons(makeupLessons.filter(m => m.id !== id))
      }
    } catch (error) {
      console.error('Error deleting makeup:', error)
      alert('Errore nell\'eliminazione')
    }
  }

  const handleDeleteChange = async (id: string) => {
    if (!confirm('Sei sicuro di voler eliminare questo cambio aula?')) return

    try {
      const res = await fetch(`/api/admin/classroom-changes?id=${id}`, { method: 'DELETE' })
      if (res.ok) {
        setClassroomChanges(classroomChanges.filter(c => c.id !== id))
      }
    } catch (error) {
      console.error('Error deleting change:', error)
      alert('Errore nell\'eliminazione')
    }
  }

  if (loading) {
    return <div className="text-center py-8">Caricamento...</div>
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('absences')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'absences'
                ? 'border-red-500 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assenze
          </button>
          <button
            onClick={() => setActiveTab('makeup')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'makeup'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recuperi
          </button>
          <button
            onClick={() => setActiveTab('changes')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'changes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Cambi Aula
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeTab === 'absences' && (
          <AbsencesTab
            absences={absences}
            lessons={lessons}
            onAdd={() => setShowAbsenceForm(true)}
            onDelete={handleDeleteAbsence}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'makeup' && (
          <MakeupTab
            makeupLessons={makeupLessons}
            lessons={lessons}
            onAdd={() => setShowMakeupForm(true)}
            onDelete={handleDeleteMakeup}
            onRefresh={loadData}
          />
        )}
        {activeTab === 'changes' && (
          <ChangesTab
            changes={classroomChanges}
            lessons={lessons}
            onAdd={() => setShowChangeForm(true)}
            onDelete={handleDeleteChange}
            onRefresh={loadData}
          />
        )}
      </div>

      {/* Forms */}
      {showAbsenceForm && (
        <AbsenceForm
          lessons={lessons}
          onClose={() => setShowAbsenceForm(false)}
          onSuccess={() => {
            setShowAbsenceForm(false)
            loadData()
          }}
        />
      )}
      {showMakeupForm && (
        <MakeupForm
          lessons={lessons}
          onClose={() => setShowMakeupForm(false)}
          onSuccess={() => {
            setShowMakeupForm(false)
            loadData()
          }}
        />
      )}
      {showChangeForm && (
        <ChangeForm
          lessons={lessons}
          onClose={() => setShowChangeForm(false)}
          onSuccess={() => {
            setShowChangeForm(false)
            loadData()
          }}
        />
      )}
    </div>
  )
}

// Tab Assenze
function AbsencesTab({ absences, lessons, onAdd, onDelete, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Assenze Professori</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
        >
          + Aggiungi Assenza
        </button>
      </div>
      <div className="space-y-2">
        {absences.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nessuna assenza registrata</p>
        ) : (
          absences.map((absence: Absence) => (
            <div key={absence.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-red-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{absence.professor}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Data: {format(new Date(absence.date), "dd MMM yyyy", { locale: it })}
                  </p>
                  {absence.lessons && (
                    <p className="text-sm text-gray-600">
                      Lezione: {absence.lessons.title} - {absence.lessons.classroom}
                    </p>
                  )}
                  {absence.reason && (
                    <p className="text-sm text-gray-600 mt-1">Motivo: {absence.reason}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(absence.id)}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm"
                >
                  Elimina
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Tab Recuperi
function MakeupTab({ makeupLessons, lessons, onAdd, onDelete, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Recuperi Programmati</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
        >
          + Aggiungi Recupero
        </button>
      </div>
      <div className="space-y-2">
        {makeupLessons.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nessun recupero programmato</p>
        ) : (
          makeupLessons.map((makeup: MakeupLesson) => (
            <div key={makeup.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{makeup.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(makeup.scheduled_date), "dd MMM yyyy", { locale: it })} - {makeup.start_time} / {makeup.end_time}
                  </p>
                  <p className="text-sm text-gray-600">
                    {makeup.professor} - Aula {makeup.classroom}
                  </p>
                  {makeup.group_name && (
                    <p className="text-sm text-gray-500">Gruppo {makeup.group_name}</p>
                  )}
                </div>
                <button
                  onClick={() => onDelete(makeup.id)}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm"
                >
                  Elimina
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Tab Cambi Aula
function ChangesTab({ changes, lessons, onAdd, onDelete, onRefresh }: any) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Cambi Aula</h2>
        <button
          onClick={onAdd}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          + Aggiungi Cambio
        </button>
      </div>
      <div className="space-y-2">
        {changes.length === 0 ? (
          <p className="text-gray-500 text-center py-8">Nessun cambio aula registrato</p>
        ) : (
          changes.map((change: ClassroomChange) => (
            <div key={change.id} className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">{change.original_classroom}</span>
                    <span>→</span>
                    <span className="font-semibold text-gray-900">{change.new_classroom}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {format(new Date(change.change_date), "dd MMM yyyy", { locale: it })} - {change.start_time} / {change.end_time}
                  </p>
                  {change.lessons && (
                    <p className="text-sm text-gray-600">
                      {change.lessons.title} - {change.lessons.professor}
                    </p>
                  )}
                  {change.reason && (
                    <p className="text-sm text-gray-600 mt-1">Motivo: {change.reason}</p>
                  )}
                  {change.is_temporary && (
                    <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                      Temporaneo
                    </span>
                  )}
                </div>
                <button
                  onClick={() => onDelete(change.id)}
                  className="ml-4 text-red-600 hover:text-red-800 text-sm"
                >
                  Elimina
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Form Assenza
function AbsenceForm({ lessons, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    professor: '',
    lesson_id: '',
    date: new Date().toISOString().split('T')[0],
    reason: '',
    is_notified: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/absences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Errore nella creazione')
      }
    } catch (error) {
      console.error('Error creating absence:', error)
      alert('Errore nella creazione')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">Nuova Assenza</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professore *</label>
            <input
              type="text"
              required
              value={formData.professor}
              onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lezione (opzionale)</label>
            <select
              value={formData.lesson_id}
              onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="">Seleziona lezione</option>
              {lessons.map((lesson: Lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title} - {lesson.professor} ({lesson.classroom})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              rows={3}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_notified}
              onChange={(e) => setFormData({ ...formData, is_notified: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Notificato</label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Form Recupero
function MakeupForm({ lessons, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    original_lesson_id: '',
    title: '',
    professor: '',
    classroom: '',
    scheduled_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    group_name: '',
    course: '',
    year: '',
    notes: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/makeup-lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year: formData.year ? parseInt(formData.year) : null
        })
      })
      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Errore nella creazione')
      }
    } catch (error) {
      console.error('Error creating makeup:', error)
      alert('Errore nella creazione')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold mb-4">Nuovo Recupero</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Titolo *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Professore *</label>
            <input
              type="text"
              required
              value={formData.professor}
              onChange={(e) => setFormData({ ...formData, professor: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aula *</label>
            <input
              type="text"
              required
              value={formData.classroom}
              onChange={(e) => setFormData({ ...formData, classroom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora Inizio *</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ora Fine *</label>
            <input
              type="time"
              required
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gruppo</label>
              <input
                type="text"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anno</label>
              <input
                type="number"
                min="1"
                max="3"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corso</label>
            <input
              type="text"
              value={formData.course}
              onChange={(e) => setFormData({ ...formData, course: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              rows={3}
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Form Cambio Aula
function ChangeForm({ lessons, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    lesson_id: '',
    original_classroom: '',
    new_classroom: '',
    change_date: new Date().toISOString().split('T')[0],
    start_time: '',
    end_time: '',
    reason: '',
    is_temporary: true
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/admin/classroom-changes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        onSuccess()
      } else {
        const error = await res.json()
        alert(error.error || 'Errore nella creazione')
      }
    } catch (error) {
      console.error('Error creating change:', error)
      alert('Errore nella creazione')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h3 className="text-lg font-bold mb-4">Nuovo Cambio Aula</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Aula Originale *</label>
            <input
              type="text"
              required
              value={formData.original_classroom}
              onChange={(e) => setFormData({ ...formData, original_classroom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nuova Aula *</label>
            <input
              type="text"
              required
              value={formData.new_classroom}
              onChange={(e) => setFormData({ ...formData, new_classroom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
            <input
              type="date"
              required
              value={formData.change_date}
              onChange={(e) => setFormData({ ...formData, change_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora Inizio *</label>
              <input
                type="time"
                required
                value={formData.start_time}
                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ora Fine *</label>
              <input
                type="time"
                required
                value={formData.end_time}
                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lezione (opzionale)</label>
            <select
              value={formData.lesson_id}
              onChange={(e) => setFormData({ ...formData, lesson_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Seleziona lezione</option>
              {lessons.map((lesson: Lesson) => (
                <option key={lesson.id} value={lesson.id}>
                  {lesson.title} - {lesson.professor} ({lesson.classroom})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivo</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_temporary}
              onChange={(e) => setFormData({ ...formData, is_temporary: e.target.checked })}
              className="mr-2"
            />
            <label className="text-sm text-gray-700">Temporaneo</label>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Salva
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

