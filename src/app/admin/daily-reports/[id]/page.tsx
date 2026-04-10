'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.daily-reports.id'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useDailyReportsStore, type DailyReport } from '@/stores/dailyReports'
import { useGroupsStore, type Group } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'

type Params = { id?: string }

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

export default function AdminDailyReportDetailPage() {
  const { t } = useI18n()

  const router = useRouter()
  const params = useParams() as Params
  const reportId = params.id || ''

  const dailyReportsStore = useDailyReportsStore()
  const groupsStore = useGroupsStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [report, setReport] = useState<DailyReport | null>(null)

  const groups: Group[] = groupsStore.groups

  const getGroupName = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId)
    return group ? group.name : groupId
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        await dailyReportsStore.fetchDailyReports()
        const found = dailyReportsStore.dailyReports.find((r) => r.id === reportId) || null
        setReport(found)

        await groupsStore.fetchGroups()
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load daily report')
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId])

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mb-6">
        <ErrorAlert message={error} />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/daily-reports')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Daily Reports
        </button>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      {!report ? (
        <div className="p-8 text-center text-ui-soft">Daily report not found.</div>
      ) : (
        <IOSCard className="p-6 max-w-3xl">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-ui-soft">Title</h3>
              <p className="mt-1 text-lg text-slate-900 dark:text-slate-50">{report.title}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-ui-soft">Group</h3>
              <p className="mt-1 text-slate-900 dark:text-slate-50">{getGroupName(report.group_id)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-ui-soft">Date</h3>
              <p className="mt-1 text-slate-900 dark:text-slate-50">{formatDate(report.report_date)}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-ui-soft">Content</h3>
              <p className="mt-1 text-slate-900 dark:text-slate-50 whitespace-pre-wrap">{report.content}</p>
            </div>

            {report.activities && report.activities.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-ui-soft">Activities</h3>
                <ul className="mt-1 list-disc list-inside text-slate-900 dark:text-slate-50">
                  {report.activities.map((activity) => (
                    <li key={activity}>{activity}</li>
                  ))}
                </ul>
              </div>
            )}

            {report.weather && (
              <div>
                <h3 className="text-sm font-medium text-ui-soft">Weather</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{report.weather}</p>
              </div>
            )}

            {report.special_events && (
              <div>
                <h3 className="text-sm font-medium text-ui-soft">Special Events</h3>
                <p className="mt-1 text-slate-900 dark:text-slate-50">{report.special_events}</p>
              </div>
            )}

            {report.photos && report.photos.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-ui-soft mb-2">Photos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {report.photos.map((photo) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      key={photo}
                      src={photo}
                      alt="Report photo"
                      className="w-full h-32 object-cover rounded-md"
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </IOSCard>
      )}
    </div>
  )
}

