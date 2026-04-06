'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.observations'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useObservationsStore } from '@/stores/observations'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminObservationsPage() {
  const { t } = useI18n()

  const { observations, loading, error, fetchObservations } = useObservationsStore()
  const { children, fetchChildren } = useChildrenStore()

  const [selectedChildId, setSelectedChildId] = useState('')
  const [selectedDate, setSelectedDate] = useState('')

  useEffect(() => {
    fetchChildren()
    fetchObservations()
  }, [fetchChildren, fetchObservations])

  const handleFilter = () => fetchObservations(selectedChildId || undefined, selectedDate || undefined)

  const getChildName = (childId: string) => {
    const child = (children || []).find((c: any) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const formatDate = (d: string) => new Date(d).toLocaleDateString('de-DE')

  const devAreaColors: Record<string, string> = {
    language: 'bg-blue-100 text-blue-700',
    social: 'bg-green-100 text-green-700',
    cognitive: 'bg-purple-100 text-purple-700',
    physical: 'bg-orange-100 text-orange-700',
    emotional: 'bg-pink-100 text-pink-700'
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Dokumentieren Sie die Entwicklung der Kinder</p>
        </div>
        <Link href="/admin/observations/new">
          <IOSButton variant="primary" className="inline-flex items-center gap-2 text-sm px-4 py-2">
            ➕ Neue Beobachtung
          </IOSButton>
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={selectedChildId}
          onChange={e => { setSelectedChildId(e.target.value); fetchObservations(e.target.value || undefined, selectedDate || undefined) }}
          className="px-4 py-2.5 bg-white/80 border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
        >
          <option value="">Alle Kinder</option>
          {(children || []).map((c: any) => (
            <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
          ))}
        </select>
        <input
          type="date"
          value={selectedDate}
          onChange={e => { setSelectedDate(e.target.value); fetchObservations(selectedChildId || undefined, e.target.value || undefined) }}
          className="px-4 py-2.5 bg-white/80 border border-black/10 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><LoadingSpinner /></div>
      ) : error ? (
        <div className="mb-6"><ErrorAlert message={error.message || 'Fehler'} /></div>
      ) : (
        <IOSCard className="overflow-hidden p-0">
          {observations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-5xl opacity-40 mb-4">🔍</div>
              <p className="font-semibold text-slate-700 dark:text-slate-200">Keine Beobachtungen gefunden</p>
            </div>
          ) : (
            <div className="divide-y divide-black/5">
              {observations.map(obs => (
                <div key={obs.id} className="p-5 hover:bg-white/60 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">{getChildName(obs.child_id)}</h3>
                        {obs.development_area && (
                          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${devAreaColors[obs.development_area] || 'bg-blue-100 text-blue-700'}`}>
                            {obs.development_area}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-ui-soft mb-2 font-medium">📅 {formatDate(obs.observation_date)}</p>
                      {obs.context && <p className="text-sm text-ui-soft mb-1 italic">{obs.context}</p>}
                      <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-2">{obs.description}</p>
                      {obs.photos?.length > 0 && (
                        <p className="text-xs text-ui-soft mt-2">📷 {obs.photos.length} Foto{obs.photos.length > 1 ? 's' : ''}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/admin/observations/${obs.id}`}>
                        <IOSButton variant="secondary" className="text-xs px-3 py-1.5 inline-flex items-center gap-1">
                          👁️ Ansehen
                        </IOSButton>
                      </Link>
                      <Link href={`/admin/observations/${obs.id}?edit=true`}>
                        <IOSButton variant="secondary" className="text-xs px-3 py-1.5 inline-flex items-center gap-1">
                          ✏️ Bearbeiten
                        </IOSButton>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </IOSCard>
      )}
    </div>
  )
}
