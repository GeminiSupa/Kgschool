'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.hr.salary-config.id'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSalaryConfigStore, type SalaryConfig } from '@/stores/salaryConfig'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { SalaryConfigForm } from '@/components/forms/SalaryConfigForm'

export default function AdminSalaryConfigEditPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams<{ id: string }>()
  const configId = params?.id

  const salaryConfigStore = useSalaryConfigStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [config, setConfig] = useState<SalaryConfig | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setError('')
        await salaryConfigStore.fetchConfigs()

        if (!configId) throw new Error('Configuration not found')

        const found = salaryConfigStore.configs.find((c) => c.id === configId) || null
        if (!found) {
          setError('Configuration not found')
          setConfig(null)
          return
        }

        setConfig(found)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load configuration')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [configId])

  const handleCancel = () => {
    router.push('/admin/hr/salary-config')
  }

  const handleUpdate = async (data: Partial<SalaryConfig>) => {
    if (!configId) return
    try {
      setError('')
      await salaryConfigStore.updateConfig(configId, data)
      alert('Salary configuration updated successfully!')
      router.push('/admin/hr/salary-config')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update configuration')
    }
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/hr/salary-config')}
          className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
        >
          ← Back to Salary Config
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : config ? (
        <IOSCard className="max-w-2xl p-6">
          <SalaryConfigForm
            staffId={config.staff_id}
            initialData={config}
            onSubmit={(data) => void handleUpdate(data)}
            onCancel={handleCancel}
          />
        </IOSCard>
      ) : (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <p className="text-gray-400 font-bold">No configuration found.</p>
        </IOSCard>
      )}
    </div>
  )
}

