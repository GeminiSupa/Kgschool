'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.children'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

type GroupAssignment = {
  group_id: string
  groups?: { name?: string | null } | null
}

type ChildRow = {
  id: string
  first_name: string
  last_name: string
  status: 'active' | 'inactive' | 'pending'
  group_id?: string | null
  groups?: { name?: string | null } | null
}

export default function TeacherChildrenPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuth()

  const [children, setChildren] = useState<ChildRow[]>([])
  const [groupMap, setGroupMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadChildren()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id])

  const loadChildren = async () => {
    if (!user?.id) return

    setLoading(true)
    setError('')
    try {
      const { data: assignments, error: assignmentsError } = await supabase
        .from('group_teachers')
        .select('group_id, groups(name)')
        .eq('teacher_id', user.id)
        .is('end_date', null)

      if (assignmentsError) throw assignmentsError

      const normalizedAssignments = (assignments || []) as GroupAssignment[]
      const groupIds = normalizedAssignments.map((a) => a.group_id).filter(Boolean)
      const map: Record<string, string> = {}
      normalizedAssignments.forEach((a) => {
        map[a.group_id] = a.groups?.name || a.group_id
      })
      setGroupMap(map)

      if (groupIds.length === 0) {
        setChildren([])
        return
      }

      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, first_name, last_name, status, group_id, groups(name)')
        .in('group_id', groupIds)
        .order('first_name', { ascending: true })

      if (childrenError) throw childrenError
      setChildren((childrenData || []) as ChildRow[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Kinder konnten nicht geladen werden.')
    } finally {
      setLoading(false)
    }
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
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Alle Kinder aus Ihren aktuell zugewiesenen Gruppen.</p>
      </div>

      {children.length === 0 ? (
        <IOSCard className="p-8 text-center">
          <p className="text-gray-500 font-medium">Keine Kinder in Ihren Gruppen gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-4">
          {children.map((child) => (
            <Link key={child.id} href={`/teacher/children/${child.id}`} className="block group">
              <IOSCard className="p-0 overflow-hidden hover:shadow-lg transition-all duration-200 border-black/5 group-hover:border-[#667eea]/30">
                <div className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-linear-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-lg sm:text-xl font-black">
                      {child.first_name[0]}
                      {child.last_name[0]}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-[#667eea] transition-colors">
                        {child.first_name} {child.last_name}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {child.groups?.name || (child.group_id ? groupMap[child.group_id] : '') || 'Keine Gruppe'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={[
                      'px-2.5 py-1 text-xs font-semibold rounded-full w-fit',
                      child.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
                    ].join(' ')}
                  >
                    {child.status === 'active' ? 'Aktiv' : child.status}
                  </span>
                </div>
              </IOSCard>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

