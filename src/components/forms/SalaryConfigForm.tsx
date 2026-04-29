'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { type SalaryConfig } from '@/stores/salaryConfig'

type SalaryConfigFormProps = {
  staffId?: string
  initialData?: SalaryConfig
  onSubmit: (data: Partial<SalaryConfig>) => void | Promise<void>
  onCancel: () => void
}

export function SalaryConfigForm({ staffId, initialData, onSubmit, onCancel }: SalaryConfigFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const defaultEffectiveFrom = useMemo(
    () => new Date().toISOString().split('T')[0],
    []
  )

  const [form, setForm] = useState<{
    staff_id: string
    base_salary: number
    hourly_rate?: number
    overtime_multiplier: number
    effective_from: string
    effective_to?: string
    notes: string
  }>(() => ({
    staff_id: staffId || initialData?.staff_id || '',
    base_salary: initialData?.base_salary || 0,
    hourly_rate: initialData?.hourly_rate,
    overtime_multiplier: initialData?.overtime_multiplier || 1.5,
    effective_from: initialData?.effective_from || defaultEffectiveFrom,
    effective_to: initialData?.effective_to,
    notes: initialData?.notes || '',
  }))

  useEffect(() => {
    setForm({
      staff_id: staffId || initialData?.staff_id || '',
      base_salary: initialData?.base_salary || 0,
      hourly_rate: initialData?.hourly_rate,
      overtime_multiplier: initialData?.overtime_multiplier || 1.5,
      effective_from: initialData?.effective_from || defaultEffectiveFrom,
      effective_to: initialData?.effective_to,
      notes: initialData?.notes || '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, initialData?.id])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { id, value } = e.target

    if (id === 'hourly_rate') {
      const num = value === '' ? undefined : Number(value)
      setForm((prev) => ({ ...prev, hourly_rate: num }))
      return
    }

    if (id === 'base_salary' || id === 'overtime_multiplier') {
      const num = value === '' ? 0 : Number(value)
      setForm((prev) => ({ ...prev, [id]: num }))
      return
    }

    if (id === 'effective_to') {
      setForm((prev) => ({
        ...prev,
        effective_to: value ? value : undefined,
      }))
      return
    }

    if (id === 'staff_id' || id === 'effective_from' || id === 'notes') {
      setForm((prev) => ({
        ...prev,
        [id]: value,
      }))
      return
    }

    setForm((prev) => ({ ...prev, [id]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      if (!form.staff_id) {
        setError('Please select a staff member')
        return
      }

      if (!form.base_salary && form.base_salary !== 0) {
        setError('Please enter a base salary')
        return
      }

      const payload: Partial<SalaryConfig> = {
        staff_id: form.staff_id,
        base_salary: form.base_salary,
        overtime_multiplier: form.overtime_multiplier,
        effective_from: form.effective_from,
        notes: form.notes || undefined,
        ...(typeof form.hourly_rate === 'number' ? { hourly_rate: form.hourly_rate } : {}),
        ...(form.effective_to ? { effective_to: form.effective_to } : {}),
      }

      await onSubmit(payload)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="base_salary" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Base Salary (€) <span className="text-red-500">*</span>
        </label>
        <input
          id="base_salary"
          value={form.base_salary}
          onChange={handleChange}
          type="number"
          step="0.01"
          required
          min="0"
          className="ui-input"
        />
      </div>

      <div>
        <label htmlFor="hourly_rate" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Hourly Rate (€)
        </label>
        <input
          id="hourly_rate"
          value={form.hourly_rate ?? ''}
          onChange={handleChange}
          type="number"
          step="0.01"
          min="0"
          className="ui-input"
        />
      </div>

      <div>
        <label htmlFor="overtime_multiplier" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Overtime Multiplier
        </label>
        <input
          id="overtime_multiplier"
          value={form.overtime_multiplier}
          onChange={handleChange}
          type="number"
          step="0.1"
          min="1"
          className="ui-input"
        />
        <p className="text-xs text-ui-soft mt-1">Default: 1.5 (time and a half)</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="effective_from" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Effective From <span className="text-red-500">*</span>
          </label>
          <input
            id="effective_from"
            value={form.effective_from}
            onChange={handleChange}
            type="date"
            required
            className="ui-input"
          />
        </div>

        <div>
          <label htmlFor="effective_to" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Effective To (Optional)
          </label>
          <input
            id="effective_to"
            value={form.effective_to ?? ''}
            onChange={handleChange}
            type="date"
            min={form.effective_from}
            className="ui-input"
          />
        </div>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Notes
        </label>
        <textarea
          id="notes"
          value={form.notes}
          onChange={handleChange}
          rows={3}
          className="ui-textarea"
          placeholder="Additional notes about this salary configuration..."
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
        <IOSButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-4 py-2"
        >
          Cancel
        </IOSButton>
        <IOSButton
          type="submit"
          variant="primary"
          disabled={submitting}
          className="px-4 py-2"
        >
          {submitting ? <LoadingSpinner size="sm" /> : 'Save Configuration'}
        </IOSButton>
      </div>
    </form>
  )
}

