'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.leave.new'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { useTeacherLeaveRequestsStore } from '@/stores/teacherLeaveRequests'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { TeacherLeaveRequestForm, type TeacherLeaveRequestPayload } from '@/components/forms/TeacherLeaveRequestForm'

export default function NewTeacherLeavePage() {
  const { t } = useI18n()

  const router = useRouter()
  const { user } = useAuth()
  const { createLeaveRequest } = useTeacherLeaveRequestsStore()
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (data: TeacherLeaveRequestPayload) => {
    if (!user?.id) return
    setSubmitting(true)
    try {
      await createLeaveRequest({
        ...data,
        teacher_id: user.id
      })
      alert('Urlaubsantrag erfolgreich eingereicht!')
      router.push('/teacher/leave')
    } catch (e: any) {
      alert(e.message || 'Fehler beim Einreichen des Antrags')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/teacher/leave"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu meinen Anträgen
        </Link>
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Stellen Sie einen neuen Antrag auf Abwesenheit oder Urlaub.</p>
      </div>

      <IOSCard className="p-8">
        <TeacherLeaveRequestForm
          onSubmit={handleSubmit}
          onCancel={() => router.push('/teacher/leave')}
          loading={submitting}
        />
      </IOSCard>
    </div>
  )
}
