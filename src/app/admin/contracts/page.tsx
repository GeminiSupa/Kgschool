'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.contracts'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useContractsStore, ChildContract } from '@/stores/contracts'
import { useChildrenStore } from '@/stores/children'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminContractsPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { contracts, loading, error, fetchContracts } = useContractsStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [selectedStatus, setSelectedStatus] = useState('active')

  useEffect(() => {
    if (profile?.kita_id) {
        fetchContracts(undefined, profile.kita_id, selectedStatus)
        fetchChildren()
    }
  }, [profile, selectedStatus, fetchContracts, fetchChildren])

  const getChildName = (childId: string) => {
    const c = children.find(c => c.id === childId)
    return c ? `${c.first_name} ${c.last_name}` : 'Unbekannt'
  }

  if (loading && contracts.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Verwalten Sie Verträge, Stundenkontingente und Gebühreneinstufungen.</p>
        </div>
        <Link href="/admin/contracts/new">
          <IOSButton className="px-6 py-2.5 text-sm font-black uppercase tracking-widest bg-black text-white border-none shadow-xl shadow-black/10">
            ➕ Neuer Vertrag
          </IOSButton>
        </Link>
      </div>

      <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
            {['active', 'pending', 'terminated'].map(s => (
                <button
                    key={s}
                    onClick={() => setSelectedStatus(s)}
                    className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                        selectedStatus === s 
                        ? 'bg-black text-white border-black shadow-lg shadow-black/10' 
                        : 'bg-white text-ui-soft border-black/5 hover:border-black/10'
                    }`}
                >
                    {s === 'active' ? 'Aktiv' : s === 'pending' ? 'Entwurf' : 'Beendet'}
                </button>
            ))}
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Verträge'} />
      ) : contracts.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">📝</div>
          <p className="text-ui-soft font-bold max-w-xs mx-auto">Keine Verträge in dieser Kategorie gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {contracts.map(contract => (
                <IOSCard key={contract.id} className="p-8 border-black/5 group hover:shadow-xl transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-2xl rounded-full"></div>
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{getChildName(contract.child_id)}</h3>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">{contract.contract_number}</p>
                            </div>
                            <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded border ${
                                contract.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                            }`}>
                                {contract.status}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-black/5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Stunden</p>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100">{contract.betreuung_hours_type}h / Woche</p>
                            </div>
                            <div className="p-4 bg-gray-50/50 rounded-2xl border border-black/5">
                                <p className="text-[9px] font-black text-black/30 uppercase tracking-widest mb-1">Einstufung</p>
                                <p className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase">{contract.fee_category}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <IOSButton variant="secondary" className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white">Vertrag ansehen</IOSButton>
                             <IOSButton className="py-3 px-6 text-[10px] font-black uppercase tracking-widest border-black/5 bg-white text-ui-soft group-hover:text-black hover:border-black/20">Bearbeiten</IOSButton>
                        </div>
                    </div>
                </IOSCard>
            ))}
        </div>
      )}
    </div>
  )
}
