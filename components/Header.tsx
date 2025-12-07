'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const res = await fetch('/api/auth/check')
    const data = await res.json()
    setIsAuthenticated(data.authenticated)
  }

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
      <header className="text-white shadow-lg sticky top-0 z-50" style={{ backgroundColor: '#033157' }}>
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between h-16">
            {/* Logo a sinistra */}
            <div className="flex items-center gap-4 animate-fade-in">
              <img 
                src="/logoSito.svg" 
                alt="LABA" 
                className="h-10 w-auto brightness-0 invert transition-transform duration-300 hover:scale-110"
              />
              <span className="text-xl font-semibold text-white tracking-tight">Orario Lezioni</span>
            </div>
            
            {/* Selettore Sede al centro */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleLocationChange('badia-ripoli')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  currentLocation === 'badia-ripoli'
                    ? 'bg-white text-laba-primary shadow-md'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                Piazza di Badia a Ripoli
              </button>
              <button
                onClick={() => handleLocationChange('via-vecchietti')}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  currentLocation === 'via-vecchietti'
                    ? 'bg-white text-laba-primary shadow-md'
                    : 'bg-white bg-opacity-20 text-white hover:bg-opacity-30'
                }`}
              >
                Via de Vecchietti
              </button>
            </div>
            
            {/* Login Admin a destra */}
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="btn-modern px-6 py-2.5 rounded-full bg-red-500 text-white text-sm font-medium shadow-md relative overflow-hidden"
                  >
                    <span className="relative z-10">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="btn-modern px-6 py-2.5 rounded-full bg-white text-laba-primary text-sm font-medium shadow-md relative overflow-hidden"
                >
                  <span className="relative z-10">Login Admin</span>
                </button>
              )}
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
    </>
  )
}

