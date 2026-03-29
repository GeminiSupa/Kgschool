'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing.refunds'

import React, { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/utils/supabase/client'
import { useChildrenStore, type Child } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { IOSButton } from '@/components/ui/IOSButton'
import { IOSCard } from '@/components/ui/IOSCard'

type RefundableItem = {
  id: string
  child_id: string
  date: string
  meal_price: number
  refunded: boolean
  is_refundable: boolean
  monthly_billing: {
    month: number
    year: number
    child_id: string
  }
  billing_month?: number
  billing_year?: number
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString()
}

function getMonthName(month: number) {
  const d = new Date(2000, month - 1, 1)
  return d.toLocaleString('default', { month: 'long' })
}

export default function AdminLunchBillingRefundsPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])
  const childrenStore = useChildrenStore()
  const { children, fetchChildren } = childrenStore

  const [itemsLoading, setItemsLoading] = useState(false)
  const [processing, setProcessing] = useState(false)

  const [error, setError] = useState('')
  const [refundableItems, setRefundableItems] = useState<RefundableItem[]>([])

  useEffect(() => {
    void fetchChildren()
  }, [fetchChildren])

  const loadRefundableItems = async () => {
    setItemsLoading(true)
    setError('')
    try {
      const { data, error: qError } = await supabase
        .from('lunch_billing_items')
        .select(`
          *,
          monthly_billing!inner(month, year, child_id)
        `)
        .eq('is_refundable', true)
        .eq('refunded', false)
        .order('date', { ascending: false })

      if (qError) throw qError

      setRefundableItems(
        (data || []).map((item: any) => ({
          ...item,
          child_id: item.monthly_billing.child_id,
          billing_month: item.monthly_billing.month,
          billing_year: item.monthly_billing.year,
        })),
      )
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load refundable items')
      alert(e instanceof Error ? e.message : 'Failed to load refundable items')
    } finally {
      setItemsLoading(false)
    }
  }

  const totalRefundAmount = refundableItems
    .filter((i) => !i.refunded)
    .reduce((sum, item) => sum + Number(item.meal_price || 0), 0)

  const getChildName = (childId: string) => {
    const child = (children || []) as Child[]
    const c = child.find((cc) => cc.id === childId)
    return c ? `${c.first_name} ${c.last_name}` : childId
  }

  const processRefund = async (itemId: string) => {
    if (!confirm('Process refund for this item?')) return
    setProcessing(true)
    setError('')

    try {
      const res = await fetch('/api/admin/lunch/billing/process-refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids: [itemId] }),
      })
      const data = await res.json()
      if (data?.success) {
        alert('Refund processed successfully!')
        await loadRefundableItems()
      } else {
        throw new Error(data?.message || 'Failed to process refund')
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to process refund')
    } finally {
      setProcessing(false)
    }
  }

  const processAllRefunds = async () => {
    if (!confirm(`Process refunds for all ${refundableItems.length} items?`)) return
    setProcessing(true)
    setError('')

    try {
      const itemIds = refundableItems.filter((i) => !i.refunded).map((i) => i.id)
      const res = await fetch('/api/admin/lunch/billing/process-refunds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_ids: itemIds }),
      })
      const data = await res.json()
      if (data?.success) {
        alert(`Successfully processed ${data.count} refunds!`)
        await loadRefundableItems()
      } else {
        throw new Error(data?.message || 'Failed to process refunds')
      }
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed to process refunds')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/admin/lunch/billing" className="text-gray-600 hover:text-gray-900 mb-4 inline-block">
          ← Back to Billing
        </Link>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-6 mb-6 max-w-4xl mx-auto">
        <p className="text-gray-600 mb-4">
          Refundable items are informed absences from previous months that were notified before the deadline.
        </p>
        <IOSButton
          type="button"
          onClick={() => void loadRefundableItems()}
          disabled={processing || itemsLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {itemsLoading ? 'Loading...' : 'Load Refundable Items'}
        </IOSButton>
        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </IOSCard>

      {itemsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : refundableItems.length === 0 ? (
        <IOSCard className="bg-white rounded-lg shadow p-8 text-center text-gray-500 max-w-4xl mx-auto">
          No refundable items found.
        </IOSCard>
      ) : (
        <IOSCard className="bg-white rounded-lg shadow overflow-hidden max-w-4xl mx-auto">
          <div className="p-4 bg-gray-50 border-b flex items-center justify-between gap-4">
            <div>
              <p className="font-medium">Total Refundable Amount: €{totalRefundAmount.toFixed(2)}</p>
              <p className="text-sm text-gray-600">{refundableItems.length} items</p>
            </div>
            <IOSButton
              type="button"
              onClick={() => void processAllRefunds()}
              disabled={processing}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Process All Refunds'}
            </IOSButton>
          </div>

          <div className="divide-y divide-gray-200">
            {refundableItems.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{getChildName(item.child_id)}</p>
                    <p className="text-sm text-gray-600 mt-1">
                      Date: {formatDate(item.date)} | Amount: €{Number(item.meal_price).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Billing: {getMonthName(item.billing_month || 1)} {item.billing_year || new Date().getFullYear()}
                    </p>
                  </div>

                  <div>
                    {!item.refunded ? (
                      <IOSButton
                        type="button"
                        onClick={() => void processRefund(item.id)}
                        disabled={processing}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        Process Refund
                      </IOSButton>
                    ) : (
                      <span className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-md">Refunded</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </IOSCard>
      )}
    </div>
  )
}

