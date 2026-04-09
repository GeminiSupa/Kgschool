'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'parent.lunch'

import React, { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useLunchStore } from '@/stores/lunch'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { OrderDeadlineWarning } from '@/components/lunch/OrderDeadlineWarning'
import { sT } from '@/i18n/sT'

export default function ParentLunchPage() {
  const { t } = useI18n()

  const { user } = useAuth()
  const { menus, orders, loading: lunchLoading, error: lunchError, fetchMenus, fetchOrders, createOrder, cancelOrder } = useLunchStore()
  
  const [myChildren, setMyChildren] = useState<any[]>([])
  const [selectedChildId, setSelectedChildId] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (user?.id) {
      loadInitialData()
    }
  }, [user?.id])

  useEffect(() => {
    if (selectedChildId) {
      fetchOrders(selectedChildId)
    }
  }, [selectedChildId, fetchOrders])

  const loadInitialData = async () => {
    setLoading(true)
    setError('')
    try {
      // 1. Fetch children
      const { data: children, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .contains('parent_ids', [user?.id])
      
      if (childrenError) throw childrenError
      setMyChildren(children || [])
      
      if (children && children.length > 0) {
        setSelectedChildId(children[0].id)
      }

      // 2. Fetch upcoming menus (next 14 days)
      const today = new Date().toISOString().split('T')[0]
      const next14Days = new Date()
      next14Days.setDate(next14Days.getDate() + 14)
      await fetchMenus(today, next14Days.toISOString().split('T')[0])

    } catch (e: any) {
      console.error('Error loading lunch initial data:', e)
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  const selectedChildOrders = useMemo(() => {
    return orders.filter(o => o.child_id === selectedChildId)
  }, [orders, selectedChildId])

  const todayOrder = useMemo(() => {
    return selectedChildOrders.find(o => o.order_date === today)
  }, [selectedChildOrders, today])

  const hasOrdered = (menuId: string) => {
    return selectedChildOrders.some(o => o.menu_id === menuId && o.status !== 'cancelled')
  }

  const handlePlaceOrder = async (menuId: string) => {
    if (!selectedChildId) return
    const menu = menus.find(m => m.id === menuId)
    if (!menu) return

    try {
      await createOrder({
        child_id: selectedChildId,
        menu_id: menuId,
        order_date: menu.date,
        status: 'confirmed',
        auto_created: false
      })
      await fetchOrders(selectedChildId)
    } catch (e: any) {
      alert(e.message || t(sT('errOrderLunch')))
    }
  }

  const handleCancelOrder = async (menuId: string) => {
    if (!selectedChildId || !user?.id) return
    const order = selectedChildOrders.find(o => o.menu_id === menuId && o.status !== 'cancelled')
    if (!order) return

    if (!confirm(t(sT('confirmCancelLunchOrder')))) return

    try {
      await cancelOrder(order.id, user.id)
      await fetchOrders(selectedChildId)
    } catch (e: any) {
      alert(e.message || t(sT('errCancelOrder')))
    }
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Ausstehend',
      confirmed: 'Bestätigt',
      prepared: 'Zubereitet',
      served: 'Serviert',
      cancelled: 'Storniert'
    }
    return labels[status] || status
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8">
        <Heading size="xl" className="text-slate-900 dark:text-slate-50">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">Verwalten Sie die Mahlzeiten für Ihre Kinder.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Heading size="sm" className="mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-widest text-[10px] font-black">Kind auswählen</Heading>
          <div className="grid gap-2">
            {myChildren.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-300 border-2 ${
                  selectedChildId === child.id
                    ? 'bg-white border-aura-primary shadow-lg shadow-black/5'
                    : 'bg-gray-50 border-transparent hover:bg-white hover:border-black/5'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-black transition-colors ${
                  selectedChildId === child.id ? 'bg-aura-primary' : 'bg-gray-400'
                }`}>
                  {child.first_name[0]}{child.last_name[0]}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-bold ${selectedChildId === child.id ? 'text-aura-primary' : 'text-slate-700 dark:text-slate-200'}`}>
                    {child.first_name}
                  </p>
                  <p className="text-[10px] font-bold text-black/30 uppercase tracking-wider">{child.last_name}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {todayOrder && (
            <div className="mb-8">
              <OrderDeadlineWarning orderDate={today} />
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <Heading size="md" className="text-slate-800 dark:text-slate-100">Speiseplan</Heading>
            <div className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black text-ui-soft uppercase tracking-widest border border-black/5">
              Nächste 14 Tage
            </div>
          </div>

          {lunchLoading && menus.length === 0 ? (
            <div className="flex justify-center py-12"><LoadingSpinner /></div>
          ) : menus.length === 0 ? (
            <IOSCard className="p-12 text-center bg-gray-50/50">
              <div className="text-5xl opacity-40 mb-4">🍽️</div>
              <p className="text-ui-soft font-medium">Momentan ist kein Speiseplan verfügbar.</p>
            </IOSCard>
          ) : (
            <div className="grid gap-5">
              {menus.map(menu => {
                const ordered = hasOrdered(menu.id)
                const isToday = menu.date === today
                return (
                  <IOSCard key={menu.id} className="p-0 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border-black/5">
                    <div className="p-6">
                      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                             <span className="text-xs font-bold text-black/40 uppercase tracking-widest">
                                {new Date(menu.date).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
                             </span>
                             {isToday && (
                               <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-black uppercase tracking-wider rounded-md border border-green-100">Heute</span>
                             )}
                          </div>
                          <h4 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-2 tracking-tight">{menu.meal_name}</h4>
                          <p className="text-sm font-medium text-ui-muted leading-relaxed mb-4">{menu.description}</p>
                          
                          {menu.allergens && menu.allergens.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {menu.allergens.map((alg, i) => (
                                <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[9px] font-bold uppercase tracking-widest rounded-md border border-amber-100">
                                  {alg}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex md:flex-col items-center gap-3 min-w-[140px]">
                          {ordered ? (
                            <div className="w-full">
                              <div className="flex flex-col items-center p-3 py-2.5 bg-green-50 rounded-2xl border border-green-100 mb-2">
                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest">Bestellt</span>
                                <span className="text-sm font-bold text-green-700">✓</span>
                              </div>
                              <IOSButton
                                variant="secondary"
                                onClick={() => handleCancelOrder(menu.id)}
                                className="w-full text-xs py-2 h-auto text-red-500 hover:text-red-600 font-black border-red-50"
                              >
                                Stornieren
                              </IOSButton>
                            </div>
                          ) : (
                            <IOSButton
                              variant="primary"
                              onClick={() => handlePlaceOrder(menu.id)}
                              className="w-full font-black text-xs py-3 h-auto shadow-lg shadow-black/10"
                            >
                              Bestellen
                            </IOSButton>
                          )}
                        </div>
                      </div>
                    </div>
                  </IOSCard>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
