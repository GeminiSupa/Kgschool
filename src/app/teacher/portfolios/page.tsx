'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'teacher.portfolios'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { usePortfoliosStore } from '@/stores/portfolios'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function TeacherPortfoliosPage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const { portfolios, loading: portfoliosLoading, error: portfoliosError, fetchPortfolios } = usePortfoliosStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [selectedChildId, setSelectedChildId] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadInitialData()
    }
  }, [user?.id])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchPortfolios(),
        fetchChildren()
      ])
    } catch (e) {
      console.error('Error loading portfolios data:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleChildChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const childId = e.target.value
    setSelectedChildId(childId)
    fetchPortfolios(childId || undefined)
  }

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const getPortfolioTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      artwork: 'Kunstwerk',
      photo: 'Foto',
      achievement: 'Leistung',
      activity: 'Aktivität',
      milestone: 'Meilenstein',
      other: 'Sonstiges'
    }
    return labels[type] || type
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('de-DE')
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Dokumentieren Sie die Entwicklung und Erlebnisse der Kinder.</p>
        </div>
        <Link href="/teacher/portfolios/new">
          <IOSButton variant="primary" className="px-6 py-2.5 text-sm font-bold flex items-center gap-2">
            <span>➕</span>
            <span>Neuer Eintrag</span>
          </IOSButton>
        </Link>
      </div>

      <div className="mb-8">
        <label className="block text-xs font-black text-black/40 uppercase tracking-widest mb-2">Kind filtern</label>
        <select
          value={selectedChildId}
          onChange={handleChildChange}
          className="w-full max-w-xs px-4 py-2.5 bg-white border border-black/10 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
        >
          <option value="">Alle Kinder</option>
          {children.map(child => (
            <option key={child.id} value={child.id}>
              {child.first_name} {child.last_name}
            </option>
          ))}
        </select>
      </div>

      {portfoliosError ? (
        <ErrorAlert message={portfoliosError.message} />
      ) : portfolios.length === 0 ? (
        <IOSCard className="p-16 text-center bg-gray-50/50">
          <div className="text-5xl opacity-40 mb-4">📔</div>
          <p className="text-ui-soft font-medium">Bisher wurden keine Portfolio-Einträge erstellt.</p>
        </IOSCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map(portfolio => (
            <IOSCard key={portfolio.id} className="p-0 overflow-hidden flex flex-col group hover:shadow-xl transition-all duration-300 border-black/5 hover:border-[#667eea]/30">
              {portfolio.attachments && portfolio.attachments.length > 0 && (
                <div className="aspect-[4/3] relative overflow-hidden bg-gray-100">
                  <img
                    src={portfolio.attachments[0]}
                    alt={portfolio.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                     <span className="px-2 py-0.5 bg-white/20 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest rounded-md border border-white/20">
                        {getPortfolioTypeLabel(portfolio.portfolio_type)}
                     </span>
                  </div>
                </div>
              )}
              
              <div className="p-5 flex-1 flex flex-col">
                {(!portfolio.attachments || portfolio.attachments.length === 0) && (
                   <div className="mb-3">
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] font-black uppercase tracking-widest rounded-md border border-blue-100">
                        {getPortfolioTypeLabel(portfolio.portfolio_type)}
                      </span>
                   </div>
                )}
                
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50 group-hover:text-[#667eea] transition-colors line-clamp-1 mb-1 tracking-tight">
                    {portfolio.title}
                </h3>
                <p className="text-xs font-bold text-ui-soft mb-3">{getChildName(portfolio.child_id)} • {formatDate(portfolio.date)}</p>
                
                {portfolio.description && (
                  <p className="text-sm font-medium text-ui-muted line-clamp-2 leading-relaxed mb-6 flex-1">
                    {portfolio.description}
                  </p>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-black/5">
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-black/30 uppercase tracking-widest">
                        <span>📎</span>
                        <span>{portfolio.attachments?.length || 0} Anhänge</span>
                    </div>
                    <Link href={`/teacher/portfolios/${portfolio.id}`}>
                        <button className="text-xs font-black text-[#667eea] hover:translate-x-1 transition-transform">
                            Details →
                        </button>
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
