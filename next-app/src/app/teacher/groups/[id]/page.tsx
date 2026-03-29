'use client'

import React, { useEffect, useMemo, useState, use } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

interface PageProps {
  params: Promise<{ id: string }>
}

type GroupDetails = {
  id: string
  name: string
  age_range?: string | null
  capacity?: number | null
}

type ChildItem = {
  id: string
  first_name: string
  last_name: string
  status: string
}

export default function TeacherGroupDetailPage({ params }: PageProps) {
  const { id } = use(params)
  const supabase = useMemo(() => createClient(), [])
  const { user } = useAuth()

  const [group, setGroup] = useState<GroupDetails | null>(null)
  const [children, setChildren] = useState<ChildItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    void loadGroup()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user?.id])

  const loadGroup = async () => {
    if (!user?.id) return

    setLoading(true)
    setError('')
    try {
      const { data: assignment, error: assignmentError } = await supabase
        .from('group_teachers')
        .select('group_id')
        .eq('teacher_id', user.id)
        .eq('group_id', id)
        .is('end_date', null)
        .maybeSingle()

      if (assignmentError) throw assignmentError
      if (!assignment) throw new Error('Zugriff verweigert oder Gruppe nicht gefunden.')

      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name, age_range, capacity')
        .eq('id', id)
        .single()
      if (groupError) throw groupError
      setGroup(groupData as GroupDetails)

      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('id, first_name, last_name, status')
        .eq('group_id', id)
        .order('first_name', { ascending: true })
      if (childrenError) throw childrenError
      setChildren((childrenData || []) as ChildItem[])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Gruppendetails konnten nicht geladen werden.')
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
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link href="/teacher/dashboard" className="text-sm font-semibold text-[#667eea] inline-flex items-center gap-1">
          ← Zurueck zum Dashboard
        </Link>
        <Heading size="xl" className="mt-2">
          {group?.name || 'Gruppe'}
        </Heading>
        <p className="text-sm text-gray-500 mt-1">
          {group?.age_range || 'Altersbereich nicht gesetzt'} · Kapazitaet: {group?.capacity ?? '-'}
        </p>
      </div>

      <IOSCard className="p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Kinder in dieser Gruppe</h3>
        {children.length === 0 ? (
          <p className="text-sm text-gray-500">Keine Kinder in dieser Gruppe gefunden.</p>
        ) : (
          <div className="space-y-2">
            {children.map((child) => (
              <Link
                key={child.id}
                href={`/teacher/children/${child.id}`}
                className="flex items-center justify-between rounded-xl border border-gray-200 px-4 py-3 hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">
                  {child.first_name} {child.last_name}
                </span>
                <span className="text-xs text-gray-500">{child.status}</span>
              </Link>
            ))}
          </div>
        )}
      </IOSCard>
    </div>
  )
}

