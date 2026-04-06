'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing'

import Link from 'next/link'
import React, { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { useChildrenStore, type Child } from '@/stores/children'

export default function AdminLunchBillingPage() {
  const { t } = useI18n()

  const supabase = useMemo(() => createClient(), [])
  const { profile } = useAuth()
  const childrenStore = useChildrenStore()

  const { children, fetchChildren } = childrenStore

  type MonthlyBilling = {
    id: string
    child_id: string
    month: number
    year: number
    total_amount: number
    paid_amount: number
    refund_amount: number
    status: 'pending' | 'paid' | 'overdue' | 'cancelled'
    billing_date: string
    due_date: string
    document_url?: string
    notes?: string
    created_at: string
    updated_at: string
  }

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bills, setBills] = useState<MonthlyBilling[]>([])

  const [filters, setFilters] = useState<{
    month: number | null
    year: number
    status: string
  }>(() => ({
    month: null,
    year: new Date().getFullYear(),
    status: '',
  }))

  const getChildName = (childId: string) => {
    const child = children.find((c: Child) => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  const fetchBills = async () => {
    setLoading(true)
    setError('')

    try {
      let query = supabase
        .from('monthly_billing')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      // Optional filter by kita: try to mimic Nuxt join approach.
      if (profile?.kita_id) {
        query = supabase
          .from('monthly_billing')
          .select('*, children!inner(kita_id)')
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .eq('children.kita_id', profile.kita_id) as any
      }

      if (filters.month) {
        query = (query as any).eq('month', filters.month)
      }
      if (filters.year) {
        query = (query as any).eq('year', filters.year)
      }
      if (filters.status) {
        query = (query as any).eq('status', filters.status)
      }

      const { data, error: queryError } = await query
      if (queryError) throw queryError

      const raw = (data || []) as any[]
      const normalized = raw.map((item) => {
        if (item.children) {
          const { children: _children, ...rest } = item
          return rest
        }
        return item
      })

      setBills(normalized as MonthlyBilling[])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load billing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      await fetchChildren(profile?.kita_id)
      await fetchBills()
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.kita_id])

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-10">
        <Link
          href="/admin/lunch/orders"
          className="text-sm font-semibold text-[#667eea] mb-2 inline-flex items-center gap-1 hover:translate-x-[-4px] transition-transform"
        >
          ← Zurück zu Bestellungen
        </Link>
        <Heading size="xl" className="text-slate-900 dark:text-slate-50 mt-2 tracking-tight">{t(pT(ROUTE))}</Heading>
        <p className="text-sm text-ui-soft mt-1">
          Übersicht der Monatsabrechnungen. Nutze die Aktionen, um Abrechnungen und Berichte zu erstellen.
        </p>

        <div className="flex flex-wrap gap-2 mt-4">
          <Link
            href="/admin/lunch/billing/generate"
            className="relative border-none font-semibold cursor-pointer transition-all duration-200 overflow-hidden select-none active:scale-[0.98] bg-linear-to-br from-[#667eea] to-[#764ba2] text-white shadow-[0_4px_14px_0_rgba(102,126,234,0.39)] hover:translate-y-[-2px] hover:shadow-[0_6px_20px_0_rgba(102,126,234,0.5)] active:translate-y-0 active:shadow-[0_2px_10px_0_rgba(102,126,234,0.3)] px-6 py-3 text-base rounded-[12px]"
          >
            Generate
          </Link>
          <Link
            href="/admin/lunch/billing/reconciliation"
            className="relative border-none font-semibold cursor-pointer transition-all duration-200 overflow-hidden select-none active:scale-[0.98] bg-white/20 backdrop-blur-[10px] text-[#667eea] border border-[#667eea]/30 px-6 py-3 text-base rounded-[12px]"
          >
            Reconciliation
          </Link>
          <Link
            href="/admin/lunch/billing/refunds"
            className="relative border-none font-semibold cursor-pointer transition-all duration-200 overflow-hidden select-none active:scale-[0.98] bg-white/20 backdrop-blur-[10px] text-[#667eea] border border-[#667eea]/30 px-6 py-3 text-base rounded-[12px]"
          >
            Refunds
          </Link>
          <Link
            href="/admin/lunch/billing/reports"
            className="relative border-none font-semibold cursor-pointer transition-all duration-200 overflow-hidden select-none active:scale-[0.98] bg-white/20 backdrop-blur-[10px] text-[#667eea] border border-[#667eea]/30 px-6 py-3 text-base rounded-[12px]"
          >
            Reports
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Month</label>
            <select
              value={filters.month ?? ''}
              onChange={(e) => {
                const v = e.target.value
                setFilters((p) => ({ ...p, month: v ? Number(v) : null }))
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Year</label>
            <input
              value={filters.year}
              onChange={(e) => setFilters((p) => ({ ...p, year: Number(e.target.value) }))}
              type="number"
              min={new Date().getFullYear() - 1}
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
          <div className="flex items-end">
            <IOSButton
              type="button"
              variant="primary"
              onClick={() => void fetchBills()}
              className="w-full flex justify-center"
              disabled={loading}
            >
              Apply Filters
            </IOSButton>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error} />
      ) : bills.length === 0 ? (
        <IOSCard className="p-8 text-center bg-gray-50/30 border-black/5">
          <p className="text-ui-muted font-semibold">No bills found.</p>
        </IOSCard>
      ) : (
        <IOSCard className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Child</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Month/Year</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Total Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Paid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Refund</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-ui-soft uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                      {getChildName(bill.child_id)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-ui-soft">
                      {getMonthName(bill.month)} {bill.year}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                      €{bill.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-ui-soft">
                      €{bill.paid_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-green-600">
                      €{bill.refund_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={[
                          'inline-block mt-1 px-3 py-1 text-sm font-medium rounded-full',
                          bill.status === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : bill.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800',
                        ].join(' ')}
                      >
                        {bill.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-ui-soft">
                      {formatDate(bill.due_date)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        href={`/admin/lunch/billing/${bill.id}`}
                        className="p-2 text-[#667eea] hover:underline"
                        title="View Details"
                      >
                        👁️
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </IOSCard>
      )}
    </div>
  )
}
