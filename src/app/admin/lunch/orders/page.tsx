'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.orders'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useLunchStore, LunchOrder } from '@/stores/lunch'
import { useChildrenStore } from '@/stores/children'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

export default function AdminLunchOrdersPage() {
  const { t } = useI18n()

  const { profile } = useAuth()
  const { orders, loading, error, fetchOrders } = useLunchStore()
  const { children, fetchChildren } = useChildrenStore()
  
  useEffect(() => {
    if (profile?.kita_id) {
        fetchOrders(undefined, undefined, profile.kita_id)
        fetchChildren()
    }
  }, [profile, fetchOrders, fetchChildren])

  const getChildName = (childId: string) => {
    const c = children.find(c => c.id === childId)
    return c ? `${c.first_name} ${c.last_name}` : 'Unbekannt'
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-blue-50 text-blue-600 border-blue-100',
      confirmed: 'bg-green-50 text-green-600 border-green-100',
      served: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      cancelled: 'bg-red-50 text-red-600 border-red-100'
    }
    return (
        <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded-md border ${styles[status]}`}>
            {status}
        </span>
    )
  }

  if (loading && orders.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50 tracking-tight">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-ui-soft mt-1">Übersicht aller Essensbestellungen Ihrerer Kita.</p>
        </div>
        <Link href="/admin/lunch/billing">
          <IOSButton variant="secondary" className="px-6 py-2.5 text-sm font-black uppercase tracking-widest border-black/10">
            💰 Abrechnung verwalten
          </IOSButton>
        </Link>
      </div>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Bestellungen'} />
      ) : orders.length === 0 ? (
        <IOSCard className="p-20 text-center bg-gray-50/30 border-black/5">
          <div className="text-6xl opacity-10 mb-6">🛒</div>
          <p className="text-ui-soft font-bold max-w-xs mx-auto">Aktuell liegen keine Bestellungen vor.</p>
        </IOSCard>
      ) : (
        <div className="space-y-4">
            {orders.map(order => (
                <IOSCard key={order.id} className="p-0 overflow-hidden border-black/5 group hover:shadow-xl transition-all duration-300">
                    <div className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-lg font-black text-slate-900 dark:text-slate-50">{getChildName(order.child_id)}</h3>
                                {getStatusBadge(order.status)}
                            </div>
                            <div className="flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-black text-black/30 uppercase tracking-widest">
                                <span>📅 Datum: {new Date(order.order_date).toLocaleDateString()}</span>
                                {order.auto_created && <span className="text-blue-500 italic">Auto-Created</span>}
                            </div>
                        </div>

                        <div className="flex gap-2">
                             <IOSButton variant="secondary" className="px-4 py-2 text-[10px] font-black uppercase tracking-widest border-black/5 bg-gray-50 hover:bg-white">Details</IOSButton>
                        </div>
                    </div>
                </IOSCard>
            ))}
        </div>
      )}
    </div>
  )
}
