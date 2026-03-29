'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.observations'

import React, { useEffect, useState } from 'react'
import { useObservationsStore, Observation } from '@/stores/observations'
import { useChildrenStore } from '@/stores/children'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function ParentObservationsPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { observations, loading, fetchObservations } = useObservationsStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [selectedChildId, setSelectedChildId] = useState('')

  useEffect(() => {
    fetchChildren()
  }, [fetchChildren])

  useEffect(() => {
    if (selectedChildId) {
        fetchObservations(selectedChildId)
    } else if (children.length > 0) {
        setSelectedChildId(children[0].id)
    }
  }, [selectedChildId, children, fetchObservations])

  if (loading && observations.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Dokumentation der pädagogischen Entwicklung Ihres Kindes.</p>
      </div>

      {children.length > 1 && (
        <div className="mb-10 flex justify-center gap-2">
             {children.map(c => (
                <button
                    key={c.id}
                    onClick={() => setSelectedChildId(c.id)}
                    className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                        selectedChildId === c.id ? 'bg-black text-white' : 'bg-white text-gray-400 border-black/5'
                    }`}
                >
                    {c.first_name}
                </button>
            ))}
        </div>
      )}

      {observations.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">🔍</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Noch keine Beobachtungen eingetragen.</p>
        </IOSCard>
      ) : (
        <div className="space-y-6">
            {observations.map(obs => (
                <IOSCard key={obs.id} className="p-8 border-black/5 hover:border-indigo-500/30 transition-all">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                             <h3 className="text-lg font-black text-gray-900">{obs.title || 'Entwicklungsbeobachtung'}</h3>
                             <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">{new Date(obs.observation_date).toLocaleDateString()}</p>
                        </div>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest bg-gray-100 px-3 py-1 rounded-full">{obs.observation_type}</span>
                    </div>
                    <p className="text-base text-gray-600 font-medium leading-relaxed mb-6">{obs.content}</p>
                    {obs.areas_of_development && obs.areas_of_development.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                             {obs.areas_of_development.map(area => (
                                 <span key={area} className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-indigo-100/50">{area}</span>
                             ))}
                        </div>
                    )}
                </IOSCard>
            ))}
        </div>
      )}
    </div>
  )
}
