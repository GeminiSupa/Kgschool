'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing.generate'

import React, { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import { useKita } from '@/hooks/useKita'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'

type BasicPreview = {
  estimatedChildren: number
  hasPricing: boolean
}

type DetailedChildPreview = {
  childId: string
  childName: string
  groupId: string
  days: any[]
  billableDays: number
  refundableDays: number
  estimatedAmount: number
  estimatedRefund: number
}

type DetailedPreview = {
  month: number
  year: number
  totalChildren: number
  children: DetailedChildPreview[]
  summary: {
    totalBillableDays: number
    totalRefundableDays: number
    estimatedTotal: number
    estimatedRefund: number
  }
}

export default function AdminLunchBillingGeneratePage() {
  const { t } = useI18n()

  const router = useRouter()
  const { getUserKitaId } = useKita()

  const supabase = useMemo(() => createClient(), [])

  const today = new Date()
  const [form, setForm] = useState({
    month: today.getMonth() + 1,
    year: today.getFullYear(),
  })

  const [loading, setLoading] = useState(false)
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [error, setError] = useState('')

  const [preview, setPreview] = useState<BasicPreview | null>(null)
  const [detailedPreview, setDetailedPreview] = useState<DetailedPreview | null>(null)
  const [showChildrenPreview, setShowChildrenPreview] = useState(false)

  const isFormValid = form.month >= 1 && form.month <= 12 && !!form.year

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  useEffect(() => {
    void loadPreview()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadPreview = async () => {
    try {
      setError('')

      const kitaId = await getUserKitaId()

      const childrenQuery = supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')

      const childrenCountResp = kitaId ? await childrenQuery.eq('kita_id', kitaId) : await childrenQuery
      const count = childrenCountResp.count || 0

      const pricingQuery = supabase.from('lunch_pricing').select('id').limit(1)
      const { data: pricingData } = await pricingQuery.maybeSingle()

      let groupsQuery = supabase
        .from('groups')
        .select('id, lunch_price_per_meal')
        .not('lunch_price_per_meal', 'is', null)
        .limit(1)

      if (kitaId) groupsQuery = groupsQuery.eq('kita_id', kitaId)

      const { data: groupsData } = await groupsQuery.maybeSingle()

      const hasPricing = !!(pricingData || groupsData)

      setPreview({
        estimatedChildren: count || 0,
        hasPricing,
      })
    } catch (e: unknown) {
      console.error('Error loading preview:', e)
      setPreview({
        estimatedChildren: 0,
        hasPricing: false,
      })
    }
  }

  const loadDetailedPreview = async () => {
    if (!isFormValid) {
      setError('Please fill month and year first')
      return
    }

    setLoadingPreview(true)
    setError('')

    try {
      const res = await fetch(
        `/api/admin/lunch/billing/preview?month=${encodeURIComponent(String(form.month))}&year=${encodeURIComponent(
          String(form.year),
        )}`,
      )
      const data = await res.json()
      if (data?.success && data.preview) {
        setDetailedPreview(data.preview as DetailedPreview)
        setShowChildrenPreview(false)
      } else {
        throw new Error(data?.message || 'Failed to load preview')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load detailed preview')
    } finally {
      setLoadingPreview(false)
    }
  }

  const handleGenerate = async () => {
    if (!isFormValid) {
      setError('Please fill in all required fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/lunch/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: form.month, year: form.year }),
      })

      const data = await res.json()
      if (data?.success) {
        alert(`Successfully generated ${data.count} billing records!`)
        router.push('/admin/lunch/billing')
      } else {
        throw new Error(data?.message || 'Failed to generate billing')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to generate billing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <Link
          href="/admin/lunch/billing"
          className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block"
        >
          ← Back to Billing
        </Link>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleGenerate()
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="month" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Month <span className="text-red-500">*</span>
              </label>
              <select
                id="month"
                value={form.month}
                onChange={(e) => setForm((p) => ({ ...p, month: Number(e.target.value) }))}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {Array.from({ length: 12 }).map((_, idx) => {
                  const m = idx + 1
                  return (
                    <option key={m} value={m}>
                      {getMonthName(m)}
                    </option>
                  )
                })}
              </select>
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">
                Year <span className="text-red-500">*</span>
              </label>
              <input
                id="year"
                value={form.year}
                onChange={(e) => setForm((p) => ({ ...p, year: Number(e.target.value) }))}
                type="number"
                min={new Date().getFullYear() - 1}
                max={new Date().getFullYear() + 1}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            <IOSButton
              type="button"
              variant="secondary"
              onClick={() => void loadDetailedPreview()}
              disabled={loadingPreview || !isFormValid}
              className="px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {loadingPreview ? 'Loading Preview...' : '📊 Load Detailed Preview'}
            </IOSButton>
          </div>

          {loadingPreview && (
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="text-sm text-blue-700">Loading preview data...</p>
            </div>
          )}

          {detailedPreview && !loadingPreview && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-ui-muted">Total Billable Days</p>
                    <p className="text-lg font-semibold">{detailedPreview.summary.totalBillableDays}</p>
                  </div>
                  <div>
                    <p className="text-ui-muted">Total Refundable Days</p>
                    <p className="text-lg font-semibold">{detailedPreview.summary.totalRefundableDays}</p>
                  </div>
                  <div>
                    <p className="text-ui-muted">Estimated Total</p>
                    <p className="text-lg font-semibold text-green-600">
                      €{detailedPreview.summary.estimatedTotal.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-ui-muted">Estimated Refund</p>
                    <p className="text-lg font-semibold text-blue-600">
                      €{detailedPreview.summary.estimatedRefund.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200 rounded-md">
                <button
                  type="button"
                  onClick={() => setShowChildrenPreview((v) => !v)}
                  className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between rounded-t-md"
                >
                  <span className="font-medium">
                    Children Breakdown ({detailedPreview.children.length})
                  </span>
                  <span>{showChildrenPreview ? '▼' : '▶'}</span>
                </button>
                {showChildrenPreview && (
                  <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
                    {detailedPreview.children.map((child) => (
                      <div key={child.childId} className="p-4 hover:bg-gray-50">
                        <div className="flex items-center justify-between mb-2 gap-3">
                          <p className="font-medium">{child.childName}</p>
                          <div className="text-sm text-ui-muted">
                            <span className="text-green-600">
                              €{child.estimatedAmount.toFixed(2)}
                            </span>
                            {child.estimatedRefund > 0 && (
                              <span className="ml-2 text-blue-600">
                                (Refund: €{child.estimatedRefund.toFixed(2)})
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-ui-soft">
                          Billable: {child.billableDays} days | Refundable: {child.refundableDays} days
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {!detailedPreview && preview && !loadingPreview && (
            <div className="p-4 bg-gray-50 rounded-md space-y-2">
              <h3 className="font-medium mb-2">Basic Preview</h3>
              <p className="text-sm text-ui-muted">
                This will generate billing for all active children for{' '}
                <strong>
                  {getMonthName(form.month)} {form.year}
                </strong>
                .
              </p>
              <p className="text-sm text-ui-muted">
                Estimated children: <strong>{preview.estimatedChildren}</strong>
              </p>
              {preview.hasPricing === false && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ <strong>Warning:</strong> Some groups don't have lunch pricing set up. Bills
                    for those groups will show €0.00.
                  </p>
                  <Link
                    href="/admin/lunch/pricing"
                    className="text-sm text-yellow-800 underline hover:text-yellow-900 mt-1 inline-block"
                  >
                    Set up pricing →
                  </Link>
                </div>
              )}
              {preview.hasPricing === true && <div className="mt-2 text-sm text-green-700">✓ Lunch pricing is configured</div>}
            </div>
          )}

          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="flex gap-3 justify-end pt-4">
            <Link
              href="/admin/lunch/billing"
              className="px-4 py-2 text-slate-700 dark:text-slate-200 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
            <IOSButton type="submit" disabled={loading || !isFormValid} className="px-4 py-2">
              {loading ? 'Generating...' : 'Generate Billing'}
            </IOSButton>
          </div>
        </form>
      </IOSCard>
    </div>
  )
}

