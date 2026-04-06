'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.hr.payroll'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePayrollStore, StaffPayroll } from '@/stores/payroll'
import { useStaffStore } from '@/stores/staff'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { useToastStore } from '@/stores/toast'
import { downloadTextFile, toCsv } from '@/utils/export/csv'

export default function AdminPayrollPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { payroll, loading, error, fetchPayroll, markAsPaid } = usePayrollStore()
  const { staff, fetchStaff } = useStaffStore()
  const toast = useToastStore()
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (profile?.kita_id) {
        fetchPayroll(undefined, selectedMonth, selectedYear, profile.kita_id)
        fetchStaff()
    }
  }, [profile, selectedMonth, selectedYear, fetchPayroll, fetchStaff])

  const getStaffName = (staffId: string) => {
    const s = staff.find(s => s.id === staffId)
    return s ? s.full_name : 'Unbekannt'
  }

  const handleMarkPaid = async (id: string) => {
    if (!confirm('Gehalt als ausgezahlt markieren?')) return
    try {
        await markAsPaid(id)
        if (profile?.kita_id) fetchPayroll(undefined, selectedMonth, selectedYear, profile.kita_id)
        toast.push({ type: 'success', title: 'Payroll', message: 'Als bezahlt markiert.' })
    } catch (e: any) {
        toast.push({ type: 'error', title: 'Payroll', message: e?.message || 'Aktion fehlgeschlagen.' })
    }
  }

  const exportCsv = () => {
    const rows = [
      ['Mitarbeiter', 'Monat', 'Jahr', 'Netto', 'Überstunden (h)', 'Status'],
      ...payroll.map((p) => [
        getStaffName(p.staff_id),
        new Date(2000, p.month - 1).toLocaleString('de-DE', { month: 'long' }),
        p.year,
        p.net_salary,
        p.overtime_hours,
        p.status,
      ]),
    ]
    const csv = toCsv(rows, { delimiter: ';', includeBom: true })
    downloadTextFile(`payroll-${selectedMonth}-${selectedYear}.csv`, csv, 'text/csv;charset=utf-8')
    toast.push({ type: 'success', title: 'Payroll', message: 'CSV exportiert.' })
  }

  if (loading && payroll.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Verwalten Sie Gehälter, Überstunden und Auszahlungen.</p>
        </div>
        <div className="flex gap-2">
            <IOSButton variant="secondary" className="px-6 py-2.5 text-sm font-black uppercase tracking-widest border-black/10" onClick={exportCsv}>
              📥 Export
            </IOSButton>
            <Link href="/admin/hr/salary-config">
                <IOSButton variant="secondary" className="px-6 py-2.5 text-sm font-black uppercase tracking-widest border-black/10">
                    ⚙️ Konfiguration
                </IOSButton>
            </Link>
            <Link href="/admin/hr/payroll/generate">
              <IOSButton className="px-6 py-2.5 text-sm font-black uppercase tracking-widest bg-black text-white border-none">
                ➕ Abrechnung erstellen
              </IOSButton>
            </Link>
        </div>
      </div>

      <div className="mb-10 flex gap-4">
            <select 
                value={selectedMonth} 
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-black/5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-sm focus:ring-2 focus:ring-black/5 outline-none"
            >
                {Array.from({ length: 12 }, (_, i) => (
                    <option key={i+1} value={i+1}>
                        {new Date(2000, i).toLocaleString('de-DE', { month: 'long' })}
                    </option>
                ))}
            </select>
            <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="px-4 py-2 bg-white border border-black/5 rounded-2xl text-sm font-black uppercase tracking-widest shadow-sm focus:ring-2 focus:ring-black/5 outline-none"
            >
                {[2024, 2025, 2026].map(y => (
                    <option key={y} value={y}>{y}</option>
                ))}
            </select>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Abrechnungen'} />
      ) : payroll.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">💰</div>
          <p className="text-ui-soft font-bold max-w-xs mx-auto">Keine Abrechnungen für diesen Zeitraum gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
            {payroll.map(entry => (
                <IOSCard key={entry.id} className="p-0 overflow-hidden border-black/5 group hover:shadow-xl transition-all duration-300">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{getStaffName(entry.staff_id)}</h3>
                                <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${
                                    entry.status === 'paid' ? 'bg-green-50 text-green-600 border-green-100' :
                                    entry.status === 'approved' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                    'bg-amber-50 text-amber-600 border-amber-100'
                                }`}>
                                    {entry.status === 'paid' ? 'Bezahlt' : entry.status === 'approved' ? 'Freigegeben' : 'Entwurf'}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black text-black/30 uppercase tracking-widest">
                                <span className="text-[#667eea]">💵 Netto: {entry.net_salary.toFixed(2)}€</span>
                                <span>🕒 Überstunden: {entry.overtime_hours}h</span>
                                <span>📅 {new Date(entry.year, entry.month - 1).toLocaleString('de-DE', { month: 'long', year: 'numeric' })}</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            {entry.status !== 'paid' && (
                                <IOSButton onClick={() => handleMarkPaid(entry.id)} className="px-4 py-2 text-[10px] font-black uppercase tracking-widest bg-green-600 text-white border-none hover:bg-green-700">Bezahlt markieren</IOSButton>
                            )}
                            <Link href={`/admin/hr/payroll/${entry.id}`}>
                              <IOSButton variant="secondary" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white">
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
