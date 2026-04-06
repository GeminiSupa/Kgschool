'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.daily-reports'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDailyReportsStore } from '@/stores/dailyReports'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminDailyReportsPage() {
  const { t } = useI18n()

  const { dailyReports, loading, error, fetchDailyReports } = useDailyReportsStore()
  const { groups, fetchGroups } = useGroupsStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchGroups()
    fetchDailyReports(undefined, selectedDate)
  }, [fetchGroups, fetchDailyReports, selectedDate])

  const getGroupName = (groupId: string) => {
    const g = (groups || []).find(g => g.id === groupId)
    return g ? g.name : groupId
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE')

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Tägliche Berichte für Eltern über die Gruppenaktivitäten</p>
        </div>
        <Link href="/admin/daily-reports/new">
          <IOSButton variant="primary" className="inline-flex items-center gap-2 text-sm px-4 py-2">
            ➕ Neuer Tagesbericht
          </IOSButton>
        </Link>
      </div>

      <div className="mb-5">
        <input
          type="date"
          value={selectedDate}
          onChange={e => {
            setSelectedDate(e.target.value)
            fetchDailyReports(undefined, e.target.value)
          }}
          className="px-4 py-2.5 bg-white/80 border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : error ? (
        <div className="mb-6"><ErrorAlert message={error.message || 'Fehler'} /></div>
      ) : (
        <IOSCard className="overflow-hidden p-0">
          {dailyReports.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl opacity-40 mb-4">📝</div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Keine Berichte für dieses Datum</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {dailyReports.map(report => (
                <div key={report.id} className="p-5 hover:bg-white/60 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{report.title}</h3>
                        <span className="text-sm text-ui-soft font-medium">{getGroupName(report.group_id)}</span>
                      </div>
                      <p className="text-xs text-ui-soft mb-2 font-medium">📅 {formatDate(report.report_date)}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2 mb-2">{report.content}</p>
                      {report.activities?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {report.activities.slice(0, 3).map((a, i) => (
                            <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{a}</span>
                          ))}
                          {report.activities.length > 3 && (
                            <span className="text-xs text-ui-soft">+{report.activities.length - 3} mehr</span>
                          )}
                        </div>
                      )}
                      {report.photos?.length > 0 && (
                        <p className="text-xs text-ui-soft mt-2">📷 {report.photos.length} Foto{report.photos.length > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/admin/daily-reports/${report.id}`}>
                        <IOSButton variant="secondary" className="text-xs px-3 py-1.5 inline-flex items-center gap-1">
                          👁️ Ansehen
                        </IOSButton>
                      </Link>
                      <Link href={`/admin/daily-reports/${report.id}?edit=true`}>
                        <IOSButton variant="secondary" className="text-xs px-3 py-1.5 inline-flex items-center gap-1">
                          ✏️ Bearbeiten
                        </IOSButton>
                      </Link>
                    </div>
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
