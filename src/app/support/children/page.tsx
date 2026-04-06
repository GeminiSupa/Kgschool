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
        <label htmlFor="support-children-search" className="sr-only">
          Search children
        </label>
        <input
          id="support-children-search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          type="search"
          placeholder="Search children..."
          autoComplete="off"
          className="min-h-11 w-full max-w-md rounded-lg border-2 border-border bg-background px-4 py-2 text-sm outline-none transition-colors placeholder:text-muted focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30"
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
            <div className="p-8 text-center text-ui-soft">No children found.</div>
          ) : (
            <div className="divide-y divide-border">
              {filteredChildren.map((child) => (
                <div key={child.id} className="p-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-50">
                        {child.first_name} {child.last_name}
                      </p>
                      <p className="text-sm text-ui-muted mt-1">Group: {getGroupName(child.group_id) || 'Unassigned'}</p>
                      <p className="text-xs text-ui-soft mt-1">
                        DOB: {formatDate(child.date_of_birth)} | Status: {child.status}
                      </p>
                    </div>
                    <Link
                      href={`/support/children/${child.id}`}
                      className="inline-flex min-h-10 items-center justify-center rounded-lg bg-indigo-500/10 px-3 py-2 text-sm font-semibold text-indigo-800 transition-colors hover:bg-indigo-500/15 dark:bg-indigo-950/50 dark:text-indigo-200 dark:hover:bg-indigo-900/50"
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

