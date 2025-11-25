import { ALL_COURSES, Course } from './courses'

// Mappa colori per i corsi
export const COURSE_COLORS: Record<Course, { bg: string; border: string; text: string; header: string; borderColor: string }> = {
  'Graphic Design & Multimedia': {
    bg: 'bg-purple-100',
    border: 'border-purple-700',
    text: 'text-purple-900',
    header: 'bg-purple-500',
    borderColor: '#7e22ce', // purple-700
  },
  'Regia e Videomaking': {
    bg: 'bg-red-100',
    border: 'border-red-700',
    text: 'text-red-900',
    header: 'bg-red-500',
    borderColor: '#b91c1c', // red-700
  },
  'Fashion Design': {
    bg: 'bg-pink-100',
    border: 'border-pink-700',
    text: 'text-pink-900',
    header: 'bg-pink-500',
    borderColor: '#be185d', // pink-700
  },
  'Fotografia': {
    bg: 'bg-blue-100',
    border: 'border-blue-700',
    text: 'text-blue-900',
    header: 'bg-blue-500',
    borderColor: '#1d4ed8', // blue-700
  },
  'Design': {
    bg: 'bg-green-100',
    border: 'border-green-700',
    text: 'text-green-900',
    header: 'bg-green-500',
    borderColor: '#15803d', // green-700
  },
  'Pittura': {
    bg: 'bg-yellow-100',
    border: 'border-yellow-700',
    text: 'text-yellow-900',
    header: 'bg-yellow-500',
    borderColor: '#a16207', // yellow-700
  },
  'Interior Design': {
    bg: 'bg-orange-100',
    border: 'border-orange-700',
    text: 'text-orange-900',
    header: 'bg-orange-500',
    borderColor: '#c2410c', // orange-700
  },
  'Cinema e Audiovisivi': {
    bg: 'bg-indigo-100',
    border: 'border-indigo-700',
    text: 'text-indigo-900',
    header: 'bg-indigo-500',
    borderColor: '#4338ca', // indigo-700
  },
}

// Colore di default se il corso non è specificato
export const DEFAULT_COURSE_COLOR = {
  bg: 'bg-gray-100',
  border: 'border-gray-700',
  text: 'text-gray-900',
  header: 'bg-laba-primary',
  borderColor: '#374151', // gray-700
}

// Funzione per ottenere il colore di un corso
export function getCourseColor(course?: string): { bg: string; border: string; text: string; header: string; borderColor: string } {
  if (!course) return DEFAULT_COURSE_COLOR
  return COURSE_COLORS[course as Course] || DEFAULT_COURSE_COLOR
}

