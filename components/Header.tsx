'use client'

import { useState, useEffect } from 'react'
import LoginModal from './LoginModal'

export default function Header() {
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
      <header className="bg-laba-primary text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex items-center justify-between h-14 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 animate-fade-in min-w-0 flex-shrink">
              <img 
                src="/logoSito.svg" 
                alt="LABA" 
                className="h-6 sm:h-8 w-auto brightness-0 invert transition-transform duration-300 hover:scale-110 flex-shrink-0"
              />
              <span className="text-base sm:text-lg font-semibold text-white tracking-tight truncate">Orario Lezioni</span>
            </div>
            <nav className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="btn-modern px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-red-500 text-white text-xs sm:text-sm font-medium shadow-md relative overflow-hidden whitespace-nowrap"
                  >
                    <span className="relative z-10">Logout</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="btn-modern px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-laba-primary text-xs sm:text-sm font-medium shadow-md relative overflow-hidden whitespace-nowrap"
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

