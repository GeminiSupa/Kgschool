'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.fees'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useMonthlyFeesStore } from '@/stores/monthlyFees'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { sT } from '@/i18n/sT'

export default function ParentBillingPage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const { fees, loading: feesLoading, error: feesError, fetchFees } = useMonthlyFeesStore()
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadData()
    }
  }, [user?.id])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .contains('parent_ids', [user?.id])
      
      if (childrenError) throw childrenError
      setMyChildren(children || [])

      if (children && children.length > 0) {
        // Fetch fees for each child
        await Promise.all(children.map(child => fetchFees(child.id)))
      }
    } catch (e: any) {
      console.error('Error loading billing data:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const getChildName = (childId: string) => {
    const child = myChildren.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const getMonthName = (month: number) => {
    return new Date(2000, month - 1, 1).toLocaleString('de-DE', { month: 'long' })
  }

  const statusColors: Record<string, string> = {
    paid: 'bg-green-50 text-green-700 border-green-100',
    pending: 'bg-amber-50 text-amber-700 border-amber-100',
    overdue: 'bg-red-50 text-red-700 border-red-100',
    waived: 'bg-gray-50 text-ui-soft border-gray-100'
  }

  const statusLabels: Record<string, string> = {
    paid: 'Bezahlt',
    pending: 'Ausstehend',
    overdue: 'Überfällig',
    waived: 'Erlassen'
  }

  const feeTypeLabels: Record<string, string> = {
    tuition: 'Schulgeld',
    lunch: 'Mittagessen',
    activities: 'Aktivitäten',
    other: 'Sonstiges'
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>
  if (error || feesError) return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <ErrorAlert message={error || feesError?.message || t(sT('errLoadData'))} />
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Status Ihrer monatlichen Gebühren und Zahlungen.</p>
      </div>

      {fees.length === 0 ? (
        <IOSCard className="p-12 text-center bg-gray-50/50">
          <div className="text-5xl opacity-40 mb-4">💰</div>
          <p className="text-ui-soft font-medium">Bisher wurden keine Abrechnungen erstellt.</p>
        </IOSCard>
      ) : (
        <div className="grid gap-5">
          {fees.map(fee => (
            <IOSCard key={fee.id} className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-black/5">
              <div className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                       <span className="text-xs font-bold text-black/40 uppercase tracking-widest">
                          {getMonthName(fee.month)} {fee.year}
                       </span>
                       <span className="px-2 py-0.5 bg-gray-100 text-ui-soft text-[10px] font-black uppercase tracking-wider rounded-md border border-black/5">
                          {feeTypeLabels[fee.fee_type] || fee.fee_type}
                       </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-4">
                        <h4 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tighter">€{fee.amount.toFixed(2)}</h4>
                        <span className="text-sm font-bold text-ui-soft">für {getChildName(fee.child_id)}</span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold">
                        <div className="flex items-center gap-1.5 text-ui-soft">
                            <span>📅</span> Fällig am {new Date(fee.due_date).toLocaleDateString('de-DE')}
                        </div>
                        {fee.paid_at && (
                            <div className="flex items-center gap-1.5 text-green-600">
                                <span>✅</span> Bezahlt am {new Date(fee.paid_at).toLocaleDateString('de-DE')}
                            </div>
                        )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center gap-3">
                    <span className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border ${statusColors[fee.status] || ''}`}>
                        {statusLabels[fee.status] || fee.status}
                    </span>
                    <Link href={`/parent/billing/${fee.id}`} className="w-full">
                        <button className="w-full px-4 py-2 text-xs font-black text-[#667eea] hover:bg-[#667eea]/5 rounded-xl transition-colors">
                            Details →
                        </button>
                    </Link>
                  </div>
                </div>
              </div>
            </IOSCard>
          ))}
        </div>
      )}
    </div>
  )
}
