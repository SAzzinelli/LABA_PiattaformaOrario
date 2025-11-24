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
      <header className="bg-laba-primary text-white shadow-lg sticky top-0 z-50 backdrop-blur-sm bg-opacity-95">
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4 animate-fade-in">
              <img 
                src="/logoSito.svg" 
                alt="LABA" 
                className="h-10 w-auto brightness-0 invert transition-transform duration-300 hover:scale-110"
              />
              <span className="text-xl font-semibold text-white tracking-tight">Orario Lezioni</span>
            </div>
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

