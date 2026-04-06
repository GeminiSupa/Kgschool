'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useKita } from '@/hooks/useKita'
import type { Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'

export default function SupportChildDetailPage() {
  const { id } = useParams()
  const childId = typeof id === 'string' ? id : Array.isArray(id) ? id[0] : ''
  const supabase = createClient()
  const { getUserKitaId } = useKita()

  const [child, setChild] = useState<Child | null>(null)
  const [groupName, setGroupName] = useState('')
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function run() {
      if (!childId) {
        setLoading(false)
        return
      }
      setLoading(true)
      setForbidden(false)
      setChild(null)
      setGroupName('')
      try {
        const kitaId = await getUserKitaId()
        const { data, error } = await supabase.from('children').select('*').eq('id', childId).maybeSingle()
        if (error) throw error
        if (cancelled) return
        if (!data) {
          setChild(null)
          return
        }
        const row = data as Child
        if (kitaId && row.kita_id && row.kita_id !== kitaId) {
          setForbidden(true)
          setChild(null)
          return
        }
        setChild(row)

        if (row.group_id) {
          const { data: g } = await supabase.from('groups').select('name').eq('id', row.group_id).maybeSingle()
          if (!cancelled) setGroupName(g?.name || row.group_id)
        }
      } catch (e) {
        console.error(e)
        if (!cancelled) setChild(null)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [childId, supabase, getUserKitaId])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <p className="font-semibold text-slate-900 dark:text-slate-50">Access denied</p>
        <p className="mt-2 text-sm text-ui-muted">This child is not in your organization.</p>
        <Link href="/support/children" className="mt-6 inline-block text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          ← Back to list
        </Link>
      </div>
    )
  }

  if (!child) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-ui-soft">
        Child not found.
        <div className="mt-4">
          <Link href="/support/children" className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
            ← Back to list
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl pb-12">
      <Link
        href="/support/children"
        className="mb-4 inline-flex min-h-10 items-center text-sm font-semibold text-indigo-600 transition-transform hover:-translate-x-0.5 dark:text-indigo-400"
      >
        ← Back to children
      </Link>

      <div className="mb-8">
        <Heading size="xl" className="tracking-tight text-slate-900 dark:text-slate-50">
          {child.first_name} {child.last_name}
        </Heading>
        <p className="mt-2 text-sm text-ui-soft">Read-only view for support staff</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-md border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${
              child.status === 'active'
                ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950/40 dark:text-green-200'
                : child.status === 'inactive'
                  ? 'border-border bg-slate-50 text-ui-soft dark:bg-white/5'
                  : 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
            }`}
          >
            {child.status}
          </span>
        </div>
      </div>

      <IOSCard className="border-border p-8 shadow-sm">
        <p className="mb-6 text-[10px] font-black uppercase tracking-widest text-ui-soft">Profile</p>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-bold text-ui-soft">First name</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-50">{child.first_name}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-ui-soft">Last name</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-50">{child.last_name}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-ui-soft">Date of birth</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-50">
              {new Date(child.date_of_birth).toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-ui-soft">Enrollment</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-50">
              {new Date(child.enrollment_date).toLocaleDateString()}
            </p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-bold text-ui-soft">Group</p>
            <p className="text-base font-bold text-slate-900 dark:text-slate-50">{groupName || 'Unassigned'}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="mb-1 text-xs font-bold text-ui-soft">Last updated</p>
            <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
              {new Date(child.updated_at).toLocaleString()}
            </p>
          </div>
        </div>
      </IOSCard>

      {child.parent_ids && child.parent_ids.length > 0 && (
        <IOSCard className="mt-6 border-border p-8 shadow-sm">
          <p className="mb-4 text-[10px] font-black uppercase tracking-widest text-ui-soft">Linked parent IDs</p>
          <ul className="space-y-2 text-sm">
            {child.parent_ids.map((pid) => (
              <li key={pid} className="rounded-lg border border-border bg-slate-50 px-3 py-2 font-mono text-xs dark:bg-white/5">
                {pid}
              </li>
            ))}
          </ul>
        </IOSCard>
      )}
    </div>
  )
}
