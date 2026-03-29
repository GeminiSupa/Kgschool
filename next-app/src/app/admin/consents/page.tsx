'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.consents'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useConsentsStore, Consent } from '@/stores/consents'
import { useChildrenStore } from '@/stores/children'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminConsentsPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { consents, loading, error, fetchConsents } = useConsentsStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [selectedType, setSelectedType] = useState('')

  const consentTypes = [
    { value: '', label: 'Alle' },
    { value: 'photo', label: 'Foto/Video' },
    { value: 'messaging', label: 'Kommunikation' },
    { value: 'emergency_data', label: 'Notfalldaten' },
    { value: 'data_processing', label: 'Datenverarbeitung' }
  ]

  useEffect(() => {
    fetchConsents(undefined, selectedType || undefined)
    fetchChildren()
  }, [selectedType, fetchConsents, fetchChildren])

  const getChildName = (childId: string) => {
    const c = children.find(c => c.id === childId)
    return c ? `${c.first_name} ${c.last_name}` : 'Unbekannt'
  }

  if (loading && consents.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">Überblick über erteilte und widerrufene Einwilligungen der Eltern.</p>
        </div>
      </div>

      <div className="mb-10 flex gap-2 overflow-x-auto pb-2">
            {consentTypes.map(t => (
                <button
                    key={t.value}
                    onClick={() => setSelectedType(t.value)}
                    className={`px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 flex-shrink-0 ${
                        selectedType === t.value 
                        ? 'bg-black text-white border-black shadow-lg shadow-black/10' 
                        : 'bg-white text-gray-400 border-black/5 hover:border-black/10'
                    }`}
                >
                    {t.label}
                </button>
            ))}
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Einwilligungen'} />
      ) : consents.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">✅</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Keine Einträge für diesen Filter gefunden.</p>
        </IOSCard>
      ) : (
        <IOSCard className="p-0 overflow-hidden shadow-sm border-black/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Kind</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Typ</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Datum</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                        {consents.map(consent => (
                            <tr key={consent.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-5">
                                    <p className="text-sm font-black text-gray-900 leading-tight">{getChildName(consent.child_id)}</p>
                                </td>
                                <td className="px-6 py-5">
                                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{consent.consent_type}</span>
                                </td>
                                <td className="px-6 py-5">
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-md border ${
                                        consent.granted ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'
                                    }`}>
                                        {consent.granted ? 'Erteilt' : 'Widerrufen'}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-xs font-black text-gray-400">
                                    {new Date(consent.granted_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        <IOSButton variant="secondary" className="px-3 py-1.5 text-[9px] font-black uppercase tracking-widest border-black/5 bg-gray-50">Historie</IOSButton>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </IOSCard>
      )}
    </div>
  )
}
