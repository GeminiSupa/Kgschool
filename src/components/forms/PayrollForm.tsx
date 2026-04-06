'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { StaffPayroll } from '@/stores/payroll'

type PayrollFormProps = {
  staffId?: string
  initialData?: StaffPayroll
  onSubmit: (data: Partial<StaffPayroll>) => void | Promise<void>
  onCancel: () => void
}

type PayrollFormState = {
  staff_id: string
  month: number
  year: number
  base_salary: number
  overtime_hours: number
  overtime_rate: number
  overtime_amount: number
  bonuses: number
  deductions: number
  tax_amount: number
  net_salary: number
  status: 'draft' | 'approved' | 'paid'
  notes: string
}

function toNumber(value: string) {
  if (value === '') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function PayrollForm({ staffId, initialData, onSubmit, onCancel }: PayrollFormProps) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const defaultMonth = useMemo(() => new Date().getMonth() + 1, [])
  const defaultYear = useMemo(() => new Date().getFullYear(), [])

  const [form, setForm] = useState<PayrollFormState>(() => ({
    staff_id: staffId || initialData?.staff_id || '',
    month: initialData?.month || defaultMonth,
    year: initialData?.year || defaultYear,
    base_salary: initialData?.base_salary || 0,
    overtime_hours: initialData?.overtime_hours || 0,
    overtime_rate: initialData?.overtime_rate || 0,
    overtime_amount: initialData?.overtime_amount || 0,
    bonuses: initialData?.bonuses || 0,
    deductions: initialData?.deductions || 0,
    tax_amount: initialData?.tax_amount || 0,
    net_salary: initialData?.net_salary || 0,
    status: initialData?.status || 'draft',
    notes: initialData?.notes || '',
  }))

  useEffect(() => {
    setForm({
      staff_id: staffId || initialData?.staff_id || '',
      month: initialData?.month || defaultMonth,
      year: initialData?.year || defaultYear,
      base_salary: initialData?.base_salary || 0,
      overtime_hours: initialData?.overtime_hours || 0,
      overtime_rate: initialData?.overtime_rate || 0,
      overtime_amount: initialData?.overtime_amount || 0,
      bonuses: initialData?.bonuses || 0,
      deductions: initialData?.deductions || 0,
      tax_amount: initialData?.tax_amount || 0,
      net_salary: initialData?.net_salary || 0,
      status: initialData?.status || 'draft',
      notes: initialData?.notes || '',
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, initialData?.id])

  // Auto-calculate overtime amount from hours * rate.
  useEffect(() => {
    const hours = form.overtime_hours || 0
    const rate = form.overtime_rate || 0
    const overtime_amount = hours * rate
    setForm((prev) => ({ ...prev, overtime_amount }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.overtime_hours, form.overtime_rate])

  // Auto-calculate net salary.
  useEffect(() => {
    const net_salary =
      (form.base_salary || 0) +
      (form.overtime_amount || 0) +
      (form.bonuses || 0) -
      (form.deductions || 0) -
      (form.tax_amount || 0)

    setForm((prev) => ({ ...prev, net_salary }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.base_salary, form.overtime_amount, form.bonuses, form.deductions, form.tax_amount])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { id, value } = e.target

    const numberFields: Array<keyof PayrollFormState> = [
      'month',
      'year',
      'base_salary',
      'overtime_hours',
      'overtime_rate',
      'overtime_amount',
      'bonuses',
      'deductions',
      'tax_amount',
      'net_salary',
    ]

    if (numberFields.includes(id as keyof PayrollFormState)) {
      const nextValue = toNumber(value)
      setForm((prev) => ({ ...prev, [id]: nextValue } as PayrollFormState))
      return
    }

    if (id === 'status') {
      setForm((prev) => ({ ...prev, status: value as PayrollFormState['status'] }))
      return
    }

    if (id === 'staff_id' || id === 'notes') {
      setForm((prev) => ({ ...prev, [id]: value } as PayrollFormState))
      return
    }

    // Fallback (shouldn't happen)
    setForm((prev) => ({ ...prev, [id]: value } as unknown as PayrollFormState))
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
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

      if (!form.month || !form.year) {
        setError('Please select month and year')
        return
      }

      if (!form.net_salary && form.net_salary !== 0) {
        setError('Please enter a net salary')
        return
      }

      await onSubmit({
        staff_id: form.staff_id,
        month: form.month,
        year: form.year,
        base_salary: form.base_salary,
        overtime_hours: form.overtime_hours,
        overtime_rate: form.overtime_rate,
        overtime_amount: form.overtime_amount,
        bonuses: form.bonuses,
        deductions: form.deductions,
        tax_amount: form.tax_amount,
        net_salary: form.net_salary,
        status: form.status,
        notes: form.notes || undefined,
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save payroll')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="month" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Month <span className="text-red-500">*</span>
          </label>
          <select
            id="month"
            value={form.month}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {getMonthName(m)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Year <span className="text-red-500">*</span>
          </label>
          <input
            id="year"
            value={form.year}
            onChange={handleChange}
            type="number"
            required
            min={2020}
            max={2100}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="overtime_hours" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Overtime Hours
          </label>
          <input
            id="overtime_hours"
            value={form.overtime_hours}
            onChange={handleChange}
            type="number"
            step="0.5"
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="overtime_rate" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Overtime Rate (€/hour)
          </label>
          <input
            id="overtime_rate"
            value={form.overtime_rate}
            onChange={handleChange}
            type="number"
            step="0.01"
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="overtime_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Overtime Amount (€)
          </label>
          <input
            id="overtime_amount"
            value={form.overtime_amount}
            onChange={handleChange}
            type="number"
            step="0.01"
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="bonuses" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Bonuses (€)
          </label>
          <input
            id="bonuses"
            value={form.bonuses}
            onChange={handleChange}
            type="number"
            step="0.01"
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="deductions" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Deductions (€)
          </label>
          <input
            id="deductions"
            value={form.deductions}
            onChange={handleChange}
            type="number"
            step="0.01"
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="tax_amount" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Tax Amount (€)
          </label>
          <input
            id="tax_amount"
            value={form.tax_amount}
            onChange={handleChange}
            type="number"
            step="0.01"
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="net_salary" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
            Net Salary (€) <span className="text-red-500">*</span>
          </label>
          <input
            id="net_salary"
            value={form.net_salary}
            onChange={handleChange}
            type="number"
            step="0.01"
            required
            min={0}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
          Status <span className="text-red-500">*</span>
        </label>
        <select
          id="status"
          value={form.status}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        >
          <option value="draft">Draft</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
        </select>
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
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          placeholder="Additional notes..."
        />
      </div>

      {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

      <div className="flex gap-3 justify-end pt-4">
        <IOSButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          className="px-4 py-2"
        >
          Cancel
        </IOSButton>
        <IOSButton type="submit" variant="primary" disabled={submitting} className="px-4 py-2">
          {submitting ? <LoadingSpinner size="sm" /> : 'Save Payroll'}
        </IOSButton>
      </div>
    </form>
  )
}

