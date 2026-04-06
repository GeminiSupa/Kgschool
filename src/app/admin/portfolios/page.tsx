'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.portfolios'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePortfoliosStore, Portfolio } from '@/stores/portfolios'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function AdminPortfoliosPage() {
  const { t } = useI18n()

  const { portfolios, loading, error, fetchPortfolios } = usePortfoliosStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [selectedChild, setSelectedChild] = useState('')

  useEffect(() => {
    fetchPortfolios(selectedChild || undefined)
    fetchChildren()
  }, [selectedChild, fetchPortfolios, fetchChildren])

  const getChildName = (id: string) => {
    const c = children.find(c => c.id === id)
    return c ? `${c.first_name} ${c.last_name}` : 'Unbekannt'
  }

  if (loading && portfolios.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Überwachen Sie die pädagogische Dokumentation für alle Kinder.</p>
        </div>
      </div>

      <div className="mb-10">
        <select 
            value={selectedChild} 
            onChange={(e) => setSelectedChild(e.target.value)}
            className="px-5 py-2.5 bg-white border border-black/5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-sm focus:ring-2 focus:ring-[#667eea]/20 outline-none transition-all"
        >
            <option value="">Alle Kinder</option>
            {children.map(c => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>
            ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {portfolios.map((entry: Portfolio) => (
                <IOSCard key={entry.id} className="p-0 overflow-hidden border-black/5 group hover:shadow-2xl transition-all duration-500">
                    <div className="h-48 bg-gray-100 overflow-hidden relative">
                        {entry.attachments?.[0] ? (
                             <img src={entry.attachments[0]} alt={entry.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                             <div className="w-full h-full flex items-center justify-center text-4xl opacity-20 bg-linear-to-br from-gray-50 to-gray-200">🖼️</div>
                        )}
                        <span className="absolute top-4 left-4 px-3 py-1 bg-black/60 backdrop-blur-md text-[9px] font-black uppercase tracking-widest rounded-full text-white">
                            {new Date(entry.date).toLocaleDateString()}
                        </span>
                    </div>
                    <div className="p-8">
                        <p className="text-[10px] font-black text-[#667eea] uppercase tracking-widest mb-1">{getChildName(entry.child_id)}</p>
                        <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-4">{entry.title}</h3>
                        <p className="text-sm text-ui-soft line-clamp-2 mb-8 font-medium leading-relaxed">{entry.content}</p>
                        
                        <div className="flex gap-2">
                             <Link href={`/admin/portfolios/${entry.id}`} className="flex-1">
                               <IOSButton
                                 variant="secondary"
                                 className="w-full py-3 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white text-black"
                               >
                                 Öffnen
                               </IOSButton>
                             </Link>
                        </div>
                    </div>
                </IOSCard>
            ))}
      </div>
    </div>
  )
}
