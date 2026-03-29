'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.portfolios'

import React, { useEffect, useState } from 'react'
import { usePortfoliosStore, Portfolio } from '@/stores/portfolios'
import { useChildrenStore } from '@/stores/children'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function ParentPortfoliosPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { portfolios, loading, error, fetchPortfolios } = usePortfoliosStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [selectedChildId, setSelectedChildId] = useState('')

  useEffect(() => {
    async function loadData() {
        await fetchChildren()
    }
    loadData()
  }, [fetchChildren])

  useEffect(() => {
    if (selectedChildId) {
        fetchPortfolios(selectedChildId)
    } else if (children.length > 0) {
        setSelectedChildId(children[0].id)
    }
  }, [selectedChildId, children, fetchPortfolios])

  if (loading && portfolios.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-10 text-center">
        <Heading size="xl" className="text-gray-900 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-gray-500 mt-1">Die schönsten Momente und Lernfortschritte Ihres Kindes.</p>
      </div>

      {children.length > 1 && (
        <div className="mb-10 flex justify-center gap-2 overflow-x-auto pb-2">
            {children.map(c => (
                <button
                    key={c.id}
                    onClick={() => setSelectedChildId(c.id)}
                    className={`px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                        selectedChildId === c.id 
                        ? 'bg-black text-white border-black shadow-lg' 
                        : 'bg-white text-gray-400 border-black/5'
                    }`}
                >
                    {c.first_name}
                </button>
            ))}
        </div>
      )}

      {portfolios.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">📸</div>
          <p className="text-gray-400 font-bold max-w-xs mx-auto">Noch keine Portfolio-Einträge vorhanden.</p>
        </IOSCard>
      ) : (
        <div className="space-y-12">
            {portfolios.map((entry: Portfolio) => (
                <div key={entry.id} className="relative group">
                    <div className="absolute left-1/2 -ml-px top-full h-12 border-l border-black/5 group-last:hidden"></div>
                    
                    <IOSCard className="p-0 overflow-hidden border-black/5 shadow-xl shadow-black/5">
                        <div className="p-8 border-b border-black/5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-gray-900 mb-0.5">{entry.title}</h3>
                                <p className="text-[10px] font-black text-black/20 uppercase tracking-widest">{new Date(entry.date).toLocaleDateString()}</p>
                            </div>
                            <span className="text-2xl">✨</span>
                        </div>
                        
                        {entry.attachments?.[0] && (
                            <div className="aspect-video bg-gray-100 overflow-hidden">
                                <img src={entry.attachments[0]} alt={entry.title} className="w-full h-full object-cover" />
                            </div>
                        )}
                        
                        <div className="p-8">
                            <p className="text-base text-gray-600 font-medium leading-relaxed whitespace-pre-wrap">{entry.content}</p>
                        </div>
                    </IOSCard>
                </div>
            ))}
        </div>
      )}
    </div>
  )
}
