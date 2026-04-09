'use client'

import React, { useEffect, useState } from 'react'
import { useChildrenStore } from '@/stores/children'
import type { Child } from '@/stores/children'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

type ObservationFormData = {
  child_id: string
  observation_date: string
  context: string
  description: string
  development_area: string
  photos: string[]
  videos: string[]
}

interface ObservationFormProps {
  initialData?: Partial<ObservationFormData>
  onSubmit: (data: ObservationFormData) => void
  onCancel: () => void
  loading?: boolean
}

export const ObservationForm = ({ initialData, onSubmit, onCancel, loading: submitting }: ObservationFormProps) => {
  const { children, loading: childrenLoading, error: childrenError, fetchChildren } = useChildrenStore()
  
  const [form, setForm] = useState<ObservationFormData>({
    child_id: initialData?.child_id || '',
    observation_date: initialData?.observation_date || new Date().toISOString().split('T')[0],
    context: initialData?.context || '',
    description: initialData?.description || '',
    development_area: initialData?.development_area || '',
    photos: initialData?.photos || [],
    videos: initialData?.videos || [],
  })

  const [error, setError] = useState('')

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  const isFormValid = form.child_id && form.observation_date && form.description.trim()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus.')
      return
    }
    setError('')
    onSubmit(form)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm((prev) => ({ ...prev, [id as keyof ObservationFormData]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="child_id" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Kind <span className="text-red-500">*</span>
        </label>
        <select
          id="child_id"
          value={form.child_id}
          onChange={handleChange}
          required
          disabled={childrenLoading}
          className="ui-select disabled:opacity-50"
        >
          <option value="">{childrenLoading ? 'Lade Kinder...' : 'Kind auswählen'}</option>
          {(children || []).map((child: Child) => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
        {childrenError && (
          <p className="mt-1 text-xs text-red-500">
            Fehler beim Laden der Kinder: {childrenError.message}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="observation_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Datum <span className="text-red-500">*</span>
        </label>
        <input
          id="observation_date"
          type="date"
          value={form.observation_date.split('T')[0]}
          onChange={handleChange}
          required
          className="ui-input"
        />
      </div>

      <div>
        <label htmlFor="context" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Kontext (Wo/Wann)
        </label>
        <input
          id="context"
          type="text"
          value={form.context}
          onChange={handleChange}
          className="ui-input"
          placeholder="z.B. Freispiel, Morgenkreis"
        />
      </div>

      <div>
        <label htmlFor="development_area" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Entwicklungsbereich
        </label>
        <select
          id="development_area"
          value={form.development_area}
          onChange={handleChange}
          className="ui-select"
        >
          <option value="">Bereich auswählen</option>
          <option value="Social">Sozial</option>
          <option value="Motor">Motorik</option>
          <option value="Language">Sprache</option>
          <option value="Cognitive">Kognitiv</option>
          <option value="Emotional">Emotional</option>
          <option value="Creative">Kreativ</option>
        </select>
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Beschreibung <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          value={form.description}
          onChange={handleChange}
          rows={5}
          required
          className="ui-textarea"
          placeholder="Beschreiben Sie Ihre Beobachtung..."
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
          className="px-6 py-2.5"
        >
          Abbrechen
        </IOSButton>
        <IOSButton
          type="submit"
          variant="primary"
          disabled={submitting || !isFormValid}
          className="px-6 py-2.5 min-w-[120px]"
        >
          {submitting ? <LoadingSpinner size="sm" /> : initialData ? 'Speichern' : 'Erstellen'}
        </IOSButton>
      </div>
    </form>
  )
}
