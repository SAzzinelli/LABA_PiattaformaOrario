'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import LoginModal from './LoginModal'
import { Location } from '@/lib/locations'
import { useRouter, usePathname } from 'next/navigation'

interface HeaderProps {
  selectedLocation?: Location
  onLocationChange?: (location: Location) => void
}

export default function Header({ selectedLocation, onLocationChange }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // Estrai la sede dall'URL se disponibile
  const getLocationFromPath = (): Location => {
    if (pathname?.includes('/via-vecchietti')) return 'via-vecchietti'
    if (pathname?.includes('/badia-ripoli')) return 'badia-ripoli'
    return selectedLocation || 'badia-ripoli'
  }
  
  const currentLocation = selectedLocation || getLocationFromPath()
  
  const handleLocationChange = (location: Location) => {
    if (onLocationChange) {
      onLocationChange(location)
    } else {
      router.push(`/${location}`)
    }
  }
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const checkAuth = async () => {
    const res = await fetch('/api/auth/check')
    const data = await res.json()
    setIsAuthenticated(data.authenticated)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- auth check on mount (async setState in callback)
    checkAuth()
  }, [])
  
  // Chiudi il menu quando si preme ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showMenu) {
        setShowMenu(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [showMenu])

  const handleLogin = () => {
    setShowLogin(true)
  }

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    setIsAuthenticated(false)
    window.location.reload()
  }

  const handleLoginSuccess = () => {
    setIsAuthenticated(true)
    setShowLogin(false)
    window.location.reload()
  }

  return (
    <>
      <header className="text-white shadow-lg sticky top-0 z-[100]" style={{ backgroundColor: '#033157' }}>
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
            {/* Logo a sinistra */}
            <div className="relative flex items-center flex-shrink-0 animate-fade-in h-8 sm:h-10 w-24 sm:w-28">
              <Image
                src="/logoSito.svg"
                alt="LABA"
                fill
                className="object-contain object-left brightness-0 invert transition-transform duration-300 hover:scale-110"
              />
            </div>
            
            {/* Selettore Sede al centro - Mobile: dropdown, Desktop: bottoni */}
            <div className="hidden sm:flex items-center gap-2 flex-1 justify-center">
              <button
                onClick={() => handleLocationChange('badia-ripoli')}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                  currentLocation === 'badia-ripoli'
                    ? 'bg-white text-laba-primary shadow-md'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                Piazza di Badia a Ripoli
              </button>
              <button
                onClick={() => handleLocationChange('via-vecchietti')}
                className={`px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                  currentLocation === 'via-vecchietti'
                    ? 'bg-white text-laba-primary shadow-md'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                Via de&apos; Vecchietti
              </button>
            </div>
            
            {/* Mobile: Selettore Sede compatto */}
            <div className="sm:hidden flex items-center gap-1.5 flex-1 min-w-0 justify-center">
              <button
                onClick={() => handleLocationChange('badia-ripoli')}
                className={`px-2 py-1 rounded-md font-medium text-[10px] transition-all truncate max-w-[45%] ${
                  currentLocation === 'badia-ripoli'
                    ? 'bg-white text-laba-primary shadow-md'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
                title="Piazza di Badia a Ripoli"
              >
                Badia
              </button>
              <button
                onClick={() => handleLocationChange('via-vecchietti')}
                className={`px-2 py-1 rounded-md font-medium text-[10px] transition-all truncate max-w-[45%] ${
                  currentLocation === 'via-vecchietti'
                    ? 'bg-white text-laba-primary shadow-md'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
                title={"Via de' Vecchietti"}
              >
                Vecchietti
              </button>
            </div>
            
            {/* Menu hamburger a destra */}
            <nav className="flex items-center flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 sm:p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors relative z-[100]"
                aria-label="Menu"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSuccess={handleLoginSuccess}
        />
      )}

      {/* Menu dropdown semplice */}
      {showMenu && (
        <>
          {/* Backdrop con opacità scura */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-40 z-[90] animate-fade-in"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu dropdown - posizionato fisso in alto a destra */}
          <div className="fixed top-16 right-4 z-[100] bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] animate-scale-in">
            <div className="py-2">
              {isAuthenticated ? (
                <button
                  onClick={() => {
                    handleLogout()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Logout</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    handleLogin()
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Login Admin</span>
                </button>
              )}
              
              <div className="border-t border-gray-200 my-1"></div>
              
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('export-calendar'))
                  setShowMenu(false)
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Esporta calendari</span>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}

