'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useKita } from '@/hooks/useKita'
import { useGroupsStore, type Group } from '@/stores/groups'
import type { Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import Link from 'next/link'

export default function SupportChildrenPage() {
  const supabase = useMemo(() => createClient(), [])
  const { getUserKitaId } = useKita()

  const groupsStore = useGroupsStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [children, setChildren] = useState<Child[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [groups, setGroups] = useState<Group[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        const kitaId = await getUserKitaId()

        let query = supabase.from('children').select('*').eq('status', 'active').order('first_name')
        if (kitaId) query = query.eq('kita_id', kitaId)

        const { data, error: fetchErr } = await query
        if (fetchErr) throw fetchErr
        setChildren((data || []) as Child[])

        await groupsStore.fetchGroups(kitaId || undefined)
        setGroups(groupsStore.groups)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load children')
      } finally {
        setLoading(false)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filteredChildren = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return children
    return children.filter(
      (child) =>
        child.first_name.toLowerCase().includes(q) || child.last_name.toLowerCase().includes(q)
    )
  }, [children, searchQuery])

  const getGroupName = (groupId?: string) => {
    if (!groupId) return ''
    return groups.find((g) => g.id === groupId)?.name || ''
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  return (
    <div>
      <Heading size="xl" className="mb-6">
        Children (Read-Only)
      </Heading>

      <div className="mb-4">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="text"
          placeholder="Search children..."
          className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : (
        <IOSCard className="p-0 overflow-hidden">
          {filteredChildren.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No children found.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredChildren.map((child) => (
                <div key={child.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">Group: {getGroupName(child.group_id) || 'Unassigned'}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        DOB: {formatDate(child.date_of_birth)} | Status: {child.status}
                      </p>
                    </div>
                    <Link
                      href={`/parent/children/${child.id}`}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </IOSCard>
      )}
    </div>
  )
}

