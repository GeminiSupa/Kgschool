'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.daily-reports.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDailyReportsStore } from '@/stores/dailyReports'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { DailyReportForm } from '@/components/forms/DailyReportForm'

export default function NewDailyReportPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { createDailyReport } = useDailyReportsStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      await createDailyReport(data)
      router.push('/teacher/daily-reports')
    } catch (e: any) {
      alert(e.message || 'Fehler beim Erstellen des Tagesberichts')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/teacher/daily-reports"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Tagesberichten
        </Link>
        <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Teilen Sie die Erlebnisse des Tages mit den Eltern</p>
      </div>

      <IOSCard className="p-8">
        <DailyReportForm
          teacherGroupsOnly={true}
          onSubmit={handleSubmit}
          onCancel={() => router.push('/teacher/daily-reports')}
          loading={submitting}
        />
      </IOSCard>
    </div>
  )
}
