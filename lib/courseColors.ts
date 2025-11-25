import { ALL_COURSES, Course } from './courses'

// Mappa colori per i corsi
export const COURSE_COLORS: Record<Course, { bg: string; border: string; text: string; header: string }> = {
  'Graphic Design & Multimedia': {
    bg: 'bg-purple-100',
    border: 'border-purple-500',
    text: 'text-purple-900',
    header: 'bg-purple-600',
  },
  'Regia e Videomaking': {
    bg: 'bg-red-100',
    border: 'border-red-500',
    text: 'text-red-900',
    header: 'bg-red-600',
  },
  'Fashion Design': {
    bg: 'bg-pink-100',
    border: 'border-pink-500',
    text: 'text-pink-900',
    header: 'bg-pink-600',
  },
  'Fotografia': {
    bg: 'bg-blue-100',
    border: 'border-blue-500',
    text: 'text-blue-900',
    header: 'bg-blue-600',
  },
  'Design': {
    bg: 'bg-green-100',
    border: 'border-green-500',
    text: 'text-green-900',
    header: 'bg-green-600',
  },
  'Pittura': {
    bg: 'bg-yellow-100',
    border: 'border-yellow-500',
    text: 'text-yellow-900',
    header: 'bg-yellow-600',
  },
  'Interior Design': {
    bg: 'bg-orange-100',
    border: 'border-orange-500',
    text: 'text-orange-900',
    header: 'bg-orange-600',
  },
  'Cinema e Audiovisivi': {
    bg: 'bg-indigo-100',
    border: 'border-indigo-500',
    text: 'text-indigo-900',
    header: 'bg-indigo-600',
  },
}

// Colore di default se il corso non è specificato
export const DEFAULT_COURSE_COLOR = {
  bg: 'bg-gray-100',
  border: 'border-gray-500',
  text: 'text-gray-900',
  header: 'bg-laba-primary',
}

// Funzione per ottenere il colore di un corso
export function getCourseColor(course?: string): { bg: string; border: string; text: string; header: string } {
  if (!course) return DEFAULT_COURSE_COLOR
  return COURSE_COLORS[course as Course] || DEFAULT_COURSE_COLOR
}

