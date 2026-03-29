'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.daily-reports'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useDailyReportsStore } from '@/stores/dailyReports'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function TeacherDailyReportsIndexPage() {
  const { t } = useI18n()

  const { dailyReports: reports, loading, error, fetchDailyReports } = useDailyReportsStore()
  const { groups, fetchGroups } = useGroupsStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    fetchGroups()
    fetchDailyReports(undefined, selectedDate)
  }, [fetchGroups, fetchDailyReports, selectedDate])

  const getGroupName = (groupId: string) => {
    const group = (groups || []).find((g: any) => g.id === groupId)
    return group ? group.name : groupId
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">Verwalten Sie die täglichen Berichte für Eltern</p>
        </div>
        <Link href="/teacher/daily-reports/new">
          <IOSButton variant="primary" className="px-5 py-2.5 text-sm font-bold flex items-center gap-2">
            <span>➕</span>
            <span>Neuer Bericht</span>
          </IOSButton>
        </Link>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      ) : error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Berichte'} />
      ) : reports.length === 0 ? (
        <IOSCard className="p-12 text-center">
          <div className="text-5xl opacity-40 mb-4">📝</div>
          <p className="text-gray-500 font-medium">Keine Tagesberichte für dieses Datum gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-5">
          {reports.map((report: any) => (
            <IOSCard key={report.id} className="p-0 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900 truncate">{report.title}</h3>
                      <span className="px-2.5 py-0.5 bg-[#667eea]/10 text-[#667eea] text-xs font-bold rounded-full border border-[#667eea]/10">
                        {getGroupName(report.group_id)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">
                      {formatDate(report.report_date)}
                    </p>
                    <p className="text-gray-700 line-clamp-2 mb-4 leading-relaxed font-medium">
                      {report.content}
                    </p>
                    {report.activities && report.activities.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {report.activities.slice(0, 3).map((activity: string, idx: number) => (
                          <span key={idx} className="px-2 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-lg border border-gray-100">
                            #{activity}
                          </span>
                        ))}
                        {report.activities.length > 3 && (
                          <span className="text-[10px] font-bold text-gray-400">+{report.activities.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex md:flex-col items-center gap-2 flex-shrink-0">
                    <Link href={`/teacher/daily-reports/${report.id}`} className="w-full">
                      <IOSButton variant="secondary" className="w-full px-4 py-2 text-xs font-bold whitespace-nowrap">
                        👁️ Details
                      </IOSButton>
                    </Link>
                    <Link href={`/teacher/daily-reports/${report.id}?edit=true`} className="w-full">
                      <IOSButton variant="secondary" className="w-full px-4 py-2 text-xs font-bold whitespace-nowrap">
                        ✏️ Bearbeiten
                      </IOSButton>
                    </Link>
                  </div>
                </div>
              </div>
            </IOSCard>
          ))}
        </div>
      )}
    </div>
  )
}
