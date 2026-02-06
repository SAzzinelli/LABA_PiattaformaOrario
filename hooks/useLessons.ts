import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface Lesson {
  id: string
  title: string
  startTime: string
  endTime: string
  dayOfWeek: number
  classroom: string
  professor: string
  course?: string
  year?: number
  group?: string
  notes?: string
}

export function useLessons(initialLessons: Lesson[] = []) {
  const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
  const [loading, setLoading] = useState(initialLessons.length === 0)
  const [filterCourses, setFilterCourses] = useState<string[]>([])
  const [filterYears, setFilterYears] = useState<number[]>([])

  const loadLessons = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filterCourses.length > 0) {
        filterCourses.forEach(course => params.append('course', course))
      }
      if (filterYears.length > 0) {
        filterYears.forEach(year => params.append('year', year.toString()))
      }

      const res = await fetch(`/api/lessons?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch lessons')

      const data = await res.json()
      setLessons(data)
    } catch (error) {
      console.error('Error loading lessons:', error)
      toast.error('Errore nel caricamento delle lezioni')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLessons()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load when filters change; loadLessons is stable
  }, [filterCourses, filterYears])

  const deleteLesson = async (id: string) => {
    try {
      const res = await fetch(`/api/lessons/${id}`, { method: 'DELETE' })
      if (res.ok) {
        toast.success('Lezione eliminata con successo')
        loadLessons()
        return true
      } else {
        throw new Error('Failed to delete')
      }
    } catch (error) {
      console.error('Error deleting lesson:', error)
      toast.error('Errore durante l\'eliminazione')
      return false
    }
  }

  return {
    lessons,
    loading,
    filterCourses,
    setFilterCourses,
    filterYears,
    setFilterYears,
    refreshLessons: loadLessons,
    deleteLesson
  }
}
