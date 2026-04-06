'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.lunch.billing.reports'

import React, { useState } from 'react'
import Link from 'next/link'
import { Heading } from '@/components/ui/Heading'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useToastStore } from '@/stores/toast'
import { downloadTextFile, toCsv } from '@/utils/export/csv'

type ReportMonth = {
  month: number
  year: number
  totalRevenue: number
  totalPaid: number
  totalRefunds: number
  billsCount: number
  pendingAmount?: number
}

type ReportData = {
  totalRevenue: number
  totalPaid: number
  totalRefunds: number
  pendingAmount: number
  monthlyBreakdown: ReportMonth[]
  billsCount: number
}

function getMonthName(month: number) {
  const d = new Date(2000, month - 1, 1)
  return d.toLocaleString('default', { month: 'long' })
}

export default function AdminLunchBillingReportsPage() {
  const { t } = useI18n()

  const today = new Date()
  const toast = useToastStore()

  const [loading, setLoading] = useState(false)
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({
    startMonth: today.getMonth() + 1,
    startYear: today.getFullYear(),
    endMonth: today.getMonth() + 1,
    endYear: today.getFullYear(),
  })

  const generateReport = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(
        `/api/admin/lunch/billing/reports?start_month=${encodeURIComponent(String(filters.startMonth))}&start_year=${encodeURIComponent(
          String(filters.startYear),
        )}&end_month=${encodeURIComponent(String(filters.endMonth))}&end_year=${encodeURIComponent(String(filters.endYear))}`,
      )
      const data = await res.json()
      if (data && data.monthlyBreakdown) {
        setReportData(data as ReportData)
      } else if (data?.success === false) {
        throw new Error(data?.message || 'Failed to generate report')
      } else {
        setReportData(null)
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Bericht konnte nicht erstellt werden.'
      setError(message)
      toast.push({ type: 'error', title: 'Abrechnung', message })
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!reportData) return

    const rows = [
      ['Monat/Jahr', 'Umsatz', 'Bezahlt', 'Erstattungen', 'Offen', 'Anzahl Rechnungen'],
      ...reportData.monthlyBreakdown.map((m) => [
        `${getMonthName(m.month)} ${m.year}`,
        m.totalRevenue,
        m.totalPaid,
        m.totalRefunds,
        m.pendingAmount ?? (m.totalRevenue - m.totalPaid),
        m.billsCount,
      ]),
    ]

    const csv = toCsv(rows, { delimiter: ';', includeBom: true })
    downloadTextFile(
      `abrechnung-bericht-${filters.startMonth}-${filters.startYear}-bis-${filters.endMonth}-${filters.endYear}.csv`,
      csv,
      'text/csv;charset=utf-8',
    )
    toast.push({ type: 'success', title: 'Abrechnung', message: 'CSV exportiert.' })
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="mb-6">
        <Link href="/admin/lunch/billing" className="text-ui-muted hover:text-slate-900 dark:text-slate-50 mb-4 inline-block">
          ← Zurück zur Abrechnung
        </Link>
        <Heading size="xl">{t(pT(ROUTE))}</Heading>
      </div>

      <IOSCard className="bg-white rounded-lg shadow p-4 mb-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Startmonat</label>
            <select
              value={filters.startMonth}
              onChange={(e) => setFilters((p) => ({ ...p, startMonth: Number(e.target.value) }))}
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Startjahr</label>
            <input
              value={filters.startYear}
              onChange={(e) => setFilters((p) => ({ ...p, startYear: Number(e.target.value) }))}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Endmonat</label>
            <select
              value={filters.endMonth}
              onChange={(e) => setFilters((p) => ({ ...p, endMonth: Number(e.target.value) }))}
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
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">Endjahr</label>
            <input
              value={filters.endYear}
              onChange={(e) => setFilters((p) => ({ ...p, endYear: Number(e.target.value) }))}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <IOSButton
            type="button"
            onClick={() => void generateReport()}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Erstellt…' : 'Bericht erstellen'}
          </IOSButton>
          {reportData && (
            <IOSButton type="button" onClick={exportToCSV} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
              📥 CSV exportieren
            </IOSButton>
          )}
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </IOSCard>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : reportData ? (
        <div className="space-y-6 max-w-6xl mx-auto px-2">
          <IOSCard className="bg-white rounded-lg shadow p-6">
            <Heading size="md" className="mb-4">
              Übersicht
            </Heading>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-ui-muted">Umsatz (gesamt)</p>
                <p className="text-2xl font-bold text-blue-600">€{reportData.totalRevenue.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-green-50 rounded-md">
                <p className="text-sm text-ui-muted">Bezahlt</p>
                <p className="text-2xl font-bold text-green-600">€{reportData.totalPaid.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-yellow-50 rounded-md">
                <p className="text-sm text-ui-muted">Erstattungen</p>
                <p className="text-2xl font-bold text-yellow-600">€{reportData.totalRefunds.toFixed(2)}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-md">
                <p className="text-sm text-ui-muted">Offen</p>
                <p className="text-2xl font-bold text-ui-muted">€{reportData.pendingAmount.toFixed(2)}</p>
              </div>
            </div>
          </IOSCard>

          <IOSCard className="bg-white rounded-lg shadow p-6">
            <Heading size="md" className="mb-4">
              Monatsübersicht
            </Heading>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">
                      Monat/Jahr
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">
                      Umsatz
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">Bezahlt</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">
                      Erstattungen
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">
                      Pending
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-ui-soft uppercase">
                      Bills Count
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.monthlyBreakdown.map((m) => (
                    <tr key={`${m.month}-${m.year}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                        {getMonthName(m.month)} {m.year}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                        €{m.totalRevenue.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600">
                        €{m.totalPaid.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-yellow-600">
                        €{m.totalRefunds.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-ui-muted">
                        €{(m.pendingAmount || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-ui-soft">{m.billsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </IOSCard>
        </div>
      ) : (
        !loading && (
          <IOSCard className="bg-white rounded-lg shadow p-8 text-center text-ui-soft max-w-6xl mx-auto">
            Select date range and click "Generate Report" to view billing reports.
          </IOSCard>
        )
      )}
    </div>
  )
}

