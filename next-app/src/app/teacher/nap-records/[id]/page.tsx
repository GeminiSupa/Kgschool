'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.nap-records.id'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useNapRecordsStore } from '@/stores/napRecords'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function NapRecordDetailPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { id } = useParams()
  const { napRecords, loading: recordsLoading, fetchNapRecords } = useNapRecordsStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [record, setRecord] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchNapRecords(),
        fetchChildren()
      ])
    } catch (e) {
      console.error('Error loading nap record detail:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (napRecords.length > 0 && id) {
      const found = napRecords.find(r => r.id === id)
      setRecord(found)
    }
  }, [napRecords, id])

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (!record && !recordsLoading) return <div className="max-w-4xl mx-auto py-12 text-center"><p className="text-gray-500">Schlafprotokoll nicht gefunden.</p></div>

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/teacher/nap-records"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Schlafprotokollen
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
            <div>
                <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
                <div className="flex items-center gap-3 mt-2">
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-purple-100">
                      😴 {record.duration_minutes ? `${record.duration_minutes} Minuten` : 'Dauer unbekannt'}
                    </span>
                    <span className="text-sm font-bold text-gray-400">{getChildName(record.child_id)}</span>
                </div>
            </div>
            <div className="flex gap-2">
                 <IOSButton variant="secondary" onClick={() => router.push(`/teacher/nap-records/${id}/edit`)} className="px-5 py-2 text-xs font-black uppercase tracking-widest border-black/5 hover:border-[#667eea]/40 transition-all">
                    Bearbeiten
                 </IOSButton>
            </div>
        </div>
      </div>

      <IOSCard className="p-8 shadow-2xl shadow-indigo-900/5 border-black/5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div>
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-2">Datum</p>
                <div className="text-base text-gray-800 font-bold">{formatDate(record.nap_date)}</div>
            </div>
            {(record.start_time || record.end_time) && (
                <div>
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-2">Uhrzeit</p>
                    <div className="flex items-center gap-3">
                         <div className="px-3 py-1 bg-[#667eea]/5 text-[#667eea] rounded-lg border border-[#667eea]/10 font-black text-sm">{record.start_time || '--:--'}</div>
                         <div className="text-gray-300">→</div>
                         <div className="px-3 py-1 bg-[#667eea]/5 text-[#667eea] rounded-lg border border-[#667eea]/10 font-black text-sm">{record.end_time || '--:--'}</div>
                    </div>
                </div>
            )}
        </div>
        
        {record.notes && (
            <div className="mb-10 pt-10 border-t border-black/5">
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-4">Anmerkungen</p>
                <div className="bg-gray-50/80 p-6 rounded-2xl border border-black/5 text-gray-700 leading-relaxed font-medium">
                    {record.notes}
                </div>
            </div>
        )}
        
        <div className="pt-8 flex items-center justify-between opacity-40 grayscale group hover:opacity-100 hover:grayscale-0 transition-all">
             <div className="flex items-center gap-2">
                 <div className="w-7 h-7 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center text-[10px]">👤</div>
                 <p className="text-[10px] font-black uppercase tracking-widest">Dokumentiert von Fachkraft</p>
             </div>
             <p className="text-[10px] font-black uppercase tracking-widest">ID: {record.id.split('-')[0]}</p>
        </div>
      </IOSCard>
    </div>
  )
}
