'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import LoginModal from './LoginModal'
import { Location } from '@/lib/locations'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface HeaderProps {
  selectedLocation?: Location
  onLocationChange?: (location: Location) => void
}

export default function Header({ selectedLocation, onLocationChange }: HeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const isHome = pathname === '/'
  
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
      <header className="text-white shadow-lg sticky top-0 z-[100] overflow-hidden" style={{ backgroundColor: '#033157' }}>
        <div className="container mx-auto px-2 sm:px-4 max-w-full">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-1 sm:gap-2 min-w-0">
            {/* Logo a sinistra - cliccabile per tornare alla home */}
            <Link
              href="/"
              className="relative flex items-center flex-shrink-0 animate-fade-in h-8 sm:h-10 w-24 sm:w-28 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Image
                src="/logoSito.svg"
                alt="LABA - Home"
                fill
                className="object-contain object-left brightness-0 invert transition-transform duration-300 hover:scale-110"
              />
            </Link>
            
            {/* Selettore Sede al centro - non mostrare in home (ci sono le card sotto) */}
            {!isHome && (
              <>
                <div className="hidden sm:flex items-center gap-2 flex-1 justify-center">
                  <button
                    onClick={() => handleLocationChange('badia-ripoli')}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                      currentLocation === 'badia-ripoli'
                        ? 'bg-white text-[#033157] shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Piazza di Badia a Ripoli
                  </button>
                  <button
                    onClick={() => handleLocationChange('via-vecchietti')}
                    className={`cursor-pointer px-3 py-1.5 rounded-lg font-medium text-xs sm:text-sm transition-all whitespace-nowrap ${
                      currentLocation === 'via-vecchietti'
                        ? 'bg-white text-[#033157] shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    Via de&apos; Vecchietti
                  </button>
                </div>
                <div className="sm:hidden flex items-center gap-1 flex-1 min-w-0 justify-center overflow-hidden">
                  <button
                    onClick={() => handleLocationChange('badia-ripoli')}
                    className={`cursor-pointer flex-1 min-w-0 px-2 py-1 rounded-md font-medium text-[10px] transition-all truncate ${
                      currentLocation === 'badia-ripoli'
                        ? 'bg-white text-[#033157] shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title="Piazza di Badia a Ripoli"
                  >
                    Badia
                  </button>
                  <button
                    onClick={() => handleLocationChange('via-vecchietti')}
                    className={`cursor-pointer flex-1 min-w-0 px-2 py-1 rounded-md font-medium text-[10px] transition-all truncate ${
                      currentLocation === 'via-vecchietti'
                        ? 'bg-white text-[#033157] shadow-md'
                        : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                    title={"Via de' Vecchietti"}
                  >
                    Vecchietti
                  </button>
                </div>
              </>
            )}
            
            {/* Menu hamburger a destra */}
            <nav className="flex items-center flex-shrink-0">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="cursor-pointer p-1.5 sm:p-2 rounded-lg text-white hover:bg-white/20 transition-colors relative z-[100]"
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
          {/* Backdrop blur + opacità */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] animate-fade-in cursor-pointer"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu dropdown - posizionato fisso in alto a destra */}
          <div className="fixed top-16 right-4 z-[100] bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] animate-scale-in">
            <div className="py-2">
              {isAuthenticated ? (
                <>
                  <Link
                    href="/admin"
                    onClick={() => setShowMenu(false)}
                    className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3 block cursor-pointer"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Admin</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowMenu(false)
                    }}
                    className="cursor-pointer w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    handleLogin()
                    setShowMenu(false)
                  }}
                  className="cursor-pointer w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Login Admin</span>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

