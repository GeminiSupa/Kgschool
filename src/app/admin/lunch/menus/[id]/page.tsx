'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useLunchStore, type LunchMenu, type LunchOrder } from '@/stores/lunch'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useAuth } from '@/hooks/useAuth'
import { useI18n } from '@/i18n/I18nProvider'
import { sT } from '@/i18n/sT'

export default function AdminLunchMenuDetailsPage() {
  const { t } = useI18n()
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const menuId = params?.id

  const supabase = useMemo(() => createClient(), [])
  const lunchStore = useLunchStore()
  const childrenStore = useChildrenStore()
  const { profile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [menu, setMenu] = useState<LunchMenu | null>(null)
  const [orders, setOrders] = useState<LunchOrder[]>([])

  const getChildName = (childId: string) => {
    const c = childrenStore.children.find((ch) => ch.id === childId)
    return c ? `${c.first_name} ${c.last_name}` : childId
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString('de-DE')

  const statusLabel = (status: LunchOrder['status']) => {
    if (status === 'confirmed') return 'Bestätigt'
    if (status === 'cancelled') return 'Storniert'
    return status
  }

  useEffect(() => {
    const run = async () => {
      if (!menuId) {
        setError(t(sT('errNotFoundMenu')))
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const { data: menuData, error: menuError } = await supabase
          .from('lunch_menus')
          .select('*')
          .eq('id', menuId)
          .single()

        if (menuError) throw menuError
        if (!menuData) {
          setError(t(sT('errNotFoundMenu')))
          setMenu(null)
          return
        }

        setMenu(menuData as LunchMenu)

        // Load orders for this menu.
        await lunchStore.fetchOrders(undefined, menuId, profile?.kita_id)
        setOrders(lunchStore.orders.filter((o) => o.menu_id === menuId))

        await childrenStore.fetchChildren(profile?.kita_id)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : t(sT('errLoadMenu')))
      } finally {
        setLoading(false)
      }
    }

    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [menuId, t])

  return (
    <div>
      <div className="mb-6">
        <button
          type="button"
          onClick={() => router.push('/admin/lunch/menus')}
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Lunch Menus
        </button>
        <Heading size="xl" className="mb-1">
          Mittagessen-Menü
        </Heading>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6">
          <ErrorAlert message={error} />
        </div>
      ) : !menu ? (
        <IOSCard className="p-10 text-center bg-gray-50/30 border-black/5">
          <p className="text-ui-muted font-semibold">Menü nicht gefunden</p>
        </IOSCard>
      ) : (
        <IOSCard className="p-6 max-w-3xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-2">
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-slate-50 mb-1">{menu.meal_name}</h3>
                <p className="text-sm text-ui-soft">{formatDate(menu.date)}</p>
              </div>
              {menu.description && <p className="text-sm text-slate-700 dark:text-slate-200">{menu.description}</p>}
            </div>

            {menu.allergens && menu.allergens.length > 0 && (
              <div>
                <p className="text-sm font-semibold text-blue-700 mb-2">Allergene</p>
                <div className="flex flex-wrap gap-2">
                  {menu.allergens.map((a) => (
                    <span
                      key={a}
                      className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800"
                    >
                      {a}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {menu.nutritional_info && Object.keys(menu.nutritional_info).length > 0 && (
              <div className="p-4 bg-linear-to-br from-green-50 to-blue-50 rounded-xl border border-green-100">
                <Heading size="md" className="mb-3">
                  Nährwertinformationen
                </Heading>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(menu.nutritional_info).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-3">
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 capitalize">{key}:</span>
                      <span className="text-sm text-slate-900 dark:text-slate-50">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {menu.photo_url && (
              <div>
                <p className="text-sm font-semibold text-blue-700 mb-2">Foto</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={menu.photo_url}
                  alt={menu.meal_name}
                  className="w-full max-w-md h-64 object-cover rounded-md"
                />
              </div>
            )}

            <div className="pt-4 border-t border-gray-200 flex justify-between items-center gap-4">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Bestellungen für dieses Menü</h3>
              <IOSButton
                onClick={() => router.push(`/admin/lunch/menus/${menu.id}/edit`)}
                variant="secondary"
                className="px-4 py-2"
              >
                ✏️ Menü bearbeiten
              </IOSButton>
            </div>

            {orders.length === 0 ? (
              <p className="text-sm text-ui-muted">Noch keine Bestellungen für dieses Menü.</p>
            ) : (
              <div className="space-y-2">
                {orders.map((order) => (
                  <IOSCard key={order.id} className="p-4 border-black/5" elevated={false}>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-medium text-sm text-slate-900 dark:text-slate-50">{getChildName(order.child_id)}</p>
                        <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                          Status: <span className="font-semibold">{statusLabel(order.status)}</span>
                        </p>
                        {order.special_requests && (
                          <p className="text-xs text-slate-700 dark:text-slate-200 mt-1">
                            Besondere Wünsche: {order.special_requests}
                          </p>
                        )}
                      </div>
                    </div>
                  </IOSCard>
                ))}
              </div>
            )}
          </div>
        </IOSCard>
      )}
    </div>
  )
}

