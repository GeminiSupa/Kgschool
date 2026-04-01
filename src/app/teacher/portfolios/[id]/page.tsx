'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { usePortfoliosStore } from '@/stores/portfolios'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

export default function PortfolioDetailPage() {
  const { t } = useI18n()
  const router = useRouter()
  const { id } = useParams()
  const { portfolios, loading: portfoliosLoading, error: portfoliosError, fetchPortfolios, deletePortfolio } = usePortfoliosStore()
  const { children, fetchChildren } = useChildrenStore()
  
  const [portfolio, setPortfolio] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadData()
    }
  }, [id])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchPortfolios(),
        fetchChildren()
      ])
    } catch (e) {
      console.error('Error loading portfolio detail:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (portfolios.length > 0 && id) {
      const found = portfolios.find(p => p.id === id)
      setPortfolio(found)
    }
  }, [portfolios, id])

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

  const handleDelete = async () => {
    if (!confirm(t(sT('confirmDeletePortfolioItem')))) return
    try {
      await deletePortfolio(id as string)
      alert(t(sT('successPortfolioDeleted')))
      router.push('/teacher/portfolios')
    } catch (e: any) {
      alert(e.message || t(sT('errDeleteDocument')))
    }
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (!portfolio && !portfoliosLoading)
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p className="text-gray-500">{t(sT('errNotFoundPortfolio'))}</p>
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Link
          href="/teacher/portfolios"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Portfolios
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-4">
          <div>
            <Heading size="xl" className="text-gray-900 tracking-tight">{portfolio.title}</Heading>
            <div className="flex items-center gap-3 mt-2">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-md border border-blue-100">
                  {getPortfolioTypeLabel(portfolio.portfolio_type)}
                </span>
                <span className="text-sm font-bold text-gray-400">{getChildName(portfolio.child_id)} • {new Date(portfolio.date).toLocaleDateString('de-DE')}</span>
            </div>
          </div>
          <div className="flex gap-3">
             <IOSButton variant="secondary" onClick={() => router.push(`/teacher/portfolios/${id}/edit`)} className="px-5 py-2 text-sm font-bold border-black/5 hover:border-[#667eea]/40 transition-all">
                Bearbeiten
             </IOSButton>
             <IOSButton variant="secondary" onClick={handleDelete} className="px-5 py-2 text-sm font-bold text-red-500 hover:text-red-600 border-red-50 hover:border-red-100 transition-all">
                Löschen
             </IOSButton>
          </div>
        </div>
      </div>

      <IOSCard className="p-0 overflow-hidden shadow-2xl shadow-blue-900/5 mb-8 border-black/5">
        {portfolio.attachments && portfolio.attachments.length > 0 && (
          <div className="border-b border-black/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 bg-[#f2f2f7]">
                {portfolio.attachments.map((url: string, idx: number) => (
                    <div key={idx} className="aspect-square bg-white flex items-center justify-center overflow-hidden">
                        <img src={url} alt={`Anhang ${idx + 1}`} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
                    </div>
                ))}
            </div>
          </div>
        )}
        
        <div className="p-8">
            {portfolio.description && (
                <div className="mb-10">
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">Zusammenfassung</p>
                    <p className="text-lg font-medium text-gray-700 leading-relaxed italic">{portfolio.description}</p>
                </div>
            )}
            
            {portfolio.content && (
                <div className="mb-10">
                    <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-3">Details & Beobachtungen</p>
                    <div className="text-base text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">{portfolio.content}</div>
                </div>
            )}
            
            <div className="pt-8 border-t border-black/5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#667eea] flex items-center justify-center text-white text-xs font-black">?</div>
                    <div>
                        <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Erstellt von</p>
                        <p className="text-xs font-bold text-gray-700 italic">Pädagogische Fachkraft</p>
                    </div>
                </div>
                <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Zuletzt aktualisiert: {new Date(portfolio.updated_at).toLocaleDateString('de-DE')}</p>
            </div>
        </div>
      </IOSCard>
    </div>
  )
}
