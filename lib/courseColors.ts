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

// Funzioni helper per modificare la saturazione dei colori hex
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16)
    return hex.length === 1 ? '0' + hex : hex
  }).join('')
}

// Converti RGB a HSL
function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}

// Converti HSL a RGB
function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  h /= 360
  s /= 100
  l /= 100

  let r, g, b

  if (s === 0) {
    r = g = b = l
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1/6) return p + (q - p) * 6 * t
      if (t < 1/2) return q
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
      return p
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s
    const p = 2 * l - q

    r = hue2rgb(p, q, h + 1/3)
    g = hue2rgb(p, q, h)
    b = hue2rgb(p, q, h - 1/3)
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255)
  }
}

// Funzione per modificare la saturazione di un colore
function adjustSaturation(hex: string, saturationChange: number): string {
  const rgb = hexToRgb(hex)
  if (!rgb) return hex
  
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
  // Modifica la saturazione mantenendo la stessa tonalità e luminosità
  hsl.s = Math.max(0, Math.min(100, hsl.s + saturationChange))
  
  const newRgb = hslToRgb(hsl.h, hsl.s, hsl.l)
  return rgbToHex(newRgb.r, newRgb.g, newRgb.b)
}

function adjustColorBrightness(hex: string, year: number): string {
  if (year === 1) {
    // Anno 1: meno saturato (più tenue/pastello) - riduci saturazione del 30%
    return adjustSaturation(hex, -30)
  } else if (year === 3) {
    // Anno 3: più saturato (più intenso/vivace) - aumenta saturazione del 25%
    return adjustSaturation(hex, 25)
  }
  // Anno 2: colore normale (base)
  return hex
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

export function getCourseColor(course?: string, year?: number): CourseColor {
  if (!course) {
    return defaultColor
  }
  
  const baseColor = courseColorMap[course] || defaultColor
  
  // Se non c'è anno specificato, restituisci il colore base
  if (!year || year < 1 || year > 3) {
    return baseColor
  }
  
  // Applica le tonalità in base all'anno - variazioni sottili dello stesso colore
  const adjustedBorderColor = adjustColorBrightness(baseColor.borderColor, year)
  const adjustedBgHex = adjustColorBrightness(baseColor.bgHex, year)
  // Il testo mantiene lo stesso colore base per tutti gli anni, solo lo sfondo varia
  const adjustedTextHex = baseColor.textHex
  
  return {
    ...baseColor,
    borderColor: adjustedBorderColor,
    bgHex: adjustedBgHex,
    textHex: adjustedTextHex,
  }
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





