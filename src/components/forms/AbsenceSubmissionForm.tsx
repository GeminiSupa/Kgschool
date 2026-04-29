'use client'

import React, { useState } from 'react'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

interface AbsenceSubmissionFormProps {
  onSubmit: (data: { reason: string; notes?: string }) => void
  onCancel: () => void
  loading?: boolean
}

export const AbsenceSubmissionForm = ({ onSubmit, onCancel, loading }: AbsenceSubmissionFormProps) => {
  const [form, setForm] = useState({
    reason: '',
    notes: ''
  })
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.reason.trim()) {
      setError('Grund ist erforderlich')
      return
    }
    setError('')
    onSubmit({
      reason: form.reason.trim(),
      notes: form.notes.trim() || undefined
    })
  }

  return (
    <div className="p-1">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-6">Abwesenheit melden</h3>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Grund <span className="text-red-500">*</span>
          </label>
          <textarea
            id="reason"
            value={form.reason}
            onChange={(e) => setForm(prev => ({ ...prev, reason: e.target.value }))}
            rows={3}
            required
          className="ui-textarea"
            placeholder="Grund für die Abwesenheit..."
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Zusätzliche Notizen (Optional)
          </label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          className="ui-textarea"
            placeholder="Weitere Informationen..."
          />
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-xl text-xs font-medium border border-red-100">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end pt-2">
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
            disabled={loading || !form.reason.trim()}
            className="px-6 py-2.5 font-bold min-w-[120px]"
          >
            {loading ? <LoadingSpinner size="sm" /> : 'Senden'}
          </IOSButton>
        </div>
      </form>
    </div>
  )
}
