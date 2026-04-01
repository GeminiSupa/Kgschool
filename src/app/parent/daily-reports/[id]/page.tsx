'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.daily-reports.id'

import React, { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useDailyReportsStore } from '@/stores/dailyReports'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { sT } from '@/i18n/sT'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function ParentDailyReportDetailPage({ params }: PageProps) {
  const { t } = useI18n()

  const { id } = use(params)
  const { dailyReports: reports, loading, error, fetchDailyReports } = useDailyReportsStore()
  const { groups, fetchGroups } = useGroupsStore()
  const [report, setReport] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchGroups()
    loadReport()
  }, [id])

  const loadReport = async () => {
    try {
      await fetchDailyReports()
      const found = reports.find(r => r.id === id)
      if (found) {
        setReport(found)
      } else {
        // Direct fetch if not in store
        const { data, error: fetchError } = await supabase
          .from('daily_reports')
          .select('*')
          .eq('id', id)
          .single()
        if (fetchError) throw fetchError
        setReport(data)
      }
    } catch (e) {
      console.error('Error loading report:', e)
    }
  }

  const getGroupName = (groupId: string) => {
    const group = (groups || []).find((g: any) => g.id === groupId)
    return group ? group.name : groupId
  }

  const formatDate = (d: string) => {
    return new Date(d).toLocaleDateString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading && !report) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (error) return (
    <div className="max-w-2xl mx-auto py-10 px-4">
        <ErrorAlert message={error.message || 'Fehler beim Laden'} />
        <Link href="/parent/daily-reports" className="mt-4 inline-block text-[#667eea] font-medium">← Zurück zur Übersicht</Link>
    </div>
  )
  if (!report) return (
    <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <Heading size="lg">{t(sT('errNotFoundDailyReport'))}</Heading>
        <Link href="/parent/daily-reports" className="mt-4 inline-block text-[#667eea] font-medium font-fiori">← Zurück zur Übersicht</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8 font-fiori">
        <Link
          href="/parent/daily-reports"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Tagesberichten
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="p-0 overflow-hidden shadow-xl border-black/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="px-3 py-1 bg-[#667eea]/10 text-[#667eea] text-xs font-bold rounded-full border border-[#667eea]/10 shadow-sm">
                {getGroupName(report.group_id)}
            </span>
            <span className="text-xs font-bold text-black/40 uppercase tracking-widest leading-none">
                {formatDate(report.report_date)}
            </span>
          </div>
          <h1 className="text-4xl font-black text-gray-900 mb-8 tracking-tighter leading-tight">{report.title}</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-xl text-gray-700 leading-relaxed font-medium whitespace-pre-wrap select-text selection:bg-[#667eea]/20">
              {report.content}
            </p>
          </div>
        </div>

        {report.activities && report.activities.length > 0 && (
          <div className="p-8 bg-gray-50/50 border-t border-black/5">
            <h3 className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-4">Heute durchgeführte Aktivitäten</h3>
            <div className="flex flex-wrap gap-2">
              {report.activities.map((activity: string, idx: number) => (
                <div key={idx} className="px-5 py-2.5 bg-white text-gray-800 text-sm font-bold rounded-2xl border border-black/5 shadow-sm hover:scale-105 transition-transform cursor-default">
                  ✨ {activity}
                </div>
              ))}
            </div>
          </div>
        )}

        {(report.weather || report.special_events) && (
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-black/5">
            {report.weather && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-xl shadow-inner border border-blue-100">☀️</div>
                <div>
                  <h3 className="text-[10px] font-black text-black/30 uppercase tracking-wider mb-1">Wetter heute</h3>
                  <p className="text-lg font-bold text-gray-800">{report.weather}</p>
                </div>
              </div>
            )}
            {report.special_events && (
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-xl shadow-inner border border-purple-100">🎉</div>
                <div>
                  <h3 className="text-[10px] font-black text-black/30 uppercase tracking-wider mb-1">Besonderes Ereignis</h3>
                  <p className="text-lg font-bold text-gray-800">{report.special_events}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {report.photos && report.photos.length > 0 && (
          <div className="p-8 border-t border-black/5 bg-[#f2f2f7]/30">
            <h3 className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em] mb-6">Impressionen des Tages</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {report.photos.map((photo: string, index: number) => (
                <div key={index} className="aspect-video rounded-3xl overflow-hidden border-4 border-white shadow-lg group cursor-pointer relative ring-1 ring-black/5">
                  <img
                    src={photo}
                    alt={`Report photo ${index + 1}`}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
              ))}
            </div>
          </div>
        )}
      </IOSCard>
    </div>
  )
}
