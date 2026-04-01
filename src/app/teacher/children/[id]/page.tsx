'use client'

import React, { useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

interface PageProps {
  params: Promise<{ id: string }>
}

type ChildDetail = {
  id: string
  first_name: string
  last_name: string
  date_of_birth: string
  enrollment_date?: string | null
  status: string
  group_id?: string | null
  groups?: { name?: string | null; age_range?: string | null } | null
}

export default function TeacherChildDetailPage({ params }: PageProps) {
  const { t } = useI18n()
  const { id } = use(params)
  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuth()

  const [child, setChild] = useState<ChildDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadChild()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  const loadChild = async () => {
    if (!user?.id) return

    setLoading(true)
    setError('')
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('group_teachers')
        .select('group_id')
        .eq('teacher_id', user.id)
        .is('end_date', null)

      if (assignmentError) throw assignmentError
      const teacherGroupIds = (assignment || []).map((a: { group_id: string }) => a.group_id)

      const { data, error: fetchError } = await supabase
        .from('children')
        .select('id, first_name, last_name, date_of_birth, enrollment_date, status, group_id, groups(name, age_range)')
        .eq('id', id)
        .single()

      if (fetchError) throw fetchError
      if (!data) throw new Error(t(sT('errChildNotFound')))
      if (data.group_id && !teacherGroupIds.includes(data.group_id)) {
        throw new Error(t(sT('errAccessDeniedChild')))
      }

      setChild(data as ChildDetail)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t(sT('errLoadChildDetail')))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string | null | undefined) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('de-DE')
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <ErrorAlert message={error} />
        <Link href="/teacher/children" className="mt-4 inline-block text-[#667eea] font-medium">
          ← Zurueck zu meinen Kindern
        </Link>
      </div>
    )
  }

  if (!child) return null

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/teacher/children"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurueck zu meinen Kindern
        </Link>
        <Heading size="xl" className="mt-2">
          {child.first_name} {child.last_name}
        </Heading>
      </div>

      <IOSCard className="p-0 overflow-hidden">
        <div className="p-5 border-b border-black/5 bg-gray-50/50">
          <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest">Profil</h3>
        </div>
        <div className="divide-y divide-black/5">
          <InfoRow label="Vorname" value={child.first_name} />
          <InfoRow label="Nachname" value={child.last_name} />
          <InfoRow label="Geburtsdatum" value={formatDate(child.date_of_birth)} />
          <InfoRow label="Eintritt" value={formatDate(child.enrollment_date)} />
          <InfoRow label="Gruppe" value={child.groups?.name || 'Keine Gruppe'} />
          <InfoRow label="Altersbereich" value={child.groups?.age_range || '-'} />
          <InfoRow label="Status" value={child.status} />
        </div>
      </IOSCard>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 gap-1">
      <span className="text-sm font-semibold text-gray-500">{label}</span>
      <span className="text-sm sm:text-base font-semibold text-gray-900">{value}</span>
    </div>
  )
}

