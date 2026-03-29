'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.nap-records'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useNapRecordsStore } from '@/stores/napRecords'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function TeacherNapRecordsPage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const { napRecords, loading: recordsLoading, error: recordsError, fetchNapRecords } = useNapRecordsStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [selectedChildId, setSelectedChildId] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadInitialData()
    }
  }, [user?.id])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchNapRecords(undefined, selectedDate),
        fetchChildren()
      ])
    } catch (e) {
      console.error('Error loading nap records data:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleFetch = async () => {
    await fetchNapRecords(selectedChildId || undefined, selectedDate || undefined)
  }

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE')
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">Dokumentieren Sie Schlaf- und Ruhezeiten der Kinder.</p>
        </div>
        <Link href="/teacher/nap-records/new">
          <IOSButton variant="primary" className="px-6 py-2.5 text-sm font-bold flex items-center gap-2">
            <span>➕</span>
            <span>Neuer Eintrag</span>
          </IOSButton>
        </Link>
      </div>

      <div className="flex flex-wrap gap-4 mb-8 bg-[#f2f2f7] p-2 rounded-2xl w-fit">
        <div className="animate-in fade-in duration-500">
            <select
              value={selectedChildId}
              onChange={(e) => { setSelectedChildId(e.target.value); setTimeout(() => handleFetch(), 10) }}
              className="px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all shadow-sm"
            >
              <option value="">Alle Kinder</option>
              {children.map(child => (
                <option key={child.id} value={child.id}>
                  {child.first_name} {child.last_name}
                </option>
              ))}
            </select>
        </div>
        <div className="animate-in fade-in duration-500 delay-75">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => { setSelectedDate(e.target.value); setTimeout(() => handleFetch(), 10) }}
              className="px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all shadow-sm"
            />
        </div>
      </div>

      {recordsError ? (
        <ErrorAlert message={recordsError.message} />
      ) : napRecords.length === 0 ? (
        <IOSCard className="p-16 text-center bg-gray-50/50">
          <div className="text-5xl opacity-40 mb-4">😴</div>
          <p className="text-gray-500 font-medium">Keine Schlafprotokolle für diesen Zeitraum gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-3">
          {napRecords.map(record => (
            <IOSCard key={record.id} className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-black/5">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-black text-gray-900 tracking-tight">{getChildName(record.child_id)}</h4>
                        <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-purple-100">
                          😴 {record.duration_minutes ? `${record.duration_minutes} Min.` : 'Unbekannt'}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400 mb-4">
                        <div className="flex items-center gap-1.5">
                            <span>📅</span> {formatDate(record.nap_date)}
                        </div>
                        {(record.start_time || record.end_time) && (
                           <div className="flex items-center gap-1.5">
                               <span>🕐</span> {record.start_time || '?'} – {record.end_time || '?'}
                           </div>
                        )}
                    </div>
                    
                    {record.notes && (
                        <p className="text-sm font-medium text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100">
                            {record.notes}
                        </p>
                    )}
                  </div>
                  
                  <Link href={`/teacher/nap-records/${record.id}`}>
                      <IOSButton variant="secondary" className="text-xs py-2 px-4 h-auto font-black border-black/5">
                        Details
                      </IOSButton>
                  </Link>
                </div>
              </div>
            </IOSCard>
          ))}
        </div>
      )}
    </div>
  )
}
