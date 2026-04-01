'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useKita } from '@/hooks/useKita'
import { useLunchStore, type LunchOrder } from '@/stores/lunch'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

export default function KitchenOrdersPage() {
  const { t } = useI18n()
  const supabase = useMemo(() => createClient(), [])
  const { getUserKitaId } = useKita()

  const childrenStore = useChildrenStore()
  const lunchStore = useLunchStore()

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orders, setOrders] = useState<LunchOrder[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')

      try {
        const kitaId = await getUserKitaId()
        await Promise.all([
          childrenStore.fetchChildren(kitaId || undefined),
          lunchStore.fetchMenus(undefined, undefined, kitaId || undefined),
        ])
        await fetchOrders()
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : t(sT('errLoadKitchenOrders'))
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!loading) fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      setError('')

      const { data, error: err } = await supabase
        .from('lunch_orders')
        .select('*')
        .eq('order_date', selectedDate)
        .order('created_at', { ascending: true })

      if (err) throw err
      setOrders((data || []) as LunchOrder[])
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errLoadKitchenOrders'))
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: LunchOrder['status']) => {
    try {
      const { error: err } = await supabase.from('lunch_orders').update({ status }).eq('id', orderId)
      if (err) throw err

      setOrders((prev) => prev.map((o) => (o.id === orderId ? ({ ...o, status } as LunchOrder) : o)))
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t(sT('errUpdateKitchenOrder'))
      alert(message)
    }
  }

  const getChildName = (childId: string) => {
    const child = childrenStore.children.find((c) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const getMenuName = (menuId: string) => {
    const menu = lunchStore.menus.find((m) => m.id === menuId)
    return menu ? menu.meal_name : menuId
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  return (
    <div>
      <Heading size="xl" className="mb-6">
        Lunch Orders
      </Heading>

      <div className="mb-4">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : (
        <IOSCard className="p-0 overflow-hidden">
          {orders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No orders for this date.</div>
          ) : (
            <div className="divide-y divide-gray-200">
              {orders.map((order) => (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900">{getChildName(order.child_id)}</p>
                        {order.auto_created && (
                          <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                            Auto-created
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{getMenuName(order.menu_id)}</p>
                      <p className="text-xs text-gray-500 mt-2">Order Date: {formatDate(order.order_date)}</p>
                      {order.status === 'cancelled' && (
                        <p className="text-xs text-red-600 mt-1">Cancelled</p>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <span
                        className={[
                          'px-3 py-1 text-sm font-medium rounded-full',
                          order.status === 'served'
                            ? 'bg-green-100 text-green-800'
                            : order.status === 'prepared'
                              ? 'bg-blue-100 text-blue-800'
                              : order.status === 'confirmed'
                                ? 'bg-yellow-100 text-yellow-800'
                                : order.status === 'cancelled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800',
                        ].join(' ')}
                      >
                        {order.status}
                      </span>

                      <div className="flex gap-2">
                        {order.status === 'confirmed' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'prepared')}
                            className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                          >
                            Mark Prepared
                          </button>
                        )}

                        {order.status === 'prepared' && (
                          <button
                            onClick={() => updateOrderStatus(order.id, 'served')}
                            className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                          >
                            Mark Served
                          </button>
                        )}
                      </div>
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

