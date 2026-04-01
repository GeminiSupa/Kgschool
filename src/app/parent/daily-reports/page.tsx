'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.daily-reports'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useDailyReportsStore } from '@/stores/dailyReports'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { sT } from '@/i18n/sT'

export default function ParentDailyReportsPage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const { dailyReports, loading: reportsLoading, error: reportsError, fetchDailyReports } = useDailyReportsStore()
  const { groups, fetchGroups } = useGroupsStore()
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id, selectedDate])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Fetch my children and their groups
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*, groups(id, name)')
        .contains('parent_ids', [user?.id])
      
      if (childrenError) throw childrenError
      setMyChildren(children || [])

      // 2. Fetch daily reports for selected date
      await fetchDailyReports(undefined, selectedDate)
      
      // 3. Fetch groups
      await fetchGroups()
    } catch (e: any) {
      console.error('Error loading parent daily reports:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const myGroupIds = useMemo(() => {
    return Array.from(new Set(myChildren.map(c => c.group_id).filter(Boolean))) as string[]
  }, [myChildren])

  const filteredReports = useMemo(() => {
    return dailyReports.filter(r => myGroupIds.includes(r.group_id))
  }, [dailyReports, myGroupIds])

  const getGroupName = (groupId: string) => {
    const group = (groups || []).find((g: any) => g.id === groupId)
    return group ? group.name : groupId
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Erfahren Sie, was Ihre Kinder heute erlebt haben</p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all shadow-sm"
        />
      </div>

      {loading || reportsLoading ? (
        <div className="flex justify-center py-24"><LoadingSpinner /></div>
      ) : error || reportsError ? (
        <ErrorAlert message={error || reportsError?.message || t(sT('errLoadData'))} />
      ) : filteredReports.length === 0 ? (
        <IOSCard className="p-12 text-center">
          <div className="text-5xl opacity-40 mb-4">✍️</div>
          <p className="text-gray-500 font-medium">Keine Tagesberichte für dieses Datum gefunden.</p>
        </IOSCard>
      ) : (
        <div className="space-y-6">
          {filteredReports.map(report => (
            <IOSCard key={report.id} className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-xl font-bold text-gray-900">{report.title}</h3>
                      <span className="px-2.5 py-0.5 bg-[#667eea]/10 text-[#667eea] text-xs font-bold rounded-full border border-[#667eea]/10">
                        {getGroupName(report.group_id)}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">
                      {formatDate(report.report_date)}
                    </p>
                    <p className="text-gray-700 leading-relaxed font-medium mb-6">
                      {report.content}
                    </p>
                    
                    {report.activities && report.activities.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-3">Aktivitäten des Tages</h4>
                        <div className="flex flex-wrap gap-2">
                          {report.activities.map((activity: string, idx: number) => (
                            <span key={idx} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-xl border border-black/5">
                              ✨ {activity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      {report.weather && (
                        <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/50">
                          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block mb-1">Wetter</span>
                          <span className="text-sm font-bold text-blue-700">☀️ {report.weather}</span>
                        </div>
                      )}
                      {report.special_events && (
                        <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100/50">
                          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Ereignis</span>
                          <span className="text-sm font-bold text-purple-700">🎉 {report.special_events}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <Link href={`/parent/daily-reports/${report.id}`}>
                    <IOSButton variant="secondary" className="px-4 py-2 text-xs font-bold whitespace-nowrap flex items-center gap-2">
                      👁️ Vollständig ansehen
                    </IOSButton>
                  </Link>
                </div>

                {report.photos && report.photos.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {report.photos.slice(0, 4).map((photo: string, idx: number) => (
                        <div key={idx} className="aspect-square rounded-xl overflow-hidden border border-black/5">
                          <img src={photo} alt="Report photo" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    {report.photos.length > 4 && (
                      <p className="text-[10px] font-bold text-gray-400 mt-2">+{report.photos.length - 4} weitere Fotos</p>
                    )}
                  </div>
                )}
              </div>
            </IOSCard>
          ))}
        </div>
      )}
    </div>
  )
}
