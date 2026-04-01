'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.pricing'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useGroupsStore } from '@/stores/groups'
import { useKita } from '@/hooks/useKita'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { sT } from '@/i18n/sT'

type LunchPricing = {
  id: string
  group_id: string
  price_per_meal: number
  effective_from: string
  effective_to?: string | null
}

export default function AdminLunchPricingPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])
  const groupsStore = useGroupsStore()
  const { getUserKitaId } = useKita()

  const [pricing, setPricing] = useState<LunchPricing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [groupsLoading, setGroupsLoading] = useState(false)

  const load = async () => {
    try {
      setLoading(true)
      setError('')

      const kitaId = await getUserKitaId()
      setGroupsLoading(true)
      await groupsStore.fetchGroups(kitaId || undefined)

      const ids = groupsStore.groups.map((g) => g.id)
      if (ids.length === 0) {
        setPricing([])
        return
      }

      const { data, error: pricingError } = await supabase
        .from('lunch_pricing')
        .select('id, group_id, price_per_meal, effective_from, effective_to')
        .in('group_id', ids)
        .order('effective_from', { ascending: false })

      if (pricingError) throw pricingError
      setPricing((data as LunchPricing[]) || [])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t(sT('errLoadPricing')))
    } finally {
      setGroupsLoading(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const getGroupName = (groupId: string) => {
    const group = groupsStore.groups.find((g) => g.id === groupId)
    return group ? group.name : groupId
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex justify-between items-center mb-6 gap-4">
        <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
        <Link href="/admin/lunch/pricing/new">
          <IOSButton className="px-4 py-2 text-sm font-black bg-[#667eea] text-white border-none">
            ➕ Add Pricing
          </IOSButton>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : pricing.length === 0 ? (
        <IOSCard className="p-8 text-center bg-gray-50/30 border-black/5">
          No pricing rules created yet.
        </IOSCard>
      ) : (
        <IOSCard className="overflow-hidden">
          <div className="divide-y divide-gray-200">
            {pricing.map((price) => (
              <div key={price.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-lg font-medium text-gray-900">{getGroupName(price.group_id)}</p>
                    <p className="text-sm text-gray-600 mt-1">€{price.price_per_meal.toFixed(2)} per meal</p>
                    <p className="text-xs text-gray-500 mt-2">
                      Effective: {formatDate(price.effective_from)}
                      {price.effective_to ? ` - ${formatDate(price.effective_to)}` : ' (Current)'}
                    </p>
                  </div>
                  <Link href={`/admin/lunch/pricing/${price.id}`}>
                    <IOSButton variant="secondary" className="px-4 py-2 text-sm">
                      Edit →
                    </IOSButton>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </IOSCard>
      )}
    </div>
  )
}

