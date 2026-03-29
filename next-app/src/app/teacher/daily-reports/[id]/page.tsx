'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.daily-reports.id'

import React, { useEffect, useState, use } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useDailyReportsStore } from '@/stores/dailyReports'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { DailyReportForm } from '@/components/forms/DailyReportForm'

interface PageProps {
  params: Promise<{ id: string }>
}

export default function TeacherDailyReportDetailPage({ params }: PageProps) {
  const { t } = useI18n()

  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { dailyReports: reports, loading, error, fetchDailyReports, updateDailyReport, deleteDailyReport } = useDailyReportsStore()
  const { groups, fetchGroups } = useGroupsStore()

  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchGroups()
    fetchDailyReports()
  }, [fetchGroups, fetchDailyReports])

  const report = reports.find(r => r.id === id)

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

  const handleUpdate = async (data: any) => {
    setSubmitting(true)
    try {
      await updateDailyReport(id, data)
      setIsEditing(false)
      await fetchDailyReports()
    } catch (e: any) {
      alert(e.message || 'Fehler beim Aktualisieren')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Bericht wirklich löschen?')) return
    try {
      await deleteDailyReport(id)
      router.push('/teacher/daily-reports')
    } catch (e: any) {
      alert(e.message || 'Fehler beim Löschen')
    }
  }

  if (loading && !report) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <ErrorAlert message={error.message || 'Fehler beim Laden'} />
        <Link href="/teacher/daily-reports" className="mt-4 inline-block text-[#667eea] font-medium">
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="max-w-2xl mx-auto py-24 px-4 text-center">
        <div className="text-5xl mb-4">🔍</div>
        <Heading size="lg">Bericht nicht gefunden</Heading>
        <Link href="/teacher/daily-reports" className="mt-4 inline-block text-[#667eea] font-medium">
          ← Zurück zur Übersicht
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/teacher/daily-reports"
            className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
          >
            ← Zurück zu Tagesberichten
          </Link>
          <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
        </div>
        {!isEditing && (
          <div className="flex items-center gap-2">
            <IOSButton
              variant="secondary"
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 text-sm font-bold flex items-center gap-2"
            >
              ✏️ Bearbeiten
            </IOSButton>
            <IOSButton
              variant="secondary"
              onClick={handleDelete}
              className="px-4 py-2 text-sm font-bold text-red-500 hover:text-red-600 flex items-center gap-2"
            >
              🗑️ Löschen
            </IOSButton>
          </div>
        )}
      </div>

      <IOSCard className={isEditing ? 'p-8' : 'p-0 overflow-hidden'}>
        {isEditing ? (
          <DailyReportForm
            initialData={report}
            teacherGroupsOnly={true}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            loading={submitting}
          />
        ) : (
          <div className="divide-y divide-black/5">
            <div className="p-8">
              <div className="flex items-center gap-4 mb-4">
                <span className="px-3 py-1 bg-[#667eea]/10 text-[#667eea] text-xs font-bold rounded-full border border-[#667eea]/10">
                  {getGroupName(report.group_id)}
                </span>
                <span className="text-xs font-bold text-black/40 uppercase tracking-widest leading-none">
                  {formatDate(report.report_date)}
                </span>
              </div>
              <h1 className="text-3xl font-black text-gray-900 mb-6 tracking-tight">{report.title}</h1>
              <p className="text-lg text-gray-700 leading-relaxed font-medium whitespace-pre-wrap">
                {report.content}
              </p>
            </div>

            {report.activities && report.activities.length > 0 && (
              <div className="p-8 bg-gray-50/50">
                <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Heute durchgeführte Aktivitäten</h3>
                <div className="flex flex-wrap gap-2">
                  {report.activities.map((activity: string, idx: number) => (
                    <span key={idx} className="px-4 py-2 bg-white text-gray-800 text-sm font-bold rounded-xl border border-black/5 shadow-sm">
                      ✨ {activity}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {(report.weather || report.special_events) && (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                {report.weather && (
                  <div>
                    <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Wetter</h3>
                    <p className="text-base font-bold text-gray-800">☀️ {report.weather}</p>
                  </div>
                )}
                {report.special_events && (
                  <div>
                    <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-2">Besondere Ereignisse</h3>
                    <p className="text-base font-bold text-gray-800">🎉 {report.special_events}</p>
                  </div>
                )}
              </div>
            )}

            {report.photos && report.photos.length > 0 && (
              <div className="p-8">
                <h3 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-4">Impressionen des Tages</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {report.photos.map((photo: string, index: number) => (
                    <div key={index} className="aspect-video rounded-2xl overflow-hidden border border-black/5 group cursor-pointer relative">
                      <img
                        src={photo}
                        alt={`Report photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </IOSCard>
    </div>
  )
}
