'use client'

import React, { useState, useMemo } from 'react'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export type TeacherLeaveType = 'vacation' | 'sick' | 'personal' | 'other'

export type TeacherLeaveRequestPayload = {
  start_date: string
  end_date: string
  leave_type: TeacherLeaveType
  reason: string
  status: 'pending'
}

type TeacherLeaveRequestFormState = Omit<TeacherLeaveRequestPayload, 'status'>

interface TeacherLeaveRequestFormProps {
  initialData?: Partial<TeacherLeaveRequestFormState>
  onSubmit: (data: TeacherLeaveRequestPayload) => void | Promise<void>
  onCancel: () => void
  loading?: boolean
}

export const TeacherLeaveRequestForm = ({
  initialData,
  onSubmit,
  onCancel,
  loading: submitting
}: TeacherLeaveRequestFormProps) => {
  const initialLeaveType = (initialData?.leave_type as TeacherLeaveType | undefined) ?? 'vacation'

  const [form, setForm] = useState({
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    leave_type: initialLeaveType,
    reason: initialData?.reason || ''
  } satisfies TeacherLeaveRequestFormState)

  const [error, setError] = useState('')

  const minDate = useMemo(() => new Date().toISOString().split('T')[0], [])

  const isFormValid = 
    form.start_date && 
    form.end_date && 
    form.leave_type && 
    form.reason.trim() &&
    new Date(form.end_date) >= new Date(form.start_date)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setForm(prev => ({ ...prev, [id]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!isFormValid) {
      setError('Bitte füllen Sie alle erforderlichen Felder aus und stellen Sie sicher, dass das Enddatum nach dem Startdatum liegt.')
      return
    }

    setError('')
    onSubmit({
      ...form,
      reason: form.reason.trim(),
      status: 'pending'
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="start_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Startdatum <span className="text-red-500">*</span>
          </label>
          <input
            id="start_date"
            type="date"
            value={form.start_date}
            onChange={handleChange}
            required
            min={minDate}
          className="ui-input"
          />
        </div>

        <div>
          <label htmlFor="end_date" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
            Enddatum <span className="text-red-500">*</span>
          </label>
          <input
            id="end_date"
            type="date"
            value={form.end_date}
            onChange={handleChange}
            required
            min={form.start_date || minDate}
          className="ui-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="leave_type" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Art des Urlaubs <span className="text-red-500">*</span>
        </label>
        <select
          id="leave_type"
          value={form.leave_type}
          onChange={handleChange}
          required
          className="ui-select"
        >
          <option value="vacation">Erholungsurlaub</option>
          <option value="sick">Krankmeldung</option>
          <option value="personal">Persönliche Gründe</option>
          <option value="other">Sonstiges</option>
        </select>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
          Grund <span className="text-red-500">*</span>
        </label>
        <textarea
          id="reason"
          value={form.reason}
          onChange={handleChange}
          rows={4}
          required
          className="ui-textarea"
          placeholder="Bitte geben Sie einen Grund für Ihren Urlaubsantrag an..."
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
          {submitting ? <LoadingSpinner size="sm" /> : 'Antrag stellen'}
        </IOSButton>
      </div>
    </form>
  )
}
