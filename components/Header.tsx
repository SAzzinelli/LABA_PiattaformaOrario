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
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-laba-primary">LABA - Orario Lezioni</h1>
            </div>
            <nav className="flex items-center gap-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium transition-all duration-200 hover:bg-red-600 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <button
                  onClick={handleLogin}
                  className="px-4 py-2 rounded-full bg-laba-primary text-white text-sm font-medium transition-all duration-200 hover:bg-opacity-90 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
                >
                  Login Admin
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

