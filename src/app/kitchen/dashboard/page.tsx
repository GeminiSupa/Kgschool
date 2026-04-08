'use client'

import React, { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSStatCard } from '@/components/common/IOSStatCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import Link from 'next/link'
import { MiniLineChart, type MiniLinePoint } from '@/components/dashboard/MiniLineChart'
import { getLastNDays } from '@/utils/dashboard/dateRange'

type KitchenMenu = {
  meal_name: string
  description?: string
  allergens?: string[]
}

export default function KitchenDashboardPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)

  const [todayOrders, setTodayOrders] = useState(0)
  const [weeklyMenus, setWeeklyMenus] = useState(0)
  const [pendingPrep, setPendingPrep] = useState(0)
  const [todayMenu, setTodayMenu] = useState<KitchenMenu | null>(null)
  const [ordersTrend, setOrdersTrend] = useState<MiniLinePoint[]>([])

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]
        const startOfWeek = new Date()
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
        const startOfWeekStr = startOfWeek.toISOString().split('T')[0]

        // Today's orders
        const { count: ordersCount } = await supabase
          .from('lunch_orders')
          .select('id', { count: 'exact', head: true })
          .eq('order_date', today)
        setTodayOrders(ordersCount || 0)

        // 7-day orders trend
        const days = getLastNDays(7)
        const counts: number[] = []
        for (const d of days) {
          const { count: c } = await supabase
            .from('lunch_orders')
            .select('id', { count: 'exact', head: true })
            .eq('order_date', d.key)
          counts.push(c || 0)
        }
        setOrdersTrend(days.map((d, i) => ({ xLabel: d.label, y: counts[i] ?? 0 })))

        // Weekly menus
        const { count: menusCount } = await supabase
          .from('lunch_menus')
          .select('id', { count: 'exact', head: true })
          .gte('date', startOfWeekStr)
        setWeeklyMenus(menusCount || 0)

        // Pending prep orders
        const { count: pendingCount } = await supabase
          .from('lunch_orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'confirmed')
        setPendingPrep(pendingCount || 0)

        // Today's menu
        const { data: menu } = await supabase.from('lunch_menus').select('*').eq('date', today).single()
        setTodayMenu(menu || null)
      } catch (e) {
        console.error('Error fetching dashboard data:', e)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [supabase])

  return (
    <div>
      <Heading size="xl" className="mb-6">
        Kitchen Dashboard
      </Heading>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <IOSStatCard title="Today's Orders" value={todayOrders} icon="🛒" className="p-5" />
            <IOSStatCard title="Menus This Week" value={weeklyMenus} icon="🍽️" className="p-5" />
            <IOSStatCard title="Pending Prep" value={pendingPrep} icon="⏳" className="p-5" />
          </div>

          <div className="mb-6">
            <IOSCard className="p-6">
              <div className="flex items-center justify-between mb-3">
                <Heading size="md">Orders (7 days)</Heading>
                <Link href="/kitchen/orders" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-300 hover:underline">
                  View →
                </Link>
              </div>
              <MiniLineChart data={ordersTrend} stroke="rgb(245 158 11)" />
            </IOSCard>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <IOSCard className="p-6">
              <Heading size="md" className="mb-4">
                Today&apos;s Menu
              </Heading>
              {!todayMenu ? (
                <div className="text-ui-soft text-sm">No menu for today</div>
              ) : (
                <>
                  <p className="font-medium text-lg mb-2">{todayMenu.meal_name}</p>
                  <p className="text-ui-muted text-sm mb-3">{todayMenu.description}</p>
                  {todayMenu.allergens && todayMenu.allergens.length > 0 && (
                    <div className="text-xs text-orange-700 dark:text-orange-400">Allergens: {todayMenu.allergens.join(', ')}</div>
                  )}
                </>
              )}
            </IOSCard>

            <IOSCard className="p-6">
              <Heading size="md" className="mb-4">
                Quick Links
              </Heading>
              <div className="space-y-1">
                <Link
                  href="/kitchen/menus"
                  className="flex min-h-11 w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:text-slate-200 dark:hover:bg-white/10 dark:focus-visible:ring-indigo-500/40"
                >
                  🍽️ Manage Menus
                </Link>
                <Link
                  href="/kitchen/orders"
                  className="flex min-h-11 w-full items-center rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/50 dark:text-slate-200 dark:hover:bg-white/10 dark:focus-visible:ring-indigo-500/40"
                >
                  🛒 View Orders
                </Link>
              </div>
            </IOSCard>
          </div>
        </>
      )}
    </div>
  )
}

