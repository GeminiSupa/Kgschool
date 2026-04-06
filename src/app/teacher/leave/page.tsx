'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.leave'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useTeacherLeaveRequestsStore } from '@/stores/teacherLeaveRequests'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function TeacherLeaveIndexPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { user } = useAuth()
  const { leaveRequests, loading, error, fetchLeaveRequests, deleteLeaveRequest } = useTeacherLeaveRequestsStore()
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')

  useEffect(() => {
    if (user?.id) {
      fetchLeaveRequests(user.id)
    }
  }, [user?.id, fetchLeaveRequests])

  const filteredRequests = useMemo(() => {
    if (filterStatus === 'all') return leaveRequests
    return leaveRequests.filter(r => r.status === filterStatus)
  }, [leaveRequests, filterStatus])

  const formatLeaveType = (type: string) => {
    const types: Record<string, string> = {
      vacation: 'Erholungsurlaub',
      sick: 'Krankmeldung',
      personal: 'Persönlich',
      other: 'Sonstiges'
    }
    return types[type] || type
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Möchten Sie diesen Urlaubsantrag wirklich stornieren?')) return
    try {
      await deleteLeaveRequest(id)
      if (user?.id) await fetchLeaveRequests(user.id)
    } catch (e: any) {
      alert(e.message || 'Fehler beim Stornieren')
    }
  }

  if (loading && leaveRequests.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Verwalten Sie Ihre Abwesenheiten und Urlaubsanträge.</p>
        </div>
        <Link href="/teacher/leave/new">
          <IOSButton variant="primary" className="px-6 py-2.5 text-sm font-bold flex items-center gap-2">
            <span>➕</span>
            <span>Neuer Antrag</span>
          </IOSButton>
        </Link>
      </div>

      <div className="flex gap-2 mb-6 p-1.5 bg-[#f2f2f7] rounded-2xl w-fit">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 capitalize ${
              filterStatus === status ? 'bg-white text-[#667eea] shadow-sm' : 'text-ui-soft hover:text-slate-700 dark:text-slate-200'
            }`}
          >
            {status === 'all' ? 'Alle' : status === 'pending' ? 'Ausstehend' : status === 'approved' ? 'Genehmigt' : 'Abgelehnt'}
          </button>
        ))}
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Anträge'} />
      ) : filteredRequests.length === 0 ? (
        <IOSCard className="p-16 text-center bg-gray-50/50">
          <div className="text-5xl opacity-40 mb-4">🏖️</div>
          <p className="text-ui-soft font-medium">Keine Urlaubsanträge gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map(request => (
            <IOSCard key={request.id} className="p-0 overflow-hidden shadow-sm border-black/5 hover:shadow-md transition-all duration-300">
              <div className="p-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-md border ${
                          request.status === 'approved' ? 'bg-green-50 text-green-700 border-green-100' :
                          request.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                          'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                          {request.status === 'approved' ? 'Genehmigt' : request.status === 'rejected' ? 'Abgelehnt' : 'Wartend'}
                        </span>
                        <span className="px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100 rounded-md">
                          {formatLeaveType(request.leave_type)}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-ui-soft">📅</span>
                        <span className="text-sm font-black text-slate-900 dark:text-slate-50">
                          {new Date(request.start_date).toLocaleDateString('de-DE')} - {new Date(request.end_date).toLocaleDateString('de-DE')}
                        </span>
                    </div>
                    
                    <p className="text-sm font-medium text-ui-muted leading-relaxed">{request.reason}</p>
                    
                    {request.admin_notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-black text-ui-soft uppercase tracking-widest mb-1">Anmerkung der Leitung</p>
                            <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{request.admin_notes}</p>
                        </div>
                    )}
                  </div>
                  
                  {request.status === 'pending' && (
                    <IOSButton
                      variant="secondary"
                      onClick={() => handleDelete(request.id)}
                      className="text-xs py-2 h-auto text-red-500 hover:text-red-600 font-black border-red-50"
                    >
                      Antrag stornieren
                    </IOSButton>
                  )}
                </div>
              </div>
            </IOSCard>
          ))}
        </div>
      )}
    </div>
  )
}
