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
            <div className="p-8 text-center text-gray-500">No payroll records found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Overtime</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bonuses</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Salary</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myPayroll.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {getMonthName(record.month)} {record.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{record.base_salary.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        €{record.overtime_amount.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        €{record.bonuses.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        €{record.deductions.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        €{record.net_salary.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={[
                            'px-2 py-1 text-xs font-medium rounded-full',
                            record.status === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'approved'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-yellow-100 text-yellow-800',
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

