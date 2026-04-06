'use client'

import React, { useEffect } from 'react'
import { Heading } from '@/components/ui/Heading'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ErrorAlert } from '@/components/common/ErrorAlert'
import { IOSCard } from '@/components/ui/IOSCard'
import { useAuth } from '@/hooks/useAuth'
import { usePayrollStore } from '@/stores/payroll'

export default function SupportPayrollPage() {
  const { user } = useAuth()
  const payrollStore = usePayrollStore()
  const { payroll, loading, error, fetchPayroll } = payrollStore

  useEffect(() => {
    if (user?.id) fetchPayroll(user.id)
  }, [user?.id, fetchPayroll])

  const myPayroll = payroll

  const getMonthName = (month: number) => {
    const date = new Date(2000, month - 1, 1)
    return date.toLocaleString('default', { month: 'long' })
  }

  return (
    <div>
      <Heading size="xl" className="mb-6">
        My Payroll
      </Heading>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <ErrorAlert message={error.message || 'Failed to load payroll'} />
      ) : (
        <IOSCard className="p-0 overflow-hidden">
          {myPayroll.length === 0 ? (
            <div className="p-8 text-center text-ui-soft">No payroll records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-slate-50 dark:bg-white/5">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Base Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Overtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Bonuses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-ui-soft uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background">
                  {myPayroll.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50 dark:hover:bg-white/5">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-50">
                        {getMonthName(record.month)} {record.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                        €{record.base_salary.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-50">
                        €{record.overtime_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-600 dark:text-emerald-400">
                        €{record.bonuses.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                        €{record.deductions.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-50">
                        €{record.net_salary.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={[
                            'px-2 py-1 text-xs font-medium rounded-full',
                            record.status === 'paid'
                              ? 'bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200'
                              : record.status === 'approved'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/50 dark:text-yellow-200',
                          ].join(' ')}
                        >
                          {record.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </IOSCard>
      )}
    </div>
  )
}

