'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useChildrenStore } from '@/stores/children'

interface PortfolioFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export const PortfolioForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading: submitting
}: PortfolioFormProps) => {
  const { children, loading: childrenLoading, fetchChildren } = useChildrenStore()
  
  const [form, setForm] = useState({
    child_id: initialData?.child_id || '',
    title: initialData?.title || '',
    portfolio_type: (initialData?.portfolio_type || 'other') as 'artwork' | 'photo' | 'achievement' | 'activity' | 'milestone' | 'other',
    description: initialData?.description || '',
    content: initialData?.content || '',
    date: initialData?.date || new Date().toISOString().split('T')[0],
    attachments: initialData?.attachments || [] as string[]
  })

  const [error, setError] = useState('')

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  const isFormValid = 
    form.child_id && 
    form.title && 
    form.portfolio_type && 
    form.date

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus.')
      return
    }

    setError('')
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="child_id" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Kind <span className="text-red-500">*</span>
        </label>
        <select
          id="child_id"
          value={form.child_id}
          onChange={handleChange}
          required
          disabled={childrenLoading}
          className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all disabled:opacity-50"
        >
          <option value="">{childrenLoading ? 'Lädt...' : 'Kind auswählen'}</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Titel <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          type="text"
          value={form.title}
          onChange={handleChange}
          required
          className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
          placeholder="z.B. Kunstwerk - Frühlingsblumen"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="portfolio_type" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Typ <span className="text-red-500">*</span>
          </label>
          <select
            id="portfolio_type"
            value={form.portfolio_type}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
          >
            <option value="artwork">Kunstwerk</option>
            <option value="photo">Foto</option>
            <option value="achievement">Leistung</option>
            <option value="activity">Aktivität</option>
            <option value="milestone">Meilenstein</option>
            <option value="other">Sonstiges</option>
          </select>
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-semibold text-gray-700 mb-1.5">
            Datum <span className="text-red-500">*</span>
          </label>
          <input
            id="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
          />
        </div>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Kurze Beschreibung
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={handleChange}
          rows={2}
          className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all resize-none"
          placeholder="Kurze Zusammenfassung..."
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-semibold text-gray-700 mb-1.5">
          Detaillierter Inhalt / Notizen
        </label>
        <textarea
          id="content"
          value={form.content}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-3 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all resize-none"
          placeholder="Detaillierte Informationen..."
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <IOSButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-6 py-2.5 font-bold"
        >
          Abbrechen
        </IOSButton>
        <IOSButton
          type="submit"
          variant="primary"
          disabled={submitting || !isFormValid}
          className="px-8 py-2.5 font-bold min-w-[160px]"
        >
          {submitting ? <LoadingSpinner size="sm" /> : 'Erstellen'}
        </IOSButton>
      </div>
    </form>
  )
}
