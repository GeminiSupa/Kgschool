'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.daily-reports.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useDailyReportsStore, type DailyReport } from '@/stores/dailyReports'
import { DailyReportForm } from '@/components/forms/DailyReportForm'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

export default function AdminDailyReportsNewPage() {
  const { t } = useI18n()

  const router = useRouter()
  const dailyReportsStore = useDailyReportsStore()

  const [error, setError] = useState('')

  const handleSubmit = async (data: unknown) => {
    try {
      setError('')
      await dailyReportsStore.createDailyReport(data as Partial<DailyReport>)
      alert('Daily report created successfully!')
      router.push('/admin/daily-reports')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create daily report')
    }
  }

  const handleCancel = () => {
    router.push('/admin/daily-reports')
  }

  if (dailyReportsStore.loading && dailyReportsStore.dailyReports.length === 0) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/daily-reports')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Daily Reports
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="max-w-3xl p-6">
        {error && <ErrorAlert message={error} />}
        <DailyReportForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </IOSCard>
    </div>
  )
}

