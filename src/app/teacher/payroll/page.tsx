'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.payroll'

import React, { useEffect, useState } from 'react'
import { usePayrollStore, StaffPayroll } from '@/stores/payroll'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function TeacherPayrollPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { payroll, loading, error, fetchPayroll } = usePayrollStore()
  
  useEffect(() => {
    if (profile?.id) {
        fetchPayroll(profile.id)
    }
  }, [profile, fetchPayroll])

  if (loading && payroll.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Überblick über Ihre monatlichen Gehaltsabrechnungen.</p>
      </div>

      {payroll.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">💼</div>
          <p className="text-ui-soft font-bold max-w-xs mx-auto">Noch keine Abrechnungen in diesem System vorhanden.</p>
        </IOSCard>
      ) : (
        <div className="space-y-4">
            {payroll.map(entry => (
                <IOSCard key={entry.id} className="p-0 overflow-hidden border-black/5 group hover:shadow-xl transition-all duration-300">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{new Date(entry.year, entry.month - 1).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</h3>
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${
                                    entry.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                    {entry.status}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black text-black/30 uppercase tracking-widest">
                                <span className="text-[#667eea]">💵 Netto: {entry.net_salary.toFixed(2)}€</span>
                                <span>🕒 Überstunden: {entry.overtime_hours}h</span>
                            </div>
                        </div>

                        <button className="px-6 py-2.5 bg-gray-50 border border-black/5 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all">
                             📄 Abrechnung Laden
                        </button>
                    </div>
                </IOSCard>
            ))}
        </div>
      )}
    </div>
  )
}
