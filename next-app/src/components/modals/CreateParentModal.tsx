import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface CreateParentModalProps {
  onClose: () => void
  onCreated: (parent: any) => void
}

export function CreateParentModal({ onClose, onCreated }: CreateParentModalProps) {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    password_confirm: '',
    phone: ''
  })

  useEffect(() => {
    setMounted(true)
    // Prevent scrolling when modal is open
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const isFormValid =
    form.full_name &&
    form.email &&
    form.password &&
    form.password.length >= 6 &&
    form.password === form.password_confirm

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (loading) return
    if (!isFormValid) {
      setError('Please fill in all required fields correctly')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          password: form.password,
          role: 'parent',
          phone: form.phone || null
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        onCreated(data.profile || data.user)
      } else {
        throw new Error(data.message || 'Failed to create parent')
      }
    } catch (e: any) {
      setError(e.message || 'Failed to create parent')
    } finally {
      setLoading(false)
    }
  }

  if (!mounted) return null

  const modalContent = (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl max-w-md w-full border border-white/20 animate-[fadeInUp_0.3s_ease-out]">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-900">Create New Parent</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="w-full px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none transition-all"
                placeholder="Minimum 6 characters"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                minLength={6}
                value={form.password_confirm}
                onChange={(e) => setForm({ ...form, password_confirm: e.target.value })}
                className="w-full px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none transition-all"
              />
              {form.password_confirm && form.password !== form.password_confirm && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2 bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#667eea] outline-none transition-all"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <div className="flex gap-3 justify-end pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-gray-700 bg-gray-100/80 hover:bg-gray-200 rounded-xl transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !isFormValid}
                className="px-5 py-2.5 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md"
              >
                {loading ? 'Creating...' : 'Create Parent'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
