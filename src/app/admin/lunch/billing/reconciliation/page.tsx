'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing.reconciliation'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'

type Reconciliation = {
  month: number
  year: number
  summary: {
    totalBills: number
    expectedTotal: number
    actualTotal: number
    difference: number
  }
  discrepancies: Array<any>
  missingAttendance: Array<any>
  missingPricing: Array<any>
  bills: Array<any>
}

export default function AdminLunchBillingReconciliationPage() {
  const { t } = useI18n()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [reconciliation, setReconciliation] = useState<Reconciliation | null>(null)

  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  })

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  const formatDate = (date: string) => new Date(date).toLocaleDateString()

  const loadReconciliation = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch(
        `/api/admin/lunch/billing/reconciliation?month=${encodeURIComponent(String(filters.month))}&year=${encodeURIComponent(
          String(filters.year),
        )}`,
      )
      const data = await res.json()
      if (data?.success && data?.reconciliation) {
        setReconciliation(data.reconciliation as Reconciliation)
      } else {
        throw new Error(data?.message || 'Failed to load reconciliation')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load reconciliation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/admin/lunch/billing" className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block">
          ← Back to Billing
        </Link>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-6 mb-6 max-w-3xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Month</label>
            <select
              value={filters.month}
              onChange={(e) => setFilters((p) => ({ ...p, month: Number(e.target.value) }))}
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-2">Year</label>
            <input
              value={filters.year}
              onChange={(e) => setFilters((p) => ({ ...p, year: Number(e.target.value) }))}
              type="number"
              min={new Date().getFullYear() - 1}
              max={new Date().getFullYear() + 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <IOSButton
              type="button"
              onClick={() => void loadReconciliation()}
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Reconciliation'}
            </IOSButton>
          </div>
        </div>
      </IOSCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="mb-6 max-w-3xl mx-auto">
          <ErrorAlert message={error} />
        </div>
      ) : reconciliation ? (
        <div className="space-y-6 max-w-7xl mx-auto px-2">
          <div className="bg-white rounded-lg shadow p-6 max-w-5xl mx-auto">
            <Heading size="md" className="mb-4">
              Summary
            </Heading>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-ui-muted">Total Bills</p>
                <p className="text-2xl font-semibold">{reconciliation.summary.totalBills}</p>
              </div>
              <div>
                <p className="text-sm text-ui-muted">Expected Total</p>
                <p className="text-2xl font-semibold text-green-600">€{reconciliation.summary.expectedTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-ui-muted">Actual Total</p>
                <p className="text-2xl font-semibold text-blue-600">€{reconciliation.summary.actualTotal.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-ui-muted">Difference</p>
                <p
                  className={[
                    'text-2xl font-semibold',
                    Math.abs(reconciliation.summary.difference) < 0.01
                      ? 'text-ui-muted'
                      : reconciliation.summary.difference > 0
                        ? 'text-red-600'
                        : 'text-green-600',
                  ].join(' ')}
                >
                  €{reconciliation.summary.difference.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {reconciliation.discrepancies.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 max-w-5xl mx-auto">
              <Heading size="md" className="mb-4 text-red-600">
                ⚠️ Discrepancies ({reconciliation.discrepancies.length})
              </Heading>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Child</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Expected</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Actual</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Difference</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Issue</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reconciliation.discrepancies.map((disc) => (
                      <tr key={disc.billId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50">{disc.childName}</td>
                        <td className="px-4 py-3 text-sm text-ui-muted">€{disc.expected.toFixed(2)}</td>
                        <td className="px-4 py-3 text-sm text-ui-muted">€{disc.actual.toFixed(2)}</td>
                        <td
                          className={[
                            'px-4 py-3 text-sm font-medium',
                            disc.difference > 0 ? 'text-red-600' : 'text-green-600',
                          ].join(' ')}
                        >
                          €{disc.difference.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-sm text-ui-muted">{disc.issue}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reconciliation.missingAttendance.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 max-w-5xl mx-auto">
              <Heading size="md" className="mb-4 text-yellow-600">
                ⚠️ Missing Attendance Records ({reconciliation.missingAttendance.length})
              </Heading>
              <div className="space-y-2">
                {reconciliation.missingAttendance.map((missing: any) => (
                  <div key={`${missing.childId}-${missing.date}`} className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm">
                      <strong>{missing.childName}</strong> - No attendance record for {formatDate(missing.date)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {reconciliation.missingPricing.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6 max-w-5xl mx-auto">
              <Heading size="md" className="mb-4 text-orange-600">
                ⚠️ Missing Pricing ({reconciliation.missingPricing.length})
              </Heading>
              <div className="space-y-2">
                {reconciliation.missingPricing.map((missing: any) => (
                  <div key={missing.groupId} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                    <p className="text-sm">
                      <strong>{missing.groupName}</strong> - No lunch pricing configured
                    </p>
                    <Link href="/admin/lunch/pricing" className="text-sm text-orange-800 underline hover:text-orange-900 mt-1 inline-block">
                      Set up pricing →
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 max-w-5xl mx-auto">
            <Heading size="md" className="mb-4">
              All Bills
            </Heading>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Child</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Expected</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Actual</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reconciliation.bills.map((bill: any) => (
                    <tr key={bill.billId} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-50">{bill.childName}</td>
                      <td className="px-4 py-3 text-sm text-ui-muted">€{bill.expected.toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-ui-muted">€{bill.actual.toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={[
                            'px-2 py-1 text-xs font-medium rounded-full',
                            Math.abs(bill.difference) < 0.01
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800',
                          ].join(' ')}
                        >
                          {Math.abs(bill.difference) < 0.01 ? 'Match' : 'Mismatch'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/admin/lunch/billing/${bill.billId}`} className="text-blue-600 hover:text-blue-700 text-sm">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

