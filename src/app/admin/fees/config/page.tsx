'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.fees.config'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useFeeConfigStore } from '@/stores/feeConfig'
import { useGroupsStore } from '@/stores/groups'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function FeeConfigListPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { configs, loading, error, fetchConfigs, deleteConfig } = useFeeConfigStore()
  const { groups, fetchGroups } = useGroupsStore()

  useEffect(() => {
    fetchConfigs()
    fetchGroups()
  }, [fetchConfigs, fetchGroups])

  const getGroupName = (groupId?: string) => {
    if (!groupId) return 'Alle Gruppen'
    const group = groups.find(g => g.id === groupId)
    return group ? group.name : groupId
  }

  const formatFeeType = (type: string) => {
    const types: Record<string, string> = {
      tuition: 'Grundgebühr',
      lunch: 'Verpflegung',
      activities: 'Aktivitäten',
      other: 'Sonstiges'
    }
    return types[type] || type
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Soll diese Konfiguration wirklich gelöscht werden?')) return
    try {
      await deleteConfig(id)
      fetchConfigs()
    } catch (e: any) {
      alert(e.message || 'Fehler beim Löschen')
    }
  }

  if (loading && configs.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link
            href="/admin/fees"
            className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
          >
            ← Zurück zu Gebühren
          </Link>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 mt-2">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Legen Sie Standardbeträge für verschiedene Gruppen und Gebührenarten fest.</p>
        </div>
        <Link href="/admin/fees/config/new">
          <IOSButton variant="primary" className="px-6 py-2.5 text-sm font-bold flex items-center gap-2">
            <span>➕</span>
            <span>Konfiguration hinzufügen</span>
          </IOSButton>
        </Link>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Konfigurationen'} />
      ) : configs.length === 0 ? (
        <IOSCard className="p-16 text-center bg-gray-50/50">
          <div className="text-5xl opacity-40 mb-4">⚙️</div>
          <p className="text-ui-soft font-medium">Keine Gebühren-Konfigurationen gefunden.</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configs.map(config => (
                <IOSCard key={config.id} className="p-0 overflow-hidden group hover:shadow-xl transition-all duration-300 border-black/5">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                            <span className="px-2 py-0.5 bg-blue-50 text-[10px] font-black text-[#667eea] rounded-md uppercase tracking-widest border border-blue-100/50">
                                {formatFeeType(config.fee_type)}
                            </span>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => router.push(`/admin/fees/config/${config.id}`)} className="p-1.5 text-ui-soft hover:text-[#667eea]">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                </button>
                                <button onClick={() => handleDelete(config.id)} className="p-1.5 text-ui-soft hover:text-red-500">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                        <h4 className="text-3xl font-black text-slate-900 dark:text-slate-50 mb-1 tracking-tight">€{config.amount.toFixed(2)}</h4>
                        <p className="text-sm font-bold text-ui-soft mb-6">{getGroupName(config.group_id)}</p>
                        
                        <div className="pt-4 border-t border-black/5">
                            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-1.5">Gültig ab</p>
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 italic">{new Date(config.effective_from).toLocaleDateString('de-DE')}</p>
                        </div>
                    </div>
                    {config.notes && (
                        <div className="px-6 py-3 bg-gray-50/50 border-t border-black/5 mt-2">
                             <p className="text-[10px] text-ui-soft italic line-clamp-1">{config.notes}</p>
                        </div>
                    )}
                </IOSCard>
            ))}
        </div>
      )}
    </div>
  )
}
