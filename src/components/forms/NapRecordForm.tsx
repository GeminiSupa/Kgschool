'use client'

import React, { useState, useEffect } from 'react'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useChildrenStore } from '@/stores/children'

interface NapRecordFormProps {
  initialData?: any
  onSubmit: (data: any) => void
  onCancel: () => void
  loading?: boolean
}

export const NapRecordForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading: submitting
}: NapRecordFormProps) => {
  const { children, loading: childrenLoading, fetchChildren } = useChildrenStore()
  
  const [form, setForm] = useState({
    child_id: initialData?.child_id || '',
    nap_date: initialData?.nap_date || new Date().toISOString().split('T')[0],
    start_time: initialData?.start_time || '',
    end_time: initialData?.end_time || '',
    duration_minutes: initialData?.duration_minutes || '',
    notes: initialData?.notes || ''
  })

  const [error, setError] = useState('')

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  useEffect(() => {
    if (form.start_time && form.end_time) {
      const [sh, sm] = form.start_time.split(':').map(Number)
      const [eh, em] = form.end_time.split(':').map(Number)
      const mins = (eh * 60 + em) - (sh * 60 + sm)
      if (mins > 0) {
        setForm(prev => ({ ...prev, duration_minutes: mins.toString() }))
      }
    }
  }, [form.start_time, form.end_time])

  const isFormValid = form.child_id && form.nap_date

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    setError('')
    onSubmit({
      ...form,
      duration_minutes: form.duration_minutes ? parseInt(form.duration_minutes as string) : undefined
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
          className="ui-select disabled:opacity-60"
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
        <label htmlFor="nap_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Datum <span className="text-red-500">*</span>
        </label>
        <input
          id="nap_date"
          type="date"
          value={form.nap_date}
          onChange={handleChange}
          required
          className="ui-input"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_time" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Beginn
          </label>
          <input
            id="start_time"
            type="time"
            value={form.start_time}
            onChange={handleChange}
            className="ui-input"
          />
        </div>
        <div>
          <label htmlFor="end_time" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Ende
          </label>
          <input
            id="end_time"
            type="time"
            value={form.end_time}
            onChange={handleChange}
            className="ui-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="duration_minutes" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Dauer (Minuten)
        </label>
        <input
          id="duration_minutes"
          type="number"
          value={form.duration_minutes}
          onChange={handleChange}
          min="0"
          className="ui-input"
          placeholder="z.B. 90"
        />
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Notizen
        </label>
        <textarea
          id="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className="ui-textarea"
          placeholder="z.B. Kind ist schnell eingeschlafen, ruhiger Schlaf..."
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
          {submitting ? <LoadingSpinner size="sm" /> : 'Speichern'}
        </IOSButton>
      </div>
    </form>
  )
}
