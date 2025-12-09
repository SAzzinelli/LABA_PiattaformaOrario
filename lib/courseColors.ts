// Colori per i corsi - versione meno satura per modali e header
import { ALL_COURSES } from './courses'

export interface CourseColor {
  bg: string // Background class
  text: string // Text color class
  border: string // Border color class
  borderColor: string // Border color hex (per style inline)
  bgHex: string // Background hex (per style inline)
  textHex: string // Text color hex (per style inline)
}

// Colori base meno saturi per i corsi
const courseColorMap: Record<string, CourseColor> = {
  'Graphic Design & Multimedia': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    borderColor: '#93c5fd',
    bgHex: '#eff6ff',
    textHex: '#1e40af',
  },
  'Regia e Videomaking': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
    borderColor: '#c4b5fd',
    bgHex: '#faf5ff',
    textHex: '#6b21a8',
  },
  'Fashion Design': {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-300',
    borderColor: '#f9a8d4',
    bgHex: '#fdf2f8',
    textHex: '#be185d',
  },
  'Fotografia': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
    borderColor: '#fcd34d',
    bgHex: '#fffbeb',
    textHex: '#b45309',
  },
  'Design': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    borderColor: '#6ee7b7',
    bgHex: '#ecfdf5',
    textHex: '#047857',
  },
  'Pittura': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-300',
    borderColor: '#fdba74',
    bgHex: '#fff7ed',
    textHex: '#c2410c',
  },
  'Interior Design': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-300',
    borderColor: '#5eead4',
    bgHex: '#f0fdfa',
    textHex: '#0f766e',
  },
  'Cinema e Audiovisivi': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    borderColor: '#a5b4fc',
    bgHex: '#eef2ff',
    textHex: '#4338ca',
  },
}

// Colore di default per lezioni senza corso specifico
const defaultColor: CourseColor = {
  bg: 'bg-gray-50',
  text: 'text-gray-700',
  border: 'border-gray-300',
  borderColor: '#d1d5db',
  bgHex: '#f9fafb',
  textHex: '#374151',
}

export function getCourseColor(course?: string): CourseColor {
  if (!course) {
    return defaultColor
  }
  return courseColorMap[course] || defaultColor
}

// Funzione per ottenere il codice abbreviato del corso
export function getCourseCode(course?: string): string {
  if (!course) return ''
  
  const codeMap: Record<string, string> = {
    'Design': 'DES',
    'Graphic Design & Multimedia': 'GD',
    'Fashion Design': 'FD',
    'Interior Design': 'INT',
    'Regia e Videomaking': 'RV',
    'Fotografia': 'FOT',
    'Pittura': 'PIT',
    'Cinema e Audiovisivi': 'CIN',
  }
  
  return codeMap[course] || ''
}




