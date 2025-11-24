'use client'

import { useState } from 'react'

interface LoginModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function LoginModal({ onClose, onSuccess }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Errore durante il login')
        setLoading(false)
        return
      }

      onSuccess()
    } catch (err) {
      setError('Errore di connessione')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-laba-primary">Login Admin</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-all duration-200 flex items-center justify-center text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-laba-primary focus:border-laba-primary transition-all duration-200"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-laba-primary focus:border-laba-primary transition-all duration-200"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-full bg-laba-primary text-white py-2 px-4 text-sm font-medium transition-all duration-200 hover:bg-opacity-90 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 shadow-sm hover:shadow-md"
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-gray-300 text-sm font-medium transition-all duration-200 hover:bg-gray-50 hover:scale-105 active:scale-95 shadow-sm hover:shadow-md"
            >
              Annulla
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

