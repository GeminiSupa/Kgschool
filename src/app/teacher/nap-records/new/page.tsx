'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.nap-records.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useNapRecordsStore } from '@/stores/napRecords'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { NapRecordForm } from '@/components/forms/NapRecordForm'

export default function NewNapRecordPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { user } = useAuth()
  const { createNapRecord } = useNapRecordsStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: any) => {
    if (!user?.id) return
    setSubmitting(true)
    try {
      await createNapRecord(data, user.id)
      alert('Schlafprotokoll erfolgreich erstellt!')
      router.push('/teacher/nap-records')
    } catch (e: any) {
      alert(e.message || 'Fehler beim Erstellen')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/teacher/nap-records"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Schlafprotokollen
        </Link>
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Dokumentieren Sie die Schlaf- oder Ruhezeit eines Kindes.</p>
      </div>

      <IOSCard className="p-8">
        <NapRecordForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/teacher/nap-records')}
          loading={submitting}
        />
      </IOSCard>
    </div>
  )
}
