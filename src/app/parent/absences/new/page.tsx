'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.absences.new'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useLeaveRequestsStore } from '@/stores/leaveRequests'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'
import { LeaveRequestForm } from '@/components/forms/LeaveRequestForm'

export default function NewLeaveRequestPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { user } = useAuth()
  const { createLeaveRequest } = useLeaveRequestsStore()
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      fetchChildren()
    }
  }, [user?.id])

  const fetchChildren = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .contains('parent_ids', [user?.id])
      
      if (error) throw error
      setMyChildren(data || [])
    } catch (e) {
      console.error('Error fetching children:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: any) => {
    setSubmitting(true)
    try {
      await createLeaveRequest({
        ...data,
        parent_id: user?.id
      })
      alert('Abwesenheitsanfrage erfolgreich gesendet!')
      router.push('/parent/dashboard')
    } catch (e: any) {
      alert(e.message || 'Fehler beim Senden der Anfrage')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/parent/dashboard"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zum Dashboard
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Informieren Sie uns über die geplante Abwesenheit Ihres Kindes.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      ) : (
        <IOSCard className="p-8">
          <LeaveRequestForm
            children={myChildren}
            onSubmit={handleSubmit}
            onCancel={() => router.push('/parent/dashboard')}
            loading={submitting}
          />
        </IOSCard>
      )}
    </div>
  )
}
