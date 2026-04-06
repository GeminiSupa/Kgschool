'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.hr.salary-config.new'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useSalaryConfigStore, type SalaryConfig } from '@/stores/salaryConfig'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { SalaryConfigForm } from '@/components/forms/SalaryConfigForm'

type StaffProfile = {
  id: string
  full_name: string
  role: string
}

export default function AdminSalaryConfigNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = createClient()
  const salaryConfigStore = useSalaryConfigStore()

  const [staff, setStaff] = useState<StaffProfile[]>([])
  const [staffLoading, setStaffLoading] = useState(true)

  const [form, setForm] = useState<{ staff_id: string }>({ staff_id: '' })
  const [error, setError] = useState('')

  useEffect(() => {
    const run = async () => {
      try {
        setStaffLoading(true)
        setError('')

        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, role')
          .in('role', ['teacher', 'support', 'kitchen'])
          .order('full_name')

        setStaff((data as StaffProfile[]) || [])
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load staff')
      } finally {
        setStaffLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCancel = () => {
    router.push('/admin/hr/salary-config')
  }

  const handleFormSubmit = async (data: Partial<SalaryConfig>) => {
    try {
      setError('')
      await salaryConfigStore.createConfig(data)
      alert('Salary configuration created successfully!')
      router.push('/admin/hr/salary-config')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create configuration')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/hr/salary-config')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Salary Config
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="max-w-2xl p-6">
        {error && <ErrorAlert message={error} />}

        {staffLoading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label htmlFor="staff_id" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Staff Member <span className="text-red-500">*</span>
              </label>
              <select
                id="staff_id"
                value={form.staff_id}
                onChange={(e) => setForm({ staff_id: e.target.value })}
                required
                disabled={staffLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <option value="">{staffLoading ? 'Loading...' : 'Select staff member'}</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({s.role})
                  </option>
                ))}
              </select>
            </div>

            <SalaryConfigForm
              staffId={form.staff_id}
              onSubmit={(data) => void handleFormSubmit(data)}
              onCancel={handleCancel}
            />
          </div>
        )}
      </IOSCard>
    </div>
  )
}

