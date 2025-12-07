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

// Colori più saturi e vivaci per eventi calendario (stile macOS)
const courseColorMap: Record<string, CourseColor> = {
  'Graphic Design & Multimedia': {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-300',
    borderColor: '#3b82f6',
    bgHex: '#dbeafe',
    textHex: '#1e40af',
  },
  'Regia e Videomaking': {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-300',
    borderColor: '#a855f7',
    bgHex: '#f3e8ff',
    textHex: '#6b21a8',
  },
  'Fashion Design': {
    bg: 'bg-pink-50',
    text: 'text-pink-700',
    border: 'border-pink-300',
    borderColor: '#ec4899',
    bgHex: '#fce7f3',
    textHex: '#be185d',
  },
  'Fotografia': {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-300',
    borderColor: '#f59e0b',
    bgHex: '#fef3c7',
    textHex: '#b45309',
  },
  'Design': {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-300',
    borderColor: '#10b981',
    bgHex: '#d1fae5',
    textHex: '#047857',
  },
  'Pittura': {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-300',
    borderColor: '#f97316',
    bgHex: '#fed7aa',
    textHex: '#c2410c',
  },
  'Interior Design': {
    bg: 'bg-teal-50',
    text: 'text-teal-700',
    border: 'border-teal-300',
    borderColor: '#14b8a6',
    bgHex: '#ccfbf1',
    textHex: '#0f766e',
  },
  'Cinema e Audiovisivi': {
    bg: 'bg-indigo-50',
    text: 'text-indigo-700',
    border: 'border-indigo-300',
    borderColor: '#6366f1',
    bgHex: '#e0e7ff',
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


