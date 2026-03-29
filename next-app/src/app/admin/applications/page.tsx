'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.applications'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useApplicationsStore, Application } from '@/stores/applications'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { useToastStore } from '@/stores/toast'

export default function AdminApplicationsPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { applications, loading, error, fetchApplications, updateApplicationStatus } = useApplicationsStore()
  const [selectedStatus, setSelectedStatus] = useState('')
  const toast = useToastStore()

  const statuses = [
    { value: '', label: 'Alle' },
    { value: 'pending', label: 'Offen' },
    { value: 'waitlist', label: 'Warteliste' },
    { value: 'accepted', label: 'Angenommen' },
    { value: 'rejected', label: 'Abgelehnt' }
  ]

  useEffect(() => {
    fetchApplications(selectedStatus || undefined)
  }, [selectedStatus, fetchApplications])

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE')
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-blue-50 text-blue-600 border-blue-100',
      waitlist: 'bg-amber-50 text-amber-600 border-amber-100',
      accepted: 'bg-green-50 text-green-600 border-green-100',
      rejected: 'bg-red-50 text-red-600 border-red-100'
    }
    return (
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${styles[status]}`}>
            {status === 'pending' ? 'Offen' : status === 'waitlist' ? 'Warteliste' : status === 'accepted' ? 'Angenommen' : 'Abgelehnt'}
        </span>
    )
  }

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
        await updateApplicationStatus(id, status)
        toast.push({ type: 'success', title: 'Bewerbung', message: 'Status aktualisiert.' })
    } catch (e: any) {
        toast.push({ type: 'error', title: 'Bewerbung', message: e?.message || 'Fehler beim Aktualisieren.' })
    }
  }

  if (loading && applications.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">Verwalten Sie neue Anmeldungen und die Kommunikation mit Eltern.</p>
        </div>
        <Link href="/admin/applications/waitlist">
          <IOSButton variant="secondary" className="px-6 py-2.5 text-sm font-black uppercase tracking-widest flex items-center gap-2 border-black/10">
            <span>📋</span>
            <span>Warteliste verwalten</span>
          </IOSButton>
        </Link>
      </div>

      <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
            {statuses.map(s => (
                <button
                    key={s.value}
                    onClick={() => setSelectedStatus(s.value)}
                    className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                        selectedStatus === s.value 
                        ? 'bg-black text-white border-black shadow-lg shadow-black/10' 
                        : 'bg-white text-gray-400 border-black/5 hover:border-black/10'
                    }`}
                >
                    {s.label}
                </button>
            ))}
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Anmeldungen'} />
      ) : applications.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-5xl opacity-10 mb-6">📬</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Keine Anmeldungen in dieser Kategorie gefunden.</p>
        </IOSCard>
      ) : (
        <div className="space-y-4">
            {applications.map(app => (
                <IOSCard key={app.id} className="p-0 overflow-hidden border-black/5 group hover:shadow-xl transition-all duration-300">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-black text-gray-900">{app.child_first_name} {app.child_last_name}</h3>
                                {getStatusBadge(app.status)}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black text-black/30 uppercase tracking-widest">
                                <span>👶 DOB: {formatDate(app.child_date_of_birth)}</span>
                                <span>📅 Start: {formatDate(app.preferred_start_date)}</span>
                                <span className="text-[#667eea]">⏰ {app.betreuung_hours_type}h / Woche</span>
                            </div>
                            <div className="mt-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center text-[10px] font-black italic">👤</div>
                                <div>
                                    <p className="text-xs font-black text-gray-800 leading-none">{app.parent_name}</p>
                                    <p className="text-[10px] font-bold text-gray-400">{app.parent_email}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 md:grid md:grid-cols-2 lg:flex lg:flex-row">
                             {app.status === 'pending' && (
                                <>
                                    <IOSButton onClick={() => handleStatusUpdate(app.id, 'waitlist')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-amber-500 text-white border-none hover:bg-amber-600">Auf Warteliste</IOSButton>
                                    <IOSButton onClick={() => handleStatusUpdate(app.id, 'accepted')} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-green-600 text-white border-none hover:bg-green-700">Annehmen</IOSButton>
                                </>
                             )}
                             <Link href={`/admin/applications/${app.id}`}>
                                <IOSButton variant="secondary" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white">Details</IOSButton>
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
