'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.leave'

import React, { useEffect, useState } from 'react'
import { useLeaveRequestsStore, LeaveRequest } from '@/stores/leaveRequests'
import { useTeacherLeaveRequestsStore, TeacherLeaveRequest } from '@/stores/teacherLeaveRequests'
import { useChildrenStore } from '@/stores/children'
import { useStaffStore } from '@/stores/staff'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { sT } from '@/i18n/sT'

export default function AdminLeavePage() {
  const { t } = useI18n()

  const { leaveRequests, fetchLeaveRequests, updateLeaveRequestStatus } = useLeaveRequestsStore()
  const {
    leaveRequests: teacherRequests,
    fetchLeaveRequests: fetchTeacherRequests,
    updateLeaveRequestStatus: updateTeacherStatus,
  } = useTeacherLeaveRequestsStore()
  const { children, fetchChildren } = useChildrenStore()
  const { staff, fetchStaff } = useStaffStore()
  
  const [activeTab, setActiveTab] = useState<'children' | 'staff'>('children')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
        await Promise.all([
            fetchLeaveRequests(),
            fetchTeacherRequests(),
            fetchChildren(),
            fetchStaff()
        ])
        setLoading(false)
    }
    loadData()
  }, [fetchLeaveRequests, fetchTeacherRequests, fetchChildren, fetchStaff])

  const getChildName = (id: string) => {
    const c = children.find(c => c.id === id)
    return c ? `${c.first_name} ${c.last_name}` : 'Unbekannt'
  }

  const getStaffName = (id: string) => {
    const s = staff.find(s => s.id === id)
    return s ? s.full_name : t(sT('lblUnknown'))
  }

  const handleReview = async (id: string, status: 'approved' | 'rejected', type: 'child' | 'staff') => {
      try {
          if (type === 'child') await updateLeaveRequestStatus(id, status)
          else await updateTeacherStatus(id, status)
          alert(t(sT('successLeaveStatusUpdated')))
      } catch (e: any) {
          alert(e.message)
      }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Verwalten Sie Urlaubsanträge und Krankmeldungen von Kindern und Personal.</p>
        </div>
      </div>

      <div className="mb-10 flex gap-2">
            <button 
                onClick={() => setActiveTab('children')}
                className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                    activeTab === 'children' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-ui-soft border-black/5 hover:border-black/10'
                }`}
            >
                Kinder
            </button>
            <button 
                onClick={() => setActiveTab('staff')}
                className={`px-8 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                    activeTab === 'staff' ? 'bg-black text-white border-black shadow-lg' : 'bg-white text-ui-soft border-black/5 hover:border-black/10'
                }`}
            >
                Personal
            </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
            {activeTab === 'children' ? (
                leaveRequests.length === 0 ? <p className="text-center py-20 text-ui-soft font-bold uppercase tracking-widest opacity-20 text-4xl">Leer</p> :
                leaveRequests.map(req => (
                    <IOSCard key={req.id} className="p-0 overflow-hidden border-black/5 group">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{getChildName(req.child_id)}</h3>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                                        req.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' : 
                                        req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">
                                    📅 {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()} | Typ: {req.leave_type}
                                </p>
                            </div>
                            {req.status === 'pending' && (
                                <div className="flex gap-2">
                                    <IOSButton onClick={() => handleReview(req.id, 'approved', 'child')} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-black text-white border-none">Genehmigen</IOSButton>
                                    <IOSButton onClick={() => handleReview(req.id, 'rejected', 'child')} variant="secondary" className="px-6 py-2 text-[10px] font-black uppercase tracking-widest border-black/5">Ablehnen</IOSButton>
                                </div>
                            )}
                        </div>
                    </IOSCard>
                ))
            ) : (
                teacherRequests.length === 0 ? <p className="text-center py-20 text-ui-soft font-bold uppercase tracking-widest opacity-20 text-4xl">Leer</p> :
                teacherRequests.map(req => (
                    <IOSCard key={req.id} className="p-0 overflow-hidden border-black/5 group">
                        <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{getStaffName(req.teacher_id)}</h3>
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                                        req.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' : 
                                        req.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                                        'bg-amber-50 text-amber-600 border-amber-100'
                                    }`}>
                                        {req.status}
                                    </span>
                                </div>
                                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">
                                    📅 {new Date(req.start_date).toLocaleDateString()} - {new Date(req.end_date).toLocaleDateString()} | Typ: {req.leave_type}
                                </p>
                            </div>
                            {req.status === 'pending' && (
                                <div className="flex gap-2">
                                    <IOSButton onClick={() => handleReview(req.id, 'approved', 'staff')} className="px-6 py-2 text-[10px] font-black uppercase tracking-widest bg-black text-white border-none">Genehmigen</IOSButton>
                                    <IOSButton onClick={() => handleReview(req.id, 'rejected', 'staff')} variant="secondary" className="px-6 py-2 text-[10px] font-black uppercase tracking-widest border-black/5">Ablehnen</IOSButton>
                                </div>
                            )}
                        </div>
                    </IOSCard>
                ))
            )}
      </div>
    </div>
  )
}
