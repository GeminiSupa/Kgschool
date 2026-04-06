'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing.timetable'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useGroupsStore, type Group } from '@/stores/groups'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type BillingTimetable = {
  id: string
  group_id: string
  monday: boolean
  tuesday: boolean
  wednesday: boolean
  thursday: boolean
  friday: boolean
  saturday: boolean
  sunday: boolean
  effective_from: string
  effective_to?: string | null
  notes?: string
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

export default function AdminLunchBillingTimetablePage() {
  const { t } = useI18n()

  const router = useRouter()
  const supabase = useMemo(() => createClient(), [])
  const { profile } = useAuth()
  const groupsStore = useGroupsStore()

  const [timetables, setTimetables] = useState<BillingTimetable[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const groups = groupsStore.groups

  const load = async () => {
    try {
      setLoading(true)
      setError('')
      const kitaId = profile?.kita_id || undefined

      const [{ data: timetableData, error: timetableError }] = await Promise.all([
        supabase.from('billing_timetable').select('*').order('effective_from', { ascending: false }),
        groupsStore.fetchGroups(kitaId),
      ])

      if (timetableError) throw timetableError
      setTimetables((timetableData as BillingTimetable[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load timetables')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    return group ? `${group.name}` : groupId
  }

  const getDayBadges = (t: BillingTimetable) => {
    const res: Array<{ label: string; enabled: boolean; tone: string }> = [
      { label: 'Mon', enabled: t.monday, tone: 'bg-blue-100 text-blue-800' },
      { label: 'Tue', enabled: t.tuesday, tone: 'bg-blue-100 text-blue-800' },
      { label: 'Wed', enabled: t.wednesday, tone: 'bg-blue-100 text-blue-800' },
      { label: 'Thu', enabled: t.thursday, tone: 'bg-blue-100 text-blue-800' },
      { label: 'Fri', enabled: t.friday, tone: 'bg-blue-100 text-blue-800' },
      { label: 'Sat', enabled: t.saturday, tone: 'bg-green-100 text-green-800' },
      { label: 'Sun', enabled: t.sunday, tone: 'bg-green-100 text-green-800' },
    ]

    return (
      <div className="flex flex-wrap gap-1">
        {res.map((d) =>
          d.enabled ? (
            <span key={d.label} className={`px-2 py-1 ${d.tone} text-xs rounded`}>
              {d.label}
            </span>
          ) : null
        )}
      </div>
    )
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this timetable?')) return
    try {
      await supabase.from('billing_timetable').delete().eq('id', id)
      await load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to delete timetable')
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push('/admin/lunch/billing')}
            className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
          >
            ← Back to Billing
          </button>
          <Heading size="xl">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-muted mt-2">
            Configure which days of the week are billable for each group
          </p>
        </div>
        <Link href="/admin/lunch/billing/timetable/new">
          <IOSButton className="px-4 py-2 text-sm font-black bg-blue-600 text-white border-none">
            ➕ New Timetable
          </IOSButton>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : timetables.length === 0 ? (
        <IOSCard className="p-8 text-center bg-gray-50/30 border-black/5">
          <div>
            No billing timetables configured.{' '}
            <Link href="/admin/lunch/billing/timetable/new" className="text-[#667eea] hover:underline">
              Create one →
            </Link>
          </div>
        </IOSCard>
      ) : (
        <IOSCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Group</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Days</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">
                    Effective From
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">
                    Effective To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {timetables.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{getGroupName(t.group_id)}</td>
                    <td className="px-6 py-4 text-sm text-ui-soft">{getDayBadges(t)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">{formatDate(t.effective_from)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-ui-soft">
                      {t.effective_to ? formatDate(t.effective_to) : 'Ongoing'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-4">
                        <Link href={`/admin/lunch/billing/timetable/${t.id}`} className="text-blue-600 hover:underline">
                          Edit
                        </Link>
                        <button type="button" onClick={() => void handleDelete(t.id)} className="text-red-600 hover:underline">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </IOSCard>
      )}
    </div>
  )
}

