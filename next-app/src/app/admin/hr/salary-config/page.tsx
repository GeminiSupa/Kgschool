'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.hr.salary-config'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSalaryConfigStore, SalaryConfig } from '@/stores/salaryConfig'
import { useStaffStore } from '@/stores/staff'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminSalaryConfigPage() {
  const { t } = useI18n()

  const { configs, loading, error, fetchConfigs, deleteConfig } = useSalaryConfigStore()
  const { staff, fetchStaff } = useStaffStore()

  useEffect(() => {
    fetchConfigs()
    fetchStaff()
  }, [fetchConfigs, fetchStaff])

  const getStaffName = (staffId: string) => {
    const s = staff.find(s => s.id === staffId)
    return s ? s.full_name : 'Unbekannt'
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Diese Konfiguration wirklich löschen?')) return
    try {
        await deleteConfig(id)
        fetchConfigs()
    } catch (e: any) {
        console.error(e)
    }
  }

  if (loading && configs.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-10">
        <Link
          href="/admin/hr/payroll"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zur Abrechnung
        </Link>
        <Heading size="xl" className="text-gray-900 mt-2 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Legen Sie Basisgehälter und Stundensätze für Ihr Personal fest.</p>
      </div>

      <div className="flex justify-end mb-8">
        <Link href="/admin/hr/salary-config/new">
          <IOSButton className="px-6 py-2.5 text-sm font-black uppercase tracking-widest bg-black text-white border-none shadow-xl shadow-black/10">
              ➕ Neue Konfiguration
          </IOSButton>
        </Link>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Konfigurationen'} />
      ) : configs.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">⚙️</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Keine Gehaltskonfigurationen vorhanden.</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map(config => (
                <IOSCard key={config.id} className="p-8 border-black/5 hover:border-indigo-500/30 transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full group-hover:bg-indigo-500/10 transition-colors"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 leading-tight">{getStaffName(config.staff_id)}</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Gültig ab: {new Date(config.effective_from).toLocaleDateString()}</p>
                            </div>
                            <button onClick={() => handleDelete(config.id)} className="p-2 hover:bg-red-50 text-red-300 hover:text-red-500 rounded-lg transition-colors">🗑️</button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex justify-between items-end border-b border-black/5 pb-2">
                                <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Basisgehalt</span>
                                <span className="text-xl font-black text-gray-900">{config.base_salary.toFixed(2)}€</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-black/5 pb-2">
                                <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Stundensatz</span>
                                <span className="text-sm font-black text-gray-700">{config.hourly_rate?.toFixed(2) || '0.00'}€ / h</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-black/5 pb-2">
                                <span className="text-[10px] font-black text-black/30 uppercase tracking-widest">Überstunden</span>
                                <span className="text-sm font-black text-indigo-600">x{config.overtime_multiplier}</span>
                            </div>
                        </div>

                        <Link href={`/admin/hr/salary-config/${config.id}`}>
                          <IOSButton variant="secondary" className="w-full py-3 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white">
                            Bearbeiten
                          </IOSButton>
                        </Link>
                    </div>
                </IOSCard>
            ))}
        </div>
      )}
    </div>
  )
}
