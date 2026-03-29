'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.hr.payroll.generate'

import React, { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useSalaryConfigStore } from '@/stores/salaryConfig'
import { Heading } from '@/components/ui/Heading'
import { IOSButton } from '@/components/ui/IOSButton'
import { IOSCard } from '@/components/ui/IOSCard'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type Preview = {
  staffCount: number
  totalAmount: number
}

export default function AdminPayrollGeneratePage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const salaryConfigStore = useSalaryConfigStore()

  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Preview | null>(null)

  const [month, setMonth] = useState(new Date().getMonth() + 1)
  const [year, setYear] = useState(new Date().getFullYear())

  const getMonthName = (m: number) => {
    const date = new Date(2000, m - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  const loadPreview = async () => {
    try {
      setError('')
      setPreview(null)

      const { data: staff } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['teacher', 'support', 'kitchen'])

      const staffList = staff || []
      if (staffList.length === 0) {
        setPreview({ staffCount: 0, totalAmount: 0 })
        return
      }

      let totalAmount = 0
      for (const s of staffList) {
        const config = await salaryConfigStore.getCurrentConfig(s.id)
        if (config) totalAmount += config.base_salary || 0
      }

      setPreview({ staffCount: staffList.length, totalAmount })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load preview')
    }
  }

  const generatePayroll = async () => {
    if (!preview) {
      setError('Please preview first')
      return
    }

    setGenerating(true)
    setError('')

    try {
      const res = await fetch('/api/admin/hr/payroll/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month, year }),
      })

      const data = (await res.json()) as { success?: boolean; message?: string; count?: number }
      if (!data?.success) {
        throw new Error(data?.message || 'Failed to generate payroll')
      }

      alert(`Payroll generated successfully for ${data.count ?? 0} staff members!`)
      router.push('/admin/hr/payroll')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate payroll')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/hr/payroll')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Payroll
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="max-w-2xl p-6 space-y-4">
        {error && <ErrorAlert message={error} />}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void generatePayroll()
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-gray-700 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                id="month"
                value={month}
                onChange={(e) => setMonth(parseInt(e.target.value, 10))}
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
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                id="year"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                type="number"
                required
                min={2020}
                max={2100}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {preview && (
            <div className="p-4 bg-gray-50 rounded-md space-y-2">
              <h3 className="font-medium mb-2">Preview</h3>
              <p className="text-sm text-gray-600">
                This will generate payroll for <strong>{preview.staffCount}</strong> staff members.
              </p>
              <p className="text-sm text-gray-600">
                Total estimated payroll: <strong>€{preview.totalAmount.toFixed(2)}</strong>
              </p>
            </div>
          )}

          <div className="flex gap-3 justify-end pt-4">
            <IOSButton
              type="button"
              variant="secondary"
              onClick={() => router.push('/admin/hr/payroll')}
              className="px-4 py-2"
            >
              Cancel
            </IOSButton>

            <IOSButton
              type="button"
              variant="secondary"
              onClick={() => void loadPreview()}
              disabled={generating}
              className="px-4 py-2"
            >
              Preview
            </IOSButton>

            <IOSButton
              type="submit"
              variant="primary"
              disabled={generating || !preview}
              className="px-4 py-2"
            >
              {generating ? 'Generating...' : 'Generate Payroll'}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}

