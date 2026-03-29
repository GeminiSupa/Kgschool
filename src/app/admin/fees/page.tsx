'use client'

import { useI18n } from '@/i18n/I18nProvider'
import { pT } from '@/i18n/pT'

const ROUTE = 'admin.fees'

import React, { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMonthlyFeesStore } from '@/stores/monthlyFees'
import { useChildrenStore } from '@/stores/children'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { IOSButton } from '@/components/ui/IOSButton'
import { useToastStore } from '@/stores/toast'
import { downloadTextFile, toCsv } from '@/utils/export/csv'

export default function AdminFeesPage() {
  const { t } = useI18n()

  const router = useRouter()
  const { fees, loading, error, fetchFees } = useMonthlyFeesStore()
  const { children, fetchChildren } = useChildrenStore()
  const toast = useToastStore()
  
  const [filters, setFilters] = useState({
    month: 0,
    year: new Date().getFullYear(),
    status: ''
  })

  useEffect(() => {
    fetchFees(undefined, filters.month || undefined, filters.year || undefined)
    fetchChildren()
  }, [fetchFees, fetchChildren])

  const filteredFees = useMemo(() => {
    let result = fees
    if (filters.month > 0) result = result.filter(f => f.month === filters.month)
    if (filters.year) result = result.filter(f => f.year === filters.year)
    if (filters.status) result = result.filter(f => f.status === filters.status)
    return result
  }, [fees, filters])

  const getChildName = (childId: string) => {
    const child = children.find(c => c.id === childId)
    return child ? `${child.first_name} ${child.last_name}` : childId
  }

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('de-DE', { month: 'long' })
  }

  const formatFeeType = (type: string) => {
    const types: Record<string, string> = {
      tuition: 'Grundgebühr',
      lunch: 'Verpflegung',
      activities: 'Aktivitäten',
      other: 'Sonstiges'
    }
    return types[type] || type
  }

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: name === 'status' ? value : parseInt(value) || 0 }))
  }

  const applyFilters = (e: React.FormEvent) => {
    e.preventDefault()
    fetchFees(undefined, filters.month || undefined, filters.year || undefined)
  }

  const exportFilteredCsv = () => {
    const rows = [
      ['Kind', 'Monat', 'Jahr', 'Art', 'Betrag', 'Fälligkeit', 'Status'],
      ...filteredFees.map((f) => [
        getChildName(f.child_id),
        getMonthName(f.month),
        f.year,
        formatFeeType(f.fee_type),
        f.amount,
        new Date(f.due_date).toLocaleDateString('de-DE'),
        f.status,
      ]),
    ]
    const csv = toCsv(rows, { delimiter: ';', includeBom: true })
    downloadTextFile(`gebuehren-${filters.month || 'alle'}-${filters.year || 'alle'}.csv`, csv, 'text/csv;charset=utf-8')
    toast.push({ type: 'success', title: 'Gebühren', message: 'CSV exportiert.' })
  }

  if (loading && fees.length === 0) return <div className="flex justify-center py-24"><LoadingSpinner /></div>

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Heading size="xl" className="text-gray-900">{t(pT(ROUTE))}</Heading>
          <p className="text-sm text-gray-500 mt-1">Übersicht und Verwaltung aller monatlichen Gebühren.</p>
        </div>
        <div className="flex gap-3">
          <IOSButton variant="secondary" className="px-5 py-2.5 text-sm font-bold flex items-center gap-2" onClick={exportFilteredCsv}>
            <span>📥</span>
            <span>CSV Export</span>
          </IOSButton>
          <Link href="/admin/fees/config">
            <IOSButton variant="secondary" className="px-5 py-2.5 text-sm font-bold flex items-center gap-2">
              <span>⚙️</span>
              <span>Konfiguration</span>
            </IOSButton>
          </Link>
          <Link href="/admin/fees/generate">
            <IOSButton variant="primary" className="px-6 py-2.5 text-sm font-bold flex items-center gap-2">
              <span>➕</span>
              <span>Gebühren generieren</span>
            </IOSButton>
          </Link>
        </div>
      </div>

      <IOSCard className="p-6 mb-8 border-black/5 shadow-sm bg-[#f2f2f7]/30">
        <form onSubmit={applyFilters} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Monat</label>
            <select
              name="month"
              value={filters.month}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-white border border-black/5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
            >
              <option value="0">Alle Monate</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Jahr</label>
            <input
              name="year"
              type="number"
              value={filters.year}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-white border border-black/5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-black/40 uppercase tracking-widest mb-1.5 ml-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 bg-white border border-black/5 rounded-xl text-sm font-bold text-gray-800 outline-none focus:ring-2 focus:ring-[#667eea] transition-all"
            >
              <option value="">Alle Status</option>
              <option value="pending">Ausstehend</option>
              <option value="paid">Bezahlt</option>
              <option value="overdue">Überfällig</option>
              <option value="waived">Erlassen</option>
            </select>
          </div>
          <IOSButton type="submit" variant="primary" className="w-full py-2.5 font-black text-xs uppercase tracking-widest">
            Filter anwenden
          </IOSButton>
        </form>
      </IOSCard>

      {error ? (
        <ErrorAlert message={error.message || 'Fehler beim Laden der Gebühren'} />
      ) : filteredFees.length === 0 ? (
        <IOSCard className="p-16 text-center bg-gray-50/50">
          <div className="text-5xl opacity-40 mb-4">💰</div>
          <p className="text-gray-500 font-medium">Keine Gebühren für die gewählten Filter gefunden.</p>
        </IOSCard>
      ) : (
        <IOSCard className="p-0 overflow-hidden shadow-sm border-black/5">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Kind</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Zeitraum</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Art</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Betrag</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Fälligkeit</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5">Status</th>
                            <th className="px-6 py-4 text-[10px] font-black text-black/30 uppercase tracking-widest border-b border-black/5"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 font-medium text-sm text-gray-700">
                        {filteredFees.map(fee => (
                            <tr key={fee.id} className="hover:bg-gray-50/80 transition-colors group">
                                <td className="px-6 py-5 font-black text-gray-900 group-hover:text-[#667eea] transition-colors">{getChildName(fee.child_id)}</td>
                                <td className="px-6 py-5 whitespace-nowrap">{getMonthName(fee.month)} {fee.year}</td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className="px-2 py-0.5 bg-gray-100 text-[10px] font-black text-gray-600 rounded-md uppercase tracking-widest">
                                        {formatFeeType(fee.fee_type)}
                                    </span>
                                </td>
                                <td className="px-6 py-5 font-black text-gray-900">€{fee.amount.toFixed(2)}</td>
                                <td className="px-6 py-5 whitespace-nowrap text-gray-400">{new Date(fee.due_date).toLocaleDateString('de-DE')}</td>
                                <td className="px-6 py-5 whitespace-nowrap">
                                    <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md ${
                                        fee.status === 'paid' ? 'bg-green-50 text-green-700 border border-green-100' :
                                        fee.status === 'overdue' ? 'bg-red-50 text-red-700 border border-red-100' :
                                        fee.status === 'waived' ? 'bg-gray-50 text-gray-500 border border-gray-100' :
                                        'bg-amber-50 text-amber-700 border border-amber-100'
                                    }`}>
                                        {fee.status === 'paid' ? 'Bezahlt' : fee.status === 'overdue' ? 'Fällig' : fee.status === 'waived' ? 'Erlassen' : 'Offen'}
                                    </span>
                                </td>
                                <td className="px-6 py-5 text-right">
                                    <Link href={`/admin/fees/${fee.id}`} className="text-[#667eea]/40 hover:text-[#667eea] transition-colors">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                        </svg>
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
