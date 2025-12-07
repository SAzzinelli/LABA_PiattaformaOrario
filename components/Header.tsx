'use client'

import { useState, useEffect } from 'react'
import LoginModal from './LoginModal'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
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

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/check')
      if (!res.ok) {
        setIsAuthenticated(false)
        return
      }
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        setIsAuthenticated(false)
        return
      }
      const data = await res.json()
      setIsAuthenticated(data.authenticated || false)
    } catch (e) {
      console.error("Auth check failed", e)
      setIsAuthenticated(false)
    }
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
      <header className="text-white shadow-lg sticky top-0 z-[100]" style={{ backgroundColor: '#033157' }}>
        <div className="container mx-auto px-2">
          <div className="flex items-center justify-between h-14">
            {/* Logo a sinistra - cliccabile per tornare alla home */}
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 md:gap-3 animate-fade-in hover:opacity-80 transition-opacity"
            >
              <img 
                src="/logoSito.svg" 
                alt="LABA" 
                className="h-6 md:h-8 w-auto brightness-0 invert transition-transform duration-300 hover:scale-110"
              />
            </button>
            
            {/* Menu hamburger a destra */}
            <nav className="flex items-center">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-2 rounded-lg text-white hover:bg-white hover:bg-opacity-20 transition-colors relative z-[100]"
                aria-label="Menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          <div className="fixed top-14 right-2 md:right-4 z-[100] bg-white rounded-lg shadow-xl border border-gray-200 min-w-[200px] max-w-[calc(100vw-1rem)] animate-scale-in">
            <div className="py-2">
              <button
                onClick={() => {
                  router.push('/')
                  setShowMenu(false)
                }}
                className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Home</span>
              </button>
              
              <div className="border-t border-gray-200 my-1"></div>
              
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
              
              {isAuthenticated && (
                <button
                  onClick={() => {
                    router.push('/admin')
                    setShowMenu(false)
                  }}
                  className="w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                >
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Gestione Avvisi</span>
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

