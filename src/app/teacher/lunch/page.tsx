'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useI18n } from '@/i18n/I18nProvider'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSCard } from '@/components/ui/IOSCard'

type LunchMenu = {
  id: string
  date: string
  meal_name: string
  description: string | null
  allergens: string[] | null
}

export default function TeacherLunchPage() {
  const { t, lang } = useI18n()
  const supabase = useMemo(() => createClient(), [])
  const [menus, setMenus] = useState<LunchMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const loadMenus = async () => {
      try {
        setLoading(true)
        setError('')
        const today = new Date().toISOString().split('T')[0]
        const next14Days = new Date()
        next14Days.setDate(next14Days.getDate() + 14)

        const { data, error } = await supabase
          .from('lunch_menus')
          .select('id, date, meal_name, description, allergens')
          .gte('date', today)
          .lte('date', next14Days.toISOString().split('T')[0])
          .order('date')

        if (error) throw error
        setMenus((data as LunchMenu[]) || [])
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : 'Failed to load lunch menus.'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadMenus()
  }, [supabase])

  const locale = lang === 'de' ? 'de-DE' : lang === 'tr' ? 'tr-TR' : 'en-US'
  const today = useMemo(() => new Date().toISOString().split('T')[0], [])

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto pb-12">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Heading size="xl" className="text-slate-900 dark:text-slate-50">
            Teacher Lunch Overview
          </Heading>
          <p className="mt-1 text-sm text-ui-soft">Read-only menu view for the next 14 days.</p>
        </div>
        <Link href="/teacher/dashboard" className="ui-inline-link">
          ← Back to dashboard
        </Link>
      </div>

      {error ? (
        <IOSCard className="p-6 text-sm text-red-700 dark:text-red-300">{error}</IOSCard>
      ) : menus.length === 0 ? (
        <IOSCard className="p-12 text-center">
          <div className="mb-4 text-5xl opacity-40">🍽️</div>
          <p className="font-medium text-ui-soft">{t('common.noData') || 'No lunch menus available right now.'}</p>
        </IOSCard>
      ) : (
        <div className="grid gap-5">
          {menus.map((menu) => {
            const isToday = menu.date === today
            return (
              <IOSCard key={menu.id} className="p-6">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-3">
                      <span className="text-xs font-bold uppercase tracking-widest text-ui-soft">
                        {new Date(menu.date).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
                      </span>
                      {isToday ? (
                        <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
                          Today
                        </span>
                      ) : null}
                    </div>
                    <h2 className="mb-2 text-xl font-black tracking-tight text-slate-900 dark:text-slate-50">
                      {menu.meal_name}
                    </h2>
                    <p className="text-sm font-medium leading-relaxed text-ui-muted">
                      {menu.description || 'No description provided.'}
                    </p>
                  </div>
                  <div className="md:w-56">
                    <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-ui-soft">Allergens</div>
                    <div className="flex flex-wrap gap-1.5">
                      {(menu.allergens || []).length > 0 ? (
                        (menu.allergens || []).map((allergen) => (
                          <span
                            key={allergen}
                            className="rounded-md border border-amber-100 bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
                          >
                            {allergen}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-ui-soft">No allergens listed.</span>
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
  )
}
